import hashlib
import hmac
import secrets
import uuid
from typing import Any
from urllib.parse import urlencode

import requests

from app.core.config import settings

PLAN_AMOUNTS_MAD = {
    "monthly": 99.0,
    "quarterly": 279.0,
    "yearly": 468.0,
}


def is_payzone_configured() -> bool:
    return bool(settings.payzone_merchant_id and settings.payzone_secret_key)


def generate_order_id(user_id: int) -> str:
    return f"peren_{user_id}_{uuid.uuid4().hex[:12]}"


def resolve_amount(plan_type: str) -> float:
    return PLAN_AMOUNTS_MAD.get(plan_type, PLAN_AMOUNTS_MAD["monthly"])


def build_signed_params(order_id: str, amount: float, user_email: str, plan_type: str) -> dict[str, str]:
    return {
        "merchantAccount": settings.payzone_merchant_id,
        "orderId": order_id,
        "amount": f"{amount:.2f}",
        "currency": "MAD",
        "customerEmail": user_email,
        "description": f"PEREN AI Premium {plan_type}",
        "callbackUrl": settings.payzone_callback_url,
        "successUrl": settings.payzone_return_success_url,
        "failureUrl": settings.payzone_return_failure_url,
    }


def compute_signature(params: dict[str, str]) -> str:
    payload = "+".join(str(params[key]) for key in sorted(params))
    return hmac.new(
        settings.payzone_secret_key.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def verify_signature(params: dict[str, Any]) -> bool:
    if not is_payzone_configured():
        return False
    received = str(params.get("signature") or params.get("hash") or "")
    if not received:
        return False
    unsigned = {k: str(v) for k, v in params.items() if k not in {"signature", "hash"}}
    expected = compute_signature(unsigned)
    return hmac.compare_digest(received.lower(), expected.lower())


def build_redirect_payment_url(params: dict[str, str], signature: str) -> str:
    signed = {**params, "signature": signature}
    return f"{settings.payzone_base_url}?{urlencode(signed)}"


def try_payment_page_api(params: dict[str, str]) -> str | None:
    """Optional Payment Page API call when PAYZONE_API_URL is configured."""
    if not settings.payzone_api_url:
        return None

    try:
        response = requests.post(
            f"{settings.payzone_api_url.rstrip('/')}/payment",
            json=params,
            auth=(settings.payzone_merchant_id, settings.payzone_secret_key),
            timeout=20,
        )
        if not response.ok:
            return None
        data = response.json()
        return data.get("paymentUrl") or data.get("payment_url") or data.get("redirectUrl")
    except requests.RequestException:
        return None


def initialize_payment(order_id: str, amount: float, user_email: str, plan_type: str) -> dict[str, str | None]:
    params = build_signed_params(order_id, amount, user_email, plan_type)
    signature = compute_signature(params)

    payment_url = try_payment_page_api({**params, "signature": signature})
    if not payment_url:
        payment_url = build_redirect_payment_url(params, signature)

    return {
        "mode": "redirect",
        "order_id": order_id,
        "payment_url": payment_url,
    }


def initialize_mock_payment(order_id: str) -> dict[str, str | None]:
    return {
        "mode": "mock",
        "order_id": order_id,
        "payment_url": None,
    }


def generate_webhook_secret_token() -> str:
    return secrets.token_urlsafe(24)
