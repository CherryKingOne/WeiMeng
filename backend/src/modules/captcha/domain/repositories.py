from abc import ABC, abstractmethod
from src.modules.captcha.domain.entities.captcha import Captcha

class ICaptchaRepository(ABC):
    @abstractmethod
    async def save(self, captcha: Captcha) -> bool:
        pass
    
    @abstractmethod
    async def find_by_email(self, email: str, purpose: str = "general") -> str | None:
        pass
    
    @abstractmethod
    async def delete(self, email: str, purpose: str = "general") -> bool:
        pass
    
    @abstractmethod
    async def exists(self, email: str, purpose: str = "general") -> bool:
        pass
