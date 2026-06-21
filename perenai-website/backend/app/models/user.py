from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    google_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    subscription_tier: Mapped[str] = mapped_column(String(50), default="free", nullable=False)
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    payment_status: Mapped[str] = mapped_column(String(50), default="none", nullable=False)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    picture_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    profile_type: Mapped[str] = mapped_column(String(50), default="individu", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    biomarker_records = relationship("Biomarker", back_populates="user", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
    onboarding_record = relationship("OnboardingData", back_populates="user", cascade="all, delete-orphan", uselist=False)
    digital_twin_records = relationship("DigitalTwin", back_populates="user", cascade="all, delete-orphan")
    health_records = relationship("HealthData", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")
