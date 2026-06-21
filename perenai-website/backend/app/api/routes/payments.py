from datetime import datetime, timedelta
from typing import Any

import requests
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models.payment import Payment
from app.models.subscription import Subscription
from app.models.user import User
from app.services.payzone_service import (
    generate_order_id,
    initialize_mock_payment,
    initialize_payment,
    is_payzone_configured,
    resolve_amount,
    verify_signature,
)

router = APIRouter(prefix="/payments", tags=["payments"])

# -----------------
# Payzone / Checkout
# -----------------

class InitializeRequest(BaseModel):
    plan_type: str  # monthly | quarterly | yearly


class InitializeResponse(BaseModel):
    mode: str
    order_id: str
    payment_url: str | None = None
    session_id: str | None = None


class WebhookMockRequest(BaseModel):
    session_id: str


class CheckoutRequest(BaseModel):
    plan_type: str


class CheckoutResponse(BaseModel):
    session_id: str
    message: str


class PayPalVerifyRequest(BaseModel):
    subscription_id: str


def _upsert_pending_subscription(db: Session, user: User, plan_type: str) -> Subscription:
    existing_sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    end_delta = timedelta(days=365) if plan_type == "yearly" else timedelta(days=90 if plan_type == "quarterly" else 30)

    if not existing_sub:
        existing_sub = Subscription(
            user_id=user.id,
            plan_type=plan_type,
            status="pending",
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + end_delta,
        )
        db.add(existing_sub)
    else:
        existing_sub.plan_type = plan_type
        existing_sub.status = "pending"
        existing_sub.end_date = datetime.utcnow() + end_delta

    return existing_sub


def _activate_premium(db: Session, user: User, subscription: Subscription) -> None:
    subscription.status = "active"
    user.is_premium = True
    user.subscription_tier = "premium"
    user.payment_status = "paid"
    db.commit()


def _find_payment_context(db: Session, order_id: str) -> tuple[Payment, User, Subscription] | tuple[None, None, None]:
    payment = db.query(Payment).filter(Payment.transaction_id == order_id).first()
    if not payment:
        return None, None, None

    user = db.query(User).filter(User.id == payment.user_id).first()
    subscription = db.query(Subscription).filter(Subscription.user_id == payment.user_id).first()
    if not user or not subscription:
        return None, None, None
    return payment, user, subscription


@router.post("/initialize", response_model=InitializeResponse)
def initialize_checkout(
    payload: InitializeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan_type = payload.plan_type
    amount = resolve_amount(plan_type)
    order_id = generate_order_id(current_user.id)

    _upsert_pending_subscription(db, current_user, plan_type)

    payment = Payment(
        user_id=current_user.id,
        transaction_id=order_id,
        amount=amount,
        status="pending",
    )
    db.add(payment)
    db.commit()

    if is_payzone_configured():
        result = initialize_payment(order_id, amount, current_user.email, plan_type)
        return InitializeResponse(
            mode=result["mode"],
            order_id=result["order_id"],
            payment_url=result["payment_url"],
            session_id=order_id,
        )

    if settings.is_production:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payzone is not configured",
        )

    result = initialize_mock_payment(order_id)
    return InitializeResponse(
        mode=result["mode"],
        order_id=result["order_id"],
        payment_url=result["payment_url"],
        session_id=order_id,
    )


@router.post("/checkout", response_model=CheckoutResponse)
def create_checkout_session(
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Backward-compatible alias for older clients."""
    init = initialize_checkout(InitializeRequest(plan_type=payload.plan_type), db, current_user)
    return CheckoutResponse(session_id=init.order_id, message="Checkout session created successfully")


def _complete_order(db: Session, order_id: str) -> dict[str, str]:
    payment, user, subscription = _find_payment_context(db, order_id)
    if not payment or not user or not subscription:
        return {"status": "error", "message": "Order not found"}

    payment.status = "success"
    _activate_premium(db, user, subscription)
    return {"status": "success", "message": "Payment confirmed", "order_id": order_id}


@router.post("/webhook")
def payment_webhook(
    payload: WebhookMockRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    if settings.is_production and not is_payzone_configured():
        secret = request.headers.get("X-Webhook-Secret", "")
        if not settings.payment_webhook_secret or secret != settings.payment_webhook_secret:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid webhook secret")

    return _complete_order(db, payload.session_id)


@router.api_route("/callback", methods=["GET", "POST"])
async def payzone_callback(request: Request, db: Session = Depends(get_db)):
    if request.method == "POST":
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            params = await request.json()
        else:
            form = await request.form()
            params = dict(form)
    else:
        params = dict(request.query_params)

    order_id = str(params.get("orderId") or params.get("order_id") or params.get("session_id") or "")
    status_value = str(params.get("status") or params.get("paymentStatus") or "").lower()

    if settings.is_production and not is_payzone_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payzone is not configured",
        )

    if is_payzone_configured() and not verify_signature(params):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Payzone signature")

    if status_value in {"success", "paid", "approved", "completed", "ok"} and order_id:
        _complete_order(db, order_id)
        return RedirectResponse(url=settings.payzone_return_success_url, status_code=307)

    if order_id:
        payment, _, _ = _find_payment_context(db, order_id)
        if payment:
            payment.status = "failed"
            db.commit()

    return RedirectResponse(url=settings.payzone_return_failure_url, status_code=307)


# -----------------
# PayPal Subscriptions
# -----------------

def get_paypal_access_token():
    auth = (settings.paypal_client_id, settings.paypal_client_secret)
    base_url = "https://api-m.sandbox.paypal.com" if settings.paypal_mode == "sandbox" else "https://api-m.paypal.com"
    response = requests.post(
        f"{base_url}/v1/oauth2/token",
        auth=auth,
        data={"grant_type": "client_credentials"},
    )
    if not response.ok:
        raise Exception(f"Failed to get PayPal token: {response.text}")
    return response.json()["access_token"]


@router.post("/paypal/verify")
def verify_paypal_subscription(
    payload: PayPalVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        access_token = get_paypal_access_token()
        base_url = "https://api-m.sandbox.paypal.com" if settings.paypal_mode == "sandbox" else "https://api-m.paypal.com"

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        resp = requests.get(f"{base_url}/v1/billing/subscriptions/{payload.subscription_id}", headers=headers)

        if not resp.ok:
            raise HTTPException(status_code=400, detail="Failed to verify subscription with PayPal")

        sub_data = resp.json()

        if sub_data.get("status") in ["ACTIVE", "APPROVED"]:
            current_user.is_premium = True
            current_user.subscription_tier = "premium"
            current_user.payment_status = "paid"

            existing_sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
            if not existing_sub:
                new_sub = Subscription(
                    user_id=current_user.id,
                    plan_type="paypal",
                    status="active",
                    start_date=datetime.utcnow(),
                    end_date=datetime.utcnow() + timedelta(days=365),
                )
                db.add(new_sub)
            else:
                existing_sub.status = "active"

            db.commit()
            return {"status": "success", "message": "Subscription verified successfully"}

        raise HTTPException(status_code=400, detail=f"Subscription status is {sub_data.get('status')}")

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Subscription verification failed: {str(e)}",
        )


@router.post("/paypal/webhook")
async def paypal_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    event_type = body.get("event_type")

    if event_type in ["BILLING.SUBSCRIPTION.CANCELLED", "BILLING.SUBSCRIPTION.SUSPENDED"]:
        pass

    return {"status": "received"}
