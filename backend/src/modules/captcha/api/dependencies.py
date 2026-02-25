from fastapi import Depends
from src.shared.infrastructure.redis import RedisRepository, get_redis
from src.modules.captcha.infrastructure.repositories.captcha_repository import CaptchaRepository
from src.modules.captcha.application.services.email_captcha_service import EmailCaptchaService

async def get_captcha_repository() -> CaptchaRepository:
    redis = await get_redis()
    redis_repo = RedisRepository(redis)
    return CaptchaRepository(redis_repo)

async def get_email_captcha_service(
    captcha_repo: CaptchaRepository = Depends(get_captcha_repository)
) -> EmailCaptchaService:
    return EmailCaptchaService(captcha_repo)
