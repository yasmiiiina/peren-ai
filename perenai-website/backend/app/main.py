from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.routes import ai, auth, dashboard, digital_twin, health, onboarding, payments, scans, users
from app.core.config import settings
from app.database.base import Base
from app.database.session import engine
from app.models import biomarker as biomarker_model  # noqa: F401
from app.models import subscription as subscription_model  # noqa: F401
from app.models import onboarding as onboarding_model  # noqa: F401
from app.models import user as user_model  # noqa: F401
from app.models import payment as payment_model  # noqa: F401
from app.models import digital_twin as digital_twin_model  # noqa: F401

# Dev only: auto-create tables. Production relies on Alembic (start.sh).
if not settings.is_production:
    Base.metadata.create_all(bind=engine)

    if "sqlite" in str(settings.database_url).lower():
        from app.database.session import SessionLocal
        db = SessionLocal()
        try:
            conn = db.connection()
            result = conn.execute(text("PRAGMA table_info(users)"))
            columns = [row[1] for row in result.fetchall()]
            if "profile_type" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN profile_type VARCHAR(50) DEFAULT 'individu'"))
                db.commit()
        except Exception as e:
            print(f"Error checking/adding profile_type column: {e}")
            db.rollback()
        finally:
            db.close()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.frontend_origin.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(scans.router, prefix="/api/scans")
app.include_router(dashboard.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(onboarding.router, prefix="/api")
app.include_router(digital_twin.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(health.router, prefix="/api")


def _health_payload():
    db_ok = False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_ok = True
    except Exception:
        db_ok = False
    from app.services.ai_service import AIService

    ai_status = AIService.status()
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "ok" if db_ok else "error",
        "env": settings.app_env,
        "ai": ai_status,
    }


@app.get("/healthz")
def healthz():
    return _health_payload()


@app.get("/api/healthz")
def api_healthz():
    return _health_payload()
