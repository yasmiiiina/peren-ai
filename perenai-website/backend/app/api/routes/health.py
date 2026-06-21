from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.health import HealthCreate, HealthOut
from app.services.health_service import create_record, get_history, get_latest

router = APIRouter(prefix="/health", tags=["health"])


@router.post("", response_model=HealthOut)
def add_health_data(
    payload: HealthCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_record(db, current_user.id, payload)


@router.get("", response_model=HealthOut | None)
def latest_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_latest(db, current_user.id)


@router.get("/history", response_model=list[HealthOut])
def health_history(
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_history(db, current_user.id, limit)
