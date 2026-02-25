from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from src.shared.infrastructure.database import get_db
from src.shared.security.jwt_handler import jwt_handler
from src.shared.domain.exceptions import AuthenticationException

security = HTTPBearer(auto_error=False)

async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    if credentials is None:
        raise AuthenticationException("Not authenticated")
    
    token = credentials.credentials
    user_id = jwt_handler.get_user_id_from_token(token)
    
    if user_id is None:
        raise AuthenticationException("Invalid token")
    
    return user_id

async def get_current_user_email(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    if credentials is None:
        raise AuthenticationException("Not authenticated")
    
    token = credentials.credentials
    email = jwt_handler.get_email_from_token(token)
    
    if email is None:
        raise AuthenticationException("Invalid token")
    
    return email

async def get_optional_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str | None:
    if credentials is None:
        return None
    
    token = credentials.credentials
    return jwt_handler.get_user_id_from_token(token)
