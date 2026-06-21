from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class HealthCreate(BaseModel):
    heart_rate: float = Field(ge=20, le=240)
    mobility: float = Field(ge=0, le=100)
    muscle_load: float = Field(ge=0, le=100)
    oxygen: float = Field(ge=50, le=100)


class HealthOut(HealthCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime


class DashboardSummary(BaseModel):
    latest: HealthOut | None
    averages: dict[str, float]
    records_count: int
