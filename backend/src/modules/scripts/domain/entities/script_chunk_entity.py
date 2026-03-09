from dataclasses import dataclass
from datetime import datetime
import uuid

from src.shared.domain.base_entity import BaseEntity


@dataclass
class ScriptChunk(BaseEntity):
    script_id: uuid.UUID | None = None
    library_id: uuid.UUID | None = None
    index_id: int = 0
    content: str = ""
    chunk_size: int = 0
    start_index: int = 0
    end_index: int = 0

    @classmethod
    def create(
        cls,
        script_id: uuid.UUID,
        library_id: uuid.UUID,
        index_id: int,
        content: str,
        start_index: int,
        end_index: int,
    ) -> "ScriptChunk":
        now = datetime.utcnow()
        return cls(
            id=uuid.uuid4(),
            script_id=script_id,
            library_id=library_id,
            index_id=index_id,
            content=content,
            chunk_size=len(content),
            start_index=start_index,
            end_index=end_index,
            created_at=now,
            updated_at=now,
        )
