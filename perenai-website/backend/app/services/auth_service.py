
import logging
import requests
from urllib.parse import urlencode

from google.oauth2 import id_token
from google.auth.transport import requests as grequests
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services import user_service

logger = logging.getLogger(__name__)


def verify_google_token(token: str) -> dict:
    payload = id_token.verify_oauth2_token(token, grequests.Request(), settings.resolved_google_client_id)
    return payload


def build_google_authorize_url(state: str | None = None) -> str:
    if not settings.has_google_oauth:
        if settings.is_production:
            raise ValueError("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required in production")
        # Dev/demo only
        params = {"code": "mock_google_auth_code_12345"}
        if state:
            params["state"] = state
        query = urlencode(params)
        return f"{settings.google_callback_url}?{query}"

    params = {
        "client_id": settings.resolved_google_client_id,
        "redirect_uri": settings.google_callback_url,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    if state:
        params["state"] = state
    query = urlencode(params)
    return f"https://accounts.google.com/o/oauth2/v2/auth?{query}"


def exchange_code_for_google_identity(code: str) -> dict:
    if code == "mock_google_auth_code_12345":
        if settings.is_production:
            raise ValueError("Mock Google OAuth is disabled in production")
        return {
            "email": "demo.user@peren.ai",
            "name": "Demo User",
            "sub": "mock_google_id_987654321"
        }

    if not settings.resolved_google_client_id or not settings.resolved_google_client_secret:
        raise ValueError("Google OAuth client credentials are missing")

    token_response = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": settings.resolved_google_client_id,
            "client_secret": settings.resolved_google_client_secret,
            "redirect_uri": settings.google_callback_url,
            "grant_type": "authorization_code",
        },
        timeout=15,
    )
    if not token_response.ok:
        logger.error(
            "[OAuth] Google token exchange failed (%s): %s",
            token_response.status_code,
            token_response.text,
        )
        token_response.raise_for_status()
    token_payload = token_response.json()

    google_id_token = token_payload.get("id_token")
    if not google_id_token:
        raise ValueError("Google token response missing id_token")

    return verify_google_token(google_id_token)


def login_with_google(db: Session, token: str) -> tuple[User, str]:
    payload = verify_google_token(token)
    return login_with_google_payload(db, payload)


def login_with_google_code(db: Session, code: str) -> tuple[User, str]:
    payload = exchange_code_for_google_identity(code)
    return login_with_google_payload(db, payload)


def login_with_google_payload(db: Session, payload: dict) -> tuple[User, str]:
    email = payload.get("email")
    if not email:
        raise ValueError("Invalid Google token payload")

    name = payload.get("name") or email.split("@")[0]
    google_id = payload.get("sub")
    picture_url = payload.get("picture")

    if not email or not google_id:
        raise ValueError("Invalid Google token payload")

    user = user_service.get_by_email(db, email)
    if not user:
        user = user_service.create_google_user(db, email=email, name=name, google_id=google_id, picture_url=picture_url)
    elif picture_url and not user.picture_url:
        user.picture_url = picture_url
        db.add(user)
        db.commit()

    jwt_token = create_access_token(str(user.id))
    return user, jwt_token


def register_user(db: Session, payload: RegisterRequest) -> str:
    existing = user_service.get_by_email(db, payload.email)
    if existing:
        raise ValueError("Email already registered")

    password_hash = get_password_hash(payload.password)
    user = user_service.create_email_user(db, payload.email, payload.name, password_hash, profile_type=payload.profile_type)
    return create_access_token(str(user.id))


def login_user(db: Session, payload: LoginRequest) -> str:
    user = user_service.get_by_email(db, payload.email)
    if not user or not user.password:
        raise ValueError("Invalid credentials")

    if not verify_password(payload.password, user.password):
        raise ValueError("Invalid credentials")

    return create_access_token(str(user.id))
