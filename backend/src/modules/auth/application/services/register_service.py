from src.modules.auth.domain.entities.user import User
from src.modules.auth.domain.repositories import IUserRepository
from src.modules.auth.domain.services.authentication_service import authentication_domain_service
from src.modules.auth.domain.exceptions import UserAlreadyExistsException
from src.modules.auth.application.dto.register_dto import RegisterRequest, RegisterResponse
from src.shared.domain.exceptions import ValidationException
from src.shared.infrastructure.redis import RedisRepository

class RegisterService:
    def __init__(self, user_repository: IUserRepository, redis_repository: RedisRepository):
        self._user_repository = user_repository
        self._redis_repository = redis_repository
        self._auth_service = authentication_domain_service
    
    async def register(self, request: RegisterRequest) -> RegisterResponse:
        stored_code = await self._redis_repository.get(f"captcha:{request.email}")
        
        if not stored_code or stored_code != request.captcha:
            raise ValidationException(
                message="验证码错误或已过期",
                detail="Please request a new captcha code"
            )
        
        exists = await self._user_repository.exists_by_email(request.email)
        if exists:
            raise UserAlreadyExistsException(request.email)
        
        hashed_password = self._auth_service.hash_password(request.password)
        
        user = User.create(
            email=request.email,
            username=request.username,
            hashed_password=hashed_password
        )
        
        await self._user_repository.save(user)
        
        await self._redis_repository.delete(f"captcha:{request.email}")
        
        return RegisterResponse(message="注册成功")
