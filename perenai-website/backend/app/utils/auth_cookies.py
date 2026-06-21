from fastapi import Response
from fastapi.responses import JSONResponse, RedirectResponse

from app.core.config import settings

SESSION_COOKIE = "peren_session"
OAUTH_STATE_COOKIE = "oauth_state"


def _cookie_kwargs(max_age: int) -> dict:
    return {
        "httponly": True,
        "secure": settings.is_production,
        "samesite": "lax",
        "max_age": max_age,
        "path": "/",
    }


def _delete_cookie_kwargs() -> dict:
    return {
        "path": "/",
        "secure": settings.is_production,
        "samesite": "lax",
    }


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        **_cookie_kwargs(settings.access_token_expire_minutes * 60),
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(key=SESSION_COOKIE, **_delete_cookie_kwargs())


def set_oauth_state_cookie(response: Response, state: str) -> None:
    response.set_cookie(key=OAUTH_STATE_COOKIE, value=state, **_cookie_kwargs(600))


def clear_oauth_state_cookie(response: Response) -> None:
    response.delete_cookie(key=OAUTH_STATE_COOKIE, **_delete_cookie_kwargs())


def json_with_auth_cookie(token: str, content: dict | None = None) -> JSONResponse:
    payload = content or {"access_token": token, "token_type": "bearer"}
    response = JSONResponse(content=payload)
    set_auth_cookie(response, token)
    return response


def redirect_with_auth_cookie(url: str, token: str) -> RedirectResponse:
    response = RedirectResponse(url=url, status_code=307)
    set_auth_cookie(response, token)
    clear_oauth_state_cookie(response)
    return response
