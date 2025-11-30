from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserInfoCreate(BaseModel):
    """新增用户的请求模型"""
    email: EmailStr
    password: str = Field(..., min_length=6, description="密码至少6位")


class UserInfoUpdate(BaseModel):
    """修改用户信息的请求模型"""
    account: Optional[str] = Field(None, max_length=50, description="账号")
    username: Optional[str] = Field(None, max_length=50, description="用户名(昵称)")
    password: Optional[str] = Field(None, min_length=6, description="新密码")


class UserInfoResponse(BaseModel):
    """用户信息响应模型"""
    id: str
    email: EmailStr
    account: str
    username: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserInfoListResponse(BaseModel):
    """用户列表响应模型"""
    total: int
    page: int
    page_size: int
    items: list[UserInfoResponse]
