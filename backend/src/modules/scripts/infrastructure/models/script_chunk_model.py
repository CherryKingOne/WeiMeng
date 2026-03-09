import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, UUID, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from src.shared.infrastructure.database import Base


class ScriptChunkModel(Base):
    __tablename__ = "script_chunks"
    __table_args__ = (
        UniqueConstraint("script_id", "index_id", name="uq_script_chunks_script_index"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    script_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("scripts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    library_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("script_libraries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    index_id: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self) -> str:
        return (
            "<ScriptChunkModel("
            f"id={self.id}, script_id={self.script_id}, index_id={self.index_id}"
            ")>"
        )
