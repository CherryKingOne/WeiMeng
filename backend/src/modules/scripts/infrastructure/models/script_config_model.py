import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, UUID, text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from src.shared.infrastructure.database import Base


class ScriptConfigModel(Base):
    __tablename__ = "scripts_configs"

    library_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("script_libraries.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    chunk_size: Mapped[int] = mapped_column(Integer, nullable=False, default=500, server_default=text("500"))
    chunk_overlap: Mapped[int] = mapped_column(Integer, nullable=False, default=50, server_default=text("50"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    def __repr__(self) -> str:
        return (
            "<ScriptConfigModel("
            f"library_id={self.library_id}, "
            f"chunk_size={self.chunk_size}, "
            f"chunk_overlap={self.chunk_overlap}"
            ")>"
        )
