from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from jose import jwt, JWTError
from config.settings import settings

class JWTHandler:
    def __init__(
        self,
        secret_key: str = None,
        algorithm: str = None,
        expire_days: int = None
    ):
        self._secret_key = secret_key or settings.secret_key
        self._algorithm = algorithm or settings.algorithm
        self._expire_days = expire_days or settings.access_token_expire_days

    def create_access_token(
        self,
        data: dict,
        expires_delta: timedelta | None = None
    ) -> tuple[str, datetime]:
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(days=self._expire_days)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self._secret_key, algorithm=self._algorithm)
        
        return encoded_jwt, expire

    def decode_token(self, token: str) -> Optional[dict[str, Any]]:
        try:
            payload = jwt.decode(token, self._secret_key, algorithms=[self._algorithm])
            return payload
        except JWTError:
            return None

    def get_user_id_from_token(self, token: str) -> Optional[str]:
        payload = self.decode_token(token)
        if payload:
            return payload.get("uid")
        return None

    def get_email_from_token(self, token: str) -> Optional[str]:
        payload = self.decode_token(token)
        if payload:
            return payload.get("sub")
        return None

jwt_handler = JWTHandler()
