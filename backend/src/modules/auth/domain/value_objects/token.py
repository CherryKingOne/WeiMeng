from dataclasses import dataclass
from datetime import datetime
from src.shared.domain.base_value_object import BaseValueObject

@dataclass(frozen=True)
class Token(BaseValueObject):
    access_token: str
    token_type: str = "bearer"
    expires_in_days: int = 30
    expires_at: datetime = None
    
    def __post_init__(self):
        if self.expires_at is None:
            from datetime import timedelta
            object.__setattr__(
                self,
                'expires_at',
                datetime.utcnow() + timedelta(days=self.expires_in_days)
            )
    
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at
    
    def to_dict(self) -> dict:
        return {
            "access_token": self.access_token,
            "token_type": self.token_type,
            "expires_in_days": self.expires_in_days,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None
        }
