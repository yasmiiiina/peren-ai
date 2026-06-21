"""
Google OAuth — server-side authorization code flow.

Dev redirect URI (via Vite proxy): http://localhost:5173/auth/google/callback
Prod redirect URI: https://YOUR-DOMAIN/api/auth/google/callback

Register the exact GOOGLE_CALLBACK_URL in Google Cloud Console.
"""

import logging
import secrets

from fastapi import APIRouter, Cookie, Depends, HTTPException, status
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.schemas.auth import GoogleAuthRequest, LoginRequest, RegisterRequest, TokenResponse
from app.services.auth_service import (
    build_google_authorize_url,
    login_user,
    login_with_google,
    login_with_google_code,
    register_user,
)
from app.utils.auth_cookies import (
    OAUTH_STATE_COOKIE,
    clear_auth_cookie,
    clear_oauth_state_cookie,
    json_with_auth_cookie,
    redirect_with_auth_cookie,
    set_oauth_state_cookie,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


def _login_failure_redirect(error_code: str = "google_auth_failed") -> RedirectResponse:
    origin = settings.frontend_origin.rstrip("/")
    response = RedirectResponse(
        url=f"{origin}/login?error={error_code}",
        status_code=status.HTTP_307_TEMPORARY_REDIRECT,
    )
    clear_oauth_state_cookie(response)
    return response


def _is_valid_oauth_state(state: str | None, stored_state: str | None) -> bool:
    if not settings.has_google_oauth:
        return True
    if not state or not stored_state:
        return False
    return secrets.compare_digest(state, stored_state)


@router.get("/google/login")
def google_login_redirect():
    state = secrets.token_urlsafe(32)
    try:
        authorize_url = build_google_authorize_url(state=state)
    except Exception as exc:
        logger.error("[OAuth] Failed to build authorize URL: %s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    logger.info("[OAuth] Redirecting user to Google authorize URL")
    response = RedirectResponse(url=authorize_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)
    set_oauth_state_cookie(response, state)
    return response


@router.get("/google/callback")
def google_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    oauth_state: str | None = Cookie(default=None, alias=OAUTH_STATE_COOKIE),
    db: Session = Depends(get_db),
):
    if error:
        logger.warning("[OAuth] Google returned error: %s", error)
        return _login_failure_redirect(error if error.startswith("google_") else "google_auth_denied")

    if not code:
        logger.warning("[OAuth] Callback received without authorization code")
        return _login_failure_redirect("google_auth_missing_code")

    if not _is_valid_oauth_state(state, oauth_state):
        logger.warning("[OAuth] State mismatch — possible CSRF or stale session (state=%s)", state)
        return _login_failure_redirect("google_auth_state_invalid")

    try:
        _, access_token = login_with_google_code(db, code)
        frontend_callback = f"{settings.frontend_origin.rstrip('/')}{settings.frontend_google_callback_path}"
        logger.info("[OAuth] Google login successful, redirecting to %s", frontend_callback)
        return redirect_with_auth_cookie(frontend_callback, access_token)
    except Exception as exc:
        logger.exception("[OAuth] Token exchange failed: %s", exc)
        return _login_failure_redirect("google_auth_failed")


@router.post("/google", response_model=TokenResponse)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        _, access_token = login_with_google(db, payload.token)
        return json_with_auth_cookie(access_token)
    except Exception as exc:
        logger.error("[OAuth] ID token login failed: %s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    try:
        access_token = register_user(db, payload)
        return json_with_auth_cookie(access_token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        access_token = login_user(db, payload)
        return json_with_auth_cookie(access_token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


@router.post("/logout")
def logout():
    response = JSONResponse(content={"status": "ok"})
    clear_auth_cookie(response)
    return response
