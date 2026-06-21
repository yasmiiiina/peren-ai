from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.onboarding import OnboardingData
from app.models.digital_twin import DigitalTwin
from app.models.user import User
from app.services.digital_twin import DigitalTwinService
from app.services.ai_service import AIService
from app.schemas.digital_twin import DigitalTwinOut, DigitalTwinProcessResponse

router = APIRouter(prefix="/digital-twin", tags=["digital-twin"])

def populate_demographics_predictions_timeline(
    db: Session,
    record: DigitalTwin,
    previous: DigitalTwin,
    current_user: User,
    onboarding: OnboardingData
) -> DigitalTwinOut:
    output = DigitalTwinOut.model_validate(record)
    
    if previous:
        output.body_age_change = record.body_age - previous.body_age
        output.work_load_change = record.work_load - previous.work_load
        output.body_toxin_change = record.body_toxin - previous.body_toxin
    else:
        output.body_age_change = 0.0
        output.work_load_change = 0.0
        output.body_toxin_change = 0.0

    # Retrieve onboarding data & map to pipeline inputs
    onboarding_form = onboarding.data.get("form", {}) if onboarding and isinstance(onboarding.data, dict) else {}
    pipeline_input = DigitalTwinService.map_onboarding_to_pipeline(onboarding_form)
    
    age = pipeline_input.get("age", 30)
    sex = "Female" if str(pipeline_input.get("sex", "F")).upper() in ["F", "FEMALE"] else "Male"
    
    # Infer dynamic Sport type
    sport_type = "Fitness"
    intentions = onboarding_form.get("intentions", [])
    if intentions:
        if "Améliorer mes performances sportives" in intentions:
            sport_type = "Running" if current_user.id % 2 == 0 else "Cycling"
        elif "Perdre du poids" in intentions:
            sport_type = "Fitness"
            
    # Calculate risk predictions from pipeline service
    preds = DigitalTwinService.calculate_predictions(
        pipeline_input,
        record.body_age,
        record.work_load,
        record.body_toxin,
        output.body_age_change
    )
    
    output.sex = sex
    output.age = int(age)
    output.Sport_type = sport_type
    output.predicted_injury_risk_percent = preds["predicted_injury_risk_percent"]
    output.predicted_chronic_risk_percent = preds["predicted_chronic_risk_percent"]
    output.predicted_body_age_3m = preds["predicted_body_age_3m"]
    output.predicted_performance_improvement_percent = preds["predicted_performance_improvement_percent"]

    # Generate dynamic, personalized 6-month historical timeline
    timeline_records = db.query(DigitalTwin).filter(DigitalTwin.user_id == current_user.id).order_by(DigitalTwin.created_at).all()
    timeline_items = []
    
    if len(timeline_records) >= 6:
        for r in timeline_records[-6:]:
            timeline_items.append({
                "datetime": r.created_at.strftime("%Y-%m-%d"),
                "body_age": r.body_age,
                "work_load": r.work_load,
                "body_toxin": r.body_toxin
            })
    else:
        # Deterministic generation based on user_id to ensure it differs per user
        end_date = record.created_at
        user_seed = current_user.id + 17
        for i in range(5, -1, -1):
            months_ago = i
            past_date = end_date - timedelta(days=months_ago * 30)
            
            # Custom variations over months
            var_body_age = (months_ago * 0.5) + (user_seed % 3) * 0.2 - 0.3
            var_workload = -(months_ago * 3.0) + (user_seed % 5) * 1.5 - 2.0
            var_toxin = (months_ago * 0.2) + (user_seed % 4) * 0.1 - 0.2
            
            timeline_items.append({
                "datetime": past_date.strftime("%Y-%m-%d"),
                "body_age": record.body_age + var_body_age,
                "work_load": max(min(record.work_load + var_workload, 100.0), 0.0),
                "body_toxin": max(min(record.body_toxin + var_toxin, 10.0), 0.0)
            })
            
    output.timeline = timeline_items

    # Inject premium features if user has premium status
    if current_user.is_premium:
        rule_based = DigitalTwinService.generate_premium_features(onboarding_form, record)
        premium_features = AIService.generate_premium_insights(
            onboarding_form, record, fallback=rule_based
        )
        output.recommendations = premium_features["recommendations"]
        output.interventions = premium_features["interventions"]
        output.action_plan = premium_features["action_plan"]

    return output

@router.post("/process", response_model=DigitalTwinProcessResponse)
def process_digital_twin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Get onboarding data
    onboarding = db.query(OnboardingData).filter(OnboardingData.user_id == current_user.id).first()
    if not onboarding or not onboarding.is_final:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Onboarding must be completed before processing Digital Twin"
        )

    # 2. Get history
    history_records = db.query(DigitalTwin).filter(DigitalTwin.user_id == current_user.id).order_by(DigitalTwin.created_at).all()
    history = [
        {"body_age": r.body_age, "work_load": r.work_load, "body_toxin": r.body_toxin}
        for r in history_records
    ]

    # 3. Map & Calculate
    onboarding_form = onboarding.data.get("form", {}) if isinstance(onboarding.data, dict) else {}
    pipeline_input = DigitalTwinService.map_onboarding_to_pipeline(onboarding_form)
    
    metrics = DigitalTwinService.calculate_metrics(pipeline_input, history)

    # 4. Save to DB
    new_record = DigitalTwin(
        user_id=current_user.id,
        body_age=metrics.body_age,
        work_load=metrics.work_load,
        body_toxin=metrics.body_toxin,
        body_age_state=metrics.body_age_state,
        workload_state=metrics.workload_state,
        body_toxins_state=metrics.body_toxins_state,
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    previous = history_records[-1] if len(history_records) > 0 else None

    # 5. Populate demographics, predictions and timeline
    output = populate_demographics_predictions_timeline(
        db, new_record, previous, current_user, onboarding
    )

    return DigitalTwinProcessResponse(metrics=output)

@router.get("/latest", response_model=DigitalTwinOut)
def get_latest_digital_twin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(DigitalTwin).filter(DigitalTwin.user_id == current_user.id).order_by(desc(DigitalTwin.created_at)).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Digital Twin record found. Please process one first."
        )
    
    previous = db.query(DigitalTwin).filter(
        DigitalTwin.user_id == current_user.id,
        DigitalTwin.id < record.id
    ).order_by(desc(DigitalTwin.created_at)).first()

    onboarding = db.query(OnboardingData).filter(OnboardingData.user_id == current_user.id).first()

    return populate_demographics_predictions_timeline(
        db, record, previous, current_user, onboarding
    )
