from dataclasses import dataclass
from datetime import datetime
from src.shared.domain.base_entity import BaseEntity

@dataclass
class Captcha(BaseEntity):
    email: str = ""
    code: str = ""
    ttl: int = 300
    purpose: str = "general"
    
    @property
    def redis_key(self) -> str:
        return f"captcha:{self.email}"
    
    @property
    def is_expired(self) -> bool:
        return False
    
    @classmethod
    def create(cls, email: str, code: str, ttl: int = 300, purpose: str = "general") -> "Captcha":
        return cls(
            email=email,
            code=code,
            ttl=ttl,
            purpose=purpose
        )
