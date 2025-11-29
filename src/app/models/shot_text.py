from sqlalchemy import Column, String, Text, DateTime, Index
from sqlalchemy.sql import func
from app.core.database import Base


class ShotText(Base):
    __tablename__ = "shots"

    shot_uuid = Column(String(20), primary_key=True, index=True)
    library_id = Column(String(255), nullable=False, index=True)
    script_id = Column(String(255), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index('idx_shots_script_id', 'script_id'),
    )
