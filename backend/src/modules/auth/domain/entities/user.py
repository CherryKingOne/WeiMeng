from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
import uuid
from src.shared.domain.base_entity import BaseEntity

@dataclass
class User(BaseEntity):
    email: str = ""
    username: Optional[str] = None
    hashed_password: str = ""
    is_active: bool = True
    
    @classmethod
    def create(
        cls,
        email: str,
        username: Optional[str],
        hashed_password: str
    ) -> "User":
        return cls(
            id=uuid.uuid4(),
            email=email,
            username=username,
            hashed_password=hashed_password,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    
    def update_password(self, new_hashed_password: str) -> None:
        self.hashed_password = new_hashed_password
        self.updated_at = datetime.utcnow()
    
    def update_username(self, new_username: str) -> None:
        self.username = new_username
        self.updated_at = datetime.utcnow()
    
    def deactivate(self) -> None:
        self.is_active = False
        self.updated_at = datetime.utcnow()
    
    def activate(self) -> None:
        self.is_active = True
        self.updated_at = datetime.utcnow()
