from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar('T')


class Response(BaseModel, Generic[T]):
    """Generic API response wrapper"""
    code: int = 200
    message: str = "Success"
    data: Optional[T] = None


class ErrorResponse(BaseModel):
    """Error response"""
    detail: str
