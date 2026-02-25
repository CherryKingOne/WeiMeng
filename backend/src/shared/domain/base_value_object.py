from dataclasses import dataclass
from abc import ABC
from typing import Any

@dataclass(frozen=True)
class BaseValueObject(ABC):
    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, self.__class__):
            return False
        return self.__dict__ == other.__dict__
    
    def __hash__(self) -> int:
        return hash(tuple(self.__dict__.values()))
    
    def __str__(self) -> str:
        return str(self.__dict__)
