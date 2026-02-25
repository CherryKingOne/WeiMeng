from src.modules.auth.domain.entities.user import User
from src.modules.auth.domain.value_objects.token import Token
from src.modules.auth.domain.exceptions import InvalidCredentialsException, UserInactiveException
from src.shared.security.password_hasher import password_hasher
from src.shared.security.jwt_handler import jwt_handler

class AuthenticationDomainService:
    def __init__(self):
        self._password_hasher = password_hasher
        self._jwt_handler = jwt_handler
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self._password_hasher.verify(plain_password, hashed_password)
    
    def hash_password(self, password: str) -> str:
        return self._password_hasher.hash(password)
    
    def generate_token(self, user: User) -> Token:
        access_token, expires_at = self._jwt_handler.create_access_token(
            data={"sub": user.email, "uid": str(user.id)}
        )
        return Token(
            access_token=access_token,
            expires_at=expires_at
        )
    
    def validate_user_for_login(self, user: User | None, password: str) -> User:
        if user is None:
            raise InvalidCredentialsException()
        
        if not self._password_hasher.verify(password, user.hashed_password):
            raise InvalidCredentialsException()
        
        if not user.is_active:
            raise UserInactiveException()
        
        return user

authentication_domain_service = AuthenticationDomainService()
