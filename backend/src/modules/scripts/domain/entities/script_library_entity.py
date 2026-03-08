from dataclasses import dataclass
from datetime import datetime

from src.shared.domain.base_entity import BaseEntity


@dataclass
class ScriptLibrary(BaseEntity):
    name: str = ""
    description: str | None = None

    @classmethod
    def create(
        cls,
        name: str,
        description: str | None = None,
    ) -> "ScriptLibrary":
        now = datetime.utcnow()
        return cls(
            name=name,
            description=description,
            created_at=now,
            updated_at=now,
        )
