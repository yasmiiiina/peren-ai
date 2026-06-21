from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserUpdate(BaseModel):
    name: str | None = None
    profile_type: str | None = None


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    google_id: str | None = None
    subscription_tier: str
    is_premium: bool
    payment_status: str
    onboarding_completed: bool
    profile_type: str
    created_at: datetime
