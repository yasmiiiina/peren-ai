from datetime import datetime
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class DigitalTwin(Base):
    __tablename__ = "digital_twin_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    body_age: Mapped[float] = mapped_column(Float, nullable=False)
    work_load: Mapped[float] = mapped_column(Float, nullable=False)
    body_toxin: Mapped[float] = mapped_column(Float, nullable=False)
    
    body_age_state: Mapped[str] = mapped_column(String(50), nullable=True)
    workload_state: Mapped[str] = mapped_column(String(50), nullable=True)
    body_toxins_state: Mapped[str] = mapped_column(String(50), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="digital_twin_records")
