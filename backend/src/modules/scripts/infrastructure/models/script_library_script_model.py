import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from src.shared.infrastructure.database import Base


class ScriptLibraryScriptModel(Base):
    __tablename__ = "script_library_scripts"

    library_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("script_libraries.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
        index=True,
    )
    script_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("scripts.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self) -> str:
        return f"<ScriptLibraryScriptModel(library_id={self.library_id}, script_id={self.script_id})>"
