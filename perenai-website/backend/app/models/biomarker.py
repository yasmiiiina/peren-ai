from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Biomarker(Base):
    __tablename__ = "biomarkers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    heart_rate: Mapped[float] = mapped_column(Float, nullable=False)
    blood_pressure_sys: Mapped[float] = mapped_column(Float, nullable=False)
    blood_pressure_dia: Mapped[float] = mapped_column(Float, nullable=False)
    breathing_rate: Mapped[float] = mapped_column(Float, nullable=False)
    stress_index: Mapped[float] = mapped_column(Float, nullable=False)
    bmi: Mapped[float] = mapped_column(Float, nullable=False)
    scan_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="biomarker_records")
