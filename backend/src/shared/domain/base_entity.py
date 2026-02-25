from dataclasses import dataclass, field
from abc import ABC
from typing import Any
from datetime import datetime
import uuid

@dataclass
class BaseEntity(ABC):
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, BaseEntity):
            return False
        return self.id == other.id
    
    def __hash__(self) -> int:
        return hash(self.id)
