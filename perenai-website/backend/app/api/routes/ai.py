from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.api.deps import get_current_user, get_db
from app.models.onboarding import OnboardingData
from app.models.user import User
from app.schemas.ai import AIAnalysisResponse, BiomarkerAnalyzeRequest, ScanVitals
from app.services.ai_service import AIService
from app.services.digital_twin import DigitalTwinService

router = APIRouter(prefix="/ai", tags=["ai"])


def _user_context(db: Session, user: User) -> dict:
    onboarding = db.query(OnboardingData).filter(OnboardingData.user_id == user.id).first()
    form = onboarding.data.get("form", {}) if onboarding and isinstance(onboarding.data, dict) else {}
    pipeline = DigitalTwinService.map_onboarding_to_pipeline(form) if form else {}
    return {
        "age": pipeline.get("age"),
        "sex": pipeline.get("sex"),
        "weight_kg": pipeline.get("weight_kg"),
        "height_cm": pipeline.get("height_cm"),
        "intentions": form.get("intentions", []),
        "conditions": form.get("currentConditions", ""),
    }


@router.get("/biomarkers")
def get_saved_biomarkers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    onboarding = db.query(OnboardingData).filter(OnboardingData.user_id == current_user.id).first()
    if not onboarding or not isinstance(onboarding.data, dict):
        return {"biomarkers": [], "analysis": None}
    return {
        "biomarkers": onboarding.data.get("bloodBiomarkers", []),
        "analysis": onboarding.data.get("bloodAnalysis"),
    }


@router.get("/status")
def ai_status():
    return AIService.status()


@router.post("/analyze-scan", response_model=AIAnalysisResponse)
def analyze_scan(
    vitals: ScanVitals,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    context = _user_context(db, current_user)
    result = AIService.analyze_face_scan(vitals.model_dump(), context)
    return AIAnalysisResponse(
        summary=result["summary"],
        risk_level=result.get("risk_level"),
        insights=result.get("insights", []),
        recommendations=result.get("recommendations", []),
        source=result["source"],
    )


@router.post("/analyze-biomarkers", response_model=AIAnalysisResponse)
def analyze_biomarkers(
    payload: BiomarkerAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    context = _user_context(db, current_user)
    biomarkers = [b.model_dump() for b in payload.biomarkers]
    result = AIService.analyze_biomarkers(biomarkers, context)

    onboarding = db.query(OnboardingData).filter(OnboardingData.user_id == current_user.id).first()
    if onboarding:
        data = dict(onboarding.data) if isinstance(onboarding.data, dict) else {}
        data["bloodBiomarkers"] = result.get("biomarkers") or biomarkers
        data["bloodAnalysis"] = {
            "summary": result.get("summary"),
            "overall_status": result.get("overall_status"),
            "recommendations": result.get("recommendations", []),
            "source": result.get("source"),
        }
        onboarding.data = data
        flag_modified(onboarding, "data")
        db.commit()

    return AIAnalysisResponse(
        summary=result["summary"],
        overall_status=result.get("overall_status"),
        biomarkers=result.get("biomarkers"),
        recommendations=result.get("recommendations", []),
        source=result["source"],
    )
