import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UUID, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from src.shared.infrastructure.database import Base


class SystemModelConfigModel(Base):
    __tablename__ = "system_model_configs"
    __table_args__ = (
        UniqueConstraint("user_id", "model_type", name="system_model_configs_user_id_model_type_key"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    model_type: Mapped[str] = mapped_column(String(16), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    model_name: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    def __repr__(self) -> str:
        return (
            f"<SystemModelConfigModel(id={self.id}, user_id={self.user_id}, "
            f"model_type='{self.model_type}', provider='{self.provider}', model_name='{self.model_name}')>"
        )
