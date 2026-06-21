from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class OnboardingSaveRequest(BaseModel):
    data: dict[str, Any]
    is_final: bool = False


class OnboardingDataOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    data: dict[str, Any]
    is_final: bool
    created_at: datetime
    updated_at: datetime
