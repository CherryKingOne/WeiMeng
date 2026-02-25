from abc import ABC, abstractmethod
from src.modules.captcha.domain.entities.captcha import Captcha

class ICaptchaRepository(ABC):
    @abstractmethod
    async def save(self, captcha: Captcha) -> bool:
        pass
    
    @abstractmethod
    async def find_by_email(self, email: str) -> str | None:
        pass
    
    @abstractmethod
    async def delete(self, email: str) -> bool:
        pass
    
    @abstractmethod
    async def exists(self, email: str) -> bool:
        pass
