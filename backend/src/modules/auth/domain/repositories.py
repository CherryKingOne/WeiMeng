from abc import ABC, abstractmethod
from src.modules.auth.domain.entities.user import User

class IUserRepository(ABC):
    @abstractmethod
    async def find_by_id(self, user_id: str) -> User | None:
        pass
    
    @abstractmethod
    async def find_by_email(self, email: str) -> User | None:
        pass
    
    @abstractmethod
    async def save(self, user: User) -> User:
        pass
    
    @abstractmethod
    async def update(self, user: User) -> User:
        pass
    
    @abstractmethod
    async def exists_by_email(self, email: str) -> bool:
        pass
