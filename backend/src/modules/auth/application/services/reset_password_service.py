from src.modules.auth.domain.repositories import IUserRepository
from src.modules.auth.domain.services.authentication_service import authentication_domain_service
from src.modules.auth.domain.exceptions import UserNotFoundException
from src.modules.auth.application.dto.reset_password_dto import ResetPasswordRequest, ResetPasswordResponse
from src.shared.domain.exceptions import ValidationException
from src.shared.infrastructure.redis import RedisRepository

class ResetPasswordService:
    def __init__(self, user_repository: IUserRepository, redis_repository: RedisRepository):
        self._user_repository = user_repository
        self._redis_repository = redis_repository
        self._auth_service = authentication_domain_service
    
    async def reset_password(self, request: ResetPasswordRequest) -> ResetPasswordResponse:
        if request.new_password != request.confirm_password:
            raise ValidationException(
                message="两次输入的密码不一致",
                detail="Password and confirm password must match"
            )
        
        stored_code = await self._redis_repository.get(f"captcha:{request.email}")
        
        if not stored_code:
            raise ValidationException(
                message="验证码已过期或不存在",
                detail="Please request a new captcha code"
            )
        
        if stored_code != request.captcha:
            raise ValidationException(
                message="验证码错误",
                detail="Invalid captcha code"
            )
        
        user = await self._user_repository.find_by_email(request.email)
        if not user:
            raise UserNotFoundException(request.email)
        
        hashed_password = self._auth_service.hash_password(request.new_password)
        user.update_password(hashed_password)
        
        await self._user_repository.update(user)
        
        await self._redis_repository.delete(f"captcha:{request.email}")
        
        return ResetPasswordResponse(message="密码重置成功")
