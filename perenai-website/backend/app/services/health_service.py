from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.health import HealthData
from app.schemas.health import HealthCreate


def create_record(db: Session, user_id: int, payload: HealthCreate) -> HealthData:
    record = HealthData(user_id=user_id, **payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_latest(db: Session, user_id: int) -> HealthData | None:
    return (
        db.query(HealthData)
        .filter(HealthData.user_id == user_id)
        .order_by(HealthData.created_at.desc())
        .first()
    )


def get_history(db: Session, user_id: int, limit: int = 100) -> list[HealthData]:
    return (
        db.query(HealthData)
        .filter(HealthData.user_id == user_id)
        .order_by(HealthData.created_at.desc())
        .limit(limit)
        .all()
    )


def get_summary(db: Session, user_id: int) -> tuple[HealthData | None, dict[str, float], int]:
    latest = get_latest(db, user_id)

    rows = (
        db.query(
            func.avg(HealthData.heart_rate),
            func.avg(HealthData.mobility),
            func.avg(HealthData.muscle_load),
            func.avg(HealthData.oxygen),
            func.count(HealthData.id),
        )
        .filter(HealthData.user_id == user_id)
        .first()
    )

    if not rows:
        return latest, {"heart_rate": 0, "mobility": 0, "muscle_load": 0, "oxygen": 0}, 0

    avg_heart, avg_mobility, avg_muscle_load, avg_oxygen, count = rows
    averages = {
        "heart_rate": float(avg_heart or 0),
        "mobility": float(avg_mobility or 0),
        "muscle_load": float(avg_muscle_load or 0),
        "oxygen": float(avg_oxygen or 0),
    }
    return latest, averages, int(count or 0)
