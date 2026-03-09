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
    
    async def find_by_email(self, email: str, purpose: str = "general") -> str | None:
        redis_key = Captcha.build_redis_key(email, purpose)
        return await self._redis.get(redis_key)
    
    async def delete(self, email: str, purpose: str = "general") -> bool:
        redis_key = Captcha.build_redis_key(email, purpose)
        result = await self._redis.delete(redis_key)
        return result > 0
    
    async def exists(self, email: str, purpose: str = "general") -> bool:
        redis_key = Captcha.build_redis_key(email, purpose)
        return await self._redis.exists(redis_key)
