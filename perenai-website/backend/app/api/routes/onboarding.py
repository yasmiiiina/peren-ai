from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.onboarding import OnboardingData
from app.models.user import User
from app.schemas.onboarding import OnboardingDataOut, OnboardingSaveRequest

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.get("", response_model=OnboardingDataOut | None)
def get_onboarding_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(OnboardingData).filter(OnboardingData.user_id == current_user.id).first()


@router.post("", response_model=OnboardingDataOut)
def save_onboarding_data(
    payload: OnboardingSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(OnboardingData).filter(OnboardingData.user_id == current_user.id).first()
    if not record:
        record = OnboardingData(
            user_id=current_user.id,
            data=payload.data,
            is_final=payload.is_final,
        )
        db.add(record)
    else:
        record.data = payload.data
        record.is_final = payload.is_final
        db.add(record)

    if payload.is_final:
        current_user.onboarding_completed = True
        db.add(current_user)

    db.commit()
    db.refresh(record)
    return record
