from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.shared.infrastructure.database import get_db
from src.shared.infrastructure.redis import RedisRepository, get_redis
from src.modules.auth.infrastructure.repositories.user_repository import UserRepository
from src.modules.auth.application.services.login_service import LoginService
from src.modules.auth.application.services.register_service import RegisterService
from src.modules.auth.application.services.reset_password_service import ResetPasswordService

async def get_user_repository(db: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(db)

async def get_redis_repository() -> RedisRepository:
    redis = await get_redis()
    return RedisRepository(redis)

async def get_login_service(
    user_repo: UserRepository = Depends(get_user_repository)
) -> LoginService:
    return LoginService(user_repo)

async def get_register_service(
    user_repo: UserRepository = Depends(get_user_repository),
    redis_repo: RedisRepository = Depends(get_redis_repository)
) -> RegisterService:
    return RegisterService(user_repo, redis_repo)

async def get_reset_password_service(
    user_repo: UserRepository = Depends(get_user_repository),
    redis_repo: RedisRepository = Depends(get_redis_repository)
) -> ResetPasswordService:
    return ResetPasswordService(user_repo, redis_repo)
