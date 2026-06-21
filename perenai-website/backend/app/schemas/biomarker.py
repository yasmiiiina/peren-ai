from datetime import datetime
from pydantic import BaseModel, ConfigDict

class BiomarkerBase(BaseModel):
    heart_rate: float
    blood_pressure_sys: float
    blood_pressure_dia: float
    breathing_rate: float
    stress_index: float
    bmi: float

class BiomarkerCreate(BiomarkerBase):
    pass

class BiomarkerOut(BiomarkerBase):
    id: int
    user_id: int
    scan_date: datetime

    model_config = ConfigDict(from_attributes=True)
