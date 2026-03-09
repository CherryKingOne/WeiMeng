from dataclasses import dataclass
from src.shared.domain.base_entity import BaseEntity

@dataclass
class Captcha(BaseEntity):
    email: str = ""
    code: str = ""
    ttl: int = 300
    purpose: str = "general"
    
    @property
    def redis_key(self) -> str:
        return self.build_redis_key(self.email, self.purpose)

    @staticmethod
    def normalize_purpose(purpose: str | None) -> str:
        normalized = (purpose or "general").strip().lower()
        return normalized or "general"

    @classmethod
    def build_redis_key(cls, email: str, purpose: str = "general") -> str:
        normalized_email = email.strip().lower()
        normalized_purpose = cls.normalize_purpose(purpose)
        return f"captcha:{normalized_purpose}:{normalized_email}"
    
    @property
    def is_expired(self) -> bool:
        return False
    
    @classmethod
    def create(cls, email: str, code: str, ttl: int = 300, purpose: str = "general") -> "Captcha":
        return cls(
            email=email,
            code=code,
            ttl=ttl,
            purpose=cls.normalize_purpose(purpose),
        )
