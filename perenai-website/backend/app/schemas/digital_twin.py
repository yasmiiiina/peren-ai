from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class RecommendationItem(BaseModel):
    title: str
    priority: str
    priorityColor: str
    text: str
    scoreLabel: str
    scoreValue: float
    details: str

class InterventionItem(BaseModel):
    icon: str
    title: str
    text: str

class ActionItem(BaseModel):
    time: str
    action: str
    desc: str
    icon: str

class DigitalTwinBase(BaseModel):
    body_age: float
    work_load: float
    body_toxin: float
    body_age_state: Optional[str] = None
    workload_state: Optional[str] = None
    body_toxins_state: Optional[str] = None

class DigitalTwinCreate(DigitalTwinBase):
    pass

class DigitalTwinOut(DigitalTwinBase):
    id: int
    user_id: int
    body_age_change: float = 0
    work_load_change: float = 0
    body_toxin_change: float = 0
    created_at: datetime
    
    recommendations: Optional[List[RecommendationItem]] = None
    interventions: Optional[List[InterventionItem]] = None
    action_plan: Optional[List[ActionItem]] = None

    # Calculated predictions & demographics
    sex: Optional[str] = None
    age: Optional[int] = None
    Sport_type: Optional[str] = None
    predicted_injury_risk_percent: Optional[float] = None
    predicted_chronic_risk_percent: Optional[float] = None
    predicted_body_age_3m: Optional[float] = None
    predicted_performance_improvement_percent: Optional[float] = None
    timeline: Optional[List[dict]] = None

    model_config = ConfigDict(from_attributes=True)

class DigitalTwinProcessResponse(BaseModel):
    metrics: DigitalTwinOut
    message: str = "Digital Twin processed successfully"
