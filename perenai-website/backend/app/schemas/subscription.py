from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class SubscriptionBase(BaseModel):
    plan_type: str
    status: str = "active"

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionOut(SubscriptionBase):
    id: int
    user_id: int
    start_date: datetime
    end_date: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
