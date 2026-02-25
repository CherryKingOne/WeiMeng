from src.modules.captcha.domain.entities.captcha import Captcha
from src.modules.captcha.domain.repositories import ICaptchaRepository
from src.shared.infrastructure.redis import RedisRepository

class CaptchaRepository(ICaptchaRepository):
    def __init__(self, redis_repository: RedisRepository):
        self._redis = redis_repository
    
    async def save(self, captcha: Captcha) -> bool:
        return await self._redis.set(
            captcha.redis_key,
            captcha.code,
            captcha.ttl
        )
    
    async def find_by_email(self, email: str) -> str | None:
        return await self._redis.get(f"captcha:{email}")
    
    async def delete(self, email: str) -> bool:
        result = await self._redis.delete(f"captcha:{email}")
        return result > 0
    
    async def exists(self, email: str) -> bool:
        return await self._redis.exists(f"captcha:{email}")
