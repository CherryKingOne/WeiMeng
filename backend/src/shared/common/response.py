from pydantic import BaseModel
from typing import Generic, TypeVar, Optional

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    code: int = 200
    message: str = "success"
    data: Optional[T] = None

    class Config:
        from_attributes = True

class SuccessResponse(ApiResponse[T]):
    pass

class ErrorResponse(BaseModel):
    code: int
    message: str
    detail: Optional[str] = None

class PaginatedResponse(BaseModel, Generic[T]):
    code: int = 200
    message: str = "success"
    data: list[T] = []
    total: int = 0
    page: int = 1
    page_size: int = 10
    total_pages: int = 0

    class Config:
        from_attributes = True
