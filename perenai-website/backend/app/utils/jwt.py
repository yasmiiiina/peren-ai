from jose import JWTError, jwt

from app.core.config import settings


def verify_jwt(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        return None
