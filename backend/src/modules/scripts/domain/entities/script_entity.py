from dataclasses import dataclass
from datetime import datetime
import uuid

from src.shared.domain.base_entity import BaseEntity


@dataclass
class Script(BaseEntity):
    library_id: uuid.UUID | None = None
    original_name: str = ""
    storage_path: str = ""
    file_extension: str = ""
    content_type: str = "application/octet-stream"
    file_size: int = 0

    @classmethod
    def create(
        cls,
        library_id: uuid.UUID,
        original_name: str,
        storage_path: str,
        file_extension: str,
        content_type: str,
        file_size: int,
    ) -> "Script":
        now = datetime.utcnow()
        return cls(
            id=uuid.uuid4(),
            library_id=library_id,
            original_name=original_name,
            storage_path=storage_path,
            file_extension=file_extension,
            content_type=content_type,
            file_size=file_size,
            created_at=now,
            updated_at=now,
        )
