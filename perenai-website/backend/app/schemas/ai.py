from pydantic import BaseModel, Field


class ScanVitals(BaseModel):
    heart_rate: float = Field(ge=30, le=220)
    blood_pressure_sys: float = Field(ge=70, le=250)
    blood_pressure_dia: float = Field(ge=40, le=150)
    breathing_rate: float = Field(ge=8, le=40)
    cardiac_workload: float = Field(ge=0, le=10)
    stress_index: float = Field(ge=0, le=100)
    bmi: float = Field(ge=10, le=60)


class BiomarkerItem(BaseModel):
    marker: str
    value: str
    ref: str
    status: str = "optimal"


class BiomarkerAnalyzeRequest(BaseModel):
    biomarkers: list[BiomarkerItem]


class AIAnalysisResponse(BaseModel):
    summary: str
    risk_level: str | None = None
    overall_status: str | None = None
    insights: list[str] = []
    recommendations: list[str] = []
    biomarkers: list[dict] | None = None
    source: str
