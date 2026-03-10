from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class ScriptConfig:
    library_id: UUID
    chunk_size: int
    chunk_overlap: int
    created_at: datetime
    updated_at: datetime
