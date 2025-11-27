from sqlalchemy import Column, String, Boolean, DateTime, Text, Index
from sqlalchemy.sql import func
from app.core.database import Base


class ModelConfig(Base):
    __tablename__ = "model_configs"

    id = Column(String(22), primary_key=True, index=True)
    tenant_id = Column(String(64), nullable=False, index=True)
    model_name = Column(String(100), nullable=False)
    model_type = Column(String(50), nullable=False)
    base_url = Column(String(255), nullable=False)
    encrypted_api_key = Column(Text, nullable=False)
    description = Column(Text)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index('idx_model_configs_tenant', 'tenant_id'),
    )
