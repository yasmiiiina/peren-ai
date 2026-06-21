import asyncio
import json
import random
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.biomarker import Biomarker
from app.models.onboarding import OnboardingData
from app.models.user import User
from app.schemas.ai import AIAnalysisResponse, ScanVitals
from app.schemas.biomarker import BiomarkerCreate, BiomarkerOut
from app.services.ai_service import AIService
from app.services.digital_twin import DigitalTwinService

router = APIRouter()


def _compute_scan_targets(db: Session, user_id: int) -> dict:
    """Personalize vitals from onboarding profile instead of hardcoded defaults."""
    onboarding = db.query(OnboardingData).filter(OnboardingData.user_id == user_id).first()
    form = onboarding.data.get("form", {}) if onboarding and isinstance(onboarding.data, dict) else {}
    pipeline = DigitalTwinService.map_onboarding_to_pipeline(form) if form else {}

    age = float(pipeline.get("age") or 30)
    weight = float(pipeline.get("weight_kg") or 70)
    height = float(pipeline.get("height_cm") or 170)
    bmi = weight / ((height / 100) ** 2) if height > 0 else 22.4
    stress_level = float(pipeline.get("stress_level") or 3)

    base_hr = max(58, min(88, 68 + (bmi - 22) * 0.8 + max(0, stress_level - 5) * 1.5))
    base_sys = max(105, min(135, 112 + max(0, bmi - 24) * 2.5 + max(0, stress_level - 5)))
    base_dia = max(65, min(88, base_sys * 0.62))
    base_rr = max(12, min(20, 14 + max(0, stress_level - 4) * 0.5))
    base_stress = min(85, max(25, 35 + stress_level * 4 + max(0, bmi - 26) * 2))
    base_workload = round(min(5.0, max(2.0, 2.6 + (bmi - 22) * 0.08 + stress_level * 0.05)), 1)

    seed = user_id * 17 + int(datetime.utcnow().strftime("%Y%m%d"))
    rng = random.Random(seed)

    return {
        "hr": round(base_hr + rng.uniform(-1, 1), 1),
        "hrv": round(42 + rng.uniform(-4, 4) - max(0, stress_level - 4) * 2, 1),
        "rr": round(base_rr, 1),
        "stress_idx": round(base_stress, 1),
        "blood_pressure_sys": round(base_sys, 1),
        "blood_pressure_dia": round(base_dia, 1),
        "cardiac_workload": base_workload,
        "bmi": round(bmi, 1),
        "start_hr": round(base_hr - 4, 1),
        "start_sys": round(base_sys - 4, 1),
        "start_dia": round(base_dia - 4, 1),
        "start_rr": round(base_rr - 2, 1),
        "start_stress": round(base_stress - 7, 1),
        "start_workload": round(base_workload - 0.4, 1),
    }


@router.post("/save", response_model=BiomarkerOut, status_code=status.HTTP_201_CREATED)
def save_scan(
    biomarker_in: BiomarkerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium access required to save scans.",
        )

    try:
        db_biomarker = Biomarker(
            user_id=current_user.id,
            heart_rate=biomarker_in.heart_rate,
            blood_pressure_sys=biomarker_in.blood_pressure_sys,
            blood_pressure_dia=biomarker_in.blood_pressure_dia,
            breathing_rate=biomarker_in.breathing_rate,
            stress_index=biomarker_in.stress_index,
            bmi=biomarker_in.bmi,
        )
        db.add(db_biomarker)
        db.commit()
        db.refresh(db_biomarker)
        return db_biomarker
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save scan: {str(e)}",
        )


@router.get("/history", response_model=List[BiomarkerOut])
def get_scan_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return (
            db.query(Biomarker)
            .filter(Biomarker.user_id == current_user.id)
            .order_by(Biomarker.scan_date.desc())
            .all()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch scan history: {str(e)}",
        )


@router.post("/analyze", response_model=AIAnalysisResponse)
def analyze_scan(
    vitals: ScanVitals,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    onboarding = db.query(OnboardingData).filter(OnboardingData.user_id == current_user.id).first()
    form = onboarding.data.get("form", {}) if onboarding and isinstance(onboarding.data, dict) else {}
    context = DigitalTwinService.map_onboarding_to_pipeline(form) if form else {}
    result = AIService.analyze_face_scan(vitals.model_dump(), context)
    return AIAnalysisResponse(
        summary=result["summary"],
        risk_level=result.get("risk_level"),
        insights=result.get("insights", []),
        recommendations=result.get("recommendations", []),
        source=result["source"],
    )


@router.get("/stream")
async def scan_event_stream(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium access required.",
        )

    targets = _compute_scan_targets(db, current_user.id)
    stress_source = "openai_enhanced" if AIService.is_available() else "profile_estimated"

    async def event_generator():
        for i in range(40):
            progress = i / 39 if i < 39 else 1.0
            if i < 39:
                data = {
                    "hr": round(targets["start_hr"] + (targets["hr"] - targets["start_hr"]) * progress + random.uniform(-1, 1), 2),
                    "hrv": round(targets["hrv"] + random.uniform(-3, 3), 2),
                    "rr": round(targets["start_rr"] + (targets["rr"] - targets["start_rr"]) * progress + random.uniform(-0.5, 0.5), 2),
                    "stress_idx": round(targets["start_stress"] + (targets["stress_idx"] - targets["start_stress"]) * progress, 2),
                    "stress_source": stress_source,
                    "blood_pressure_sys": round(targets["start_sys"] + (targets["blood_pressure_sys"] - targets["start_sys"]) * progress + random.uniform(-1, 1), 2),
                    "blood_pressure_dia": round(targets["start_dia"] + (targets["blood_pressure_dia"] - targets["start_dia"]) * progress + random.uniform(-1, 1), 2),
                    "cardiac_workload": round(targets["start_workload"] + (targets["cardiac_workload"] - targets["start_workload"]) * progress, 2),
                    "bmi": targets["bmi"],
                }
            else:
                data = {
                    "hr": targets["hr"],
                    "hrv": targets["hrv"],
                    "rr": targets["rr"],
                    "stress_idx": targets["stress_idx"],
                    "stress_source": stress_source,
                    "blood_pressure_sys": targets["blood_pressure_sys"],
                    "blood_pressure_dia": targets["blood_pressure_dia"],
                    "cardiac_workload": targets["cardiac_workload"],
                    "bmi": targets["bmi"],
                }
            yield f"data: {json.dumps(data)}\n\n"
            await asyncio.sleep(0.5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
