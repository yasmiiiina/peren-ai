from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class HealthData(Base):
    __tablename__ = "health_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    heart_rate: Mapped[float] = mapped_column(Float, nullable=False)
    mobility: Mapped[float] = mapped_column(Float, nullable=False)
    muscle_load: Mapped[float] = mapped_column(Float, nullable=False)
    oxygen: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="health_records")
