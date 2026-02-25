from redis.asyncio import Redis, from_url
from config.settings import settings
from typing import Optional

class RedisClient:
    _instance: Optional[Redis] = None

    @classmethod
    def get_instance(cls) -> Redis:
        if cls._instance is None:
            cls._instance = from_url(
                settings.redis.url,
                encoding="utf-8",
                decode_responses=True
            )
        return cls._instance

    @classmethod
    async def close(cls):
        if cls._instance:
            await cls._instance.close()
            cls._instance = None

async def get_redis() -> Redis:
    return RedisClient.get_instance()

class RedisRepository:
    def __init__(self, redis: Redis = None):
        self._redis = redis
    
    async def _get_redis(self) -> Redis:
        if self._redis is None:
            self._redis = await get_redis()
        return self._redis
    
    async def set(self, key: str, value: str, ttl: int | None = None) -> bool:
        redis = await self._get_redis()
        if ttl:
            return await redis.setex(key, ttl, value)
        return await redis.set(key, value)
    
    async def get(self, key: str) -> str | None:
        redis = await self._get_redis()
        return await redis.get(key)
    
    async def delete(self, key: str) -> int:
        redis = await self._get_redis()
        return await redis.delete(key)
    
    async def exists(self, key: str) -> bool:
        redis = await self._get_redis()
        return await redis.exists(key) > 0
