from src.modules.auth.domain.entities.user import User
from src.modules.auth.domain.repositories import IUserRepository
from src.modules.auth.domain.services.authentication_service import authentication_domain_service
from src.modules.auth.domain.exceptions import UserAlreadyExistsException
from src.modules.auth.application.dto.login_dto import LoginRequest, TokenResponse
from src.shared.domain.exceptions import ValidationException
from src.shared.infrastructure.redis import RedisRepository

class LoginService:
    def __init__(self, user_repository: IUserRepository):
        self._user_repository = user_repository
        self._auth_service = authentication_domain_service
    
    async def login(self, request: LoginRequest) -> TokenResponse:
        user = await self._user_repository.find_by_email(request.email)
        
        validated_user = self._auth_service.validate_user_for_login(
            user, request.password
        )
        
        token = self._auth_service.generate_token(validated_user)
        
        return TokenResponse(
            access_token=token.access_token,
            token_type=token.token_type,
            expires_in_days=token.expires_in_days,
            expires_at=token.expires_at.isoformat()
        )
