from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user_info import (
    UserInfoCreate,
    UserInfoUpdate,
    UserInfoResponse,
    UserInfoListResponse,
    UserDeleteRequest
)
from app.utils.id_generator import generate_user_id
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserInfoResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """获取当前登录用户信息"""
    return current_user


@router.put("/me", response_model=UserInfoResponse)
async def update_current_user(
    user_data: UserInfoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    修改当前登录用户信息
    - 支持修改账号、用户名、密码
    - 修改账号时检查唯一性
    - 修改密码时自动加密
    """
    # 更新账号
    if user_data.account is not None:
        # 检查账号唯一性
        result = await db.execute(
            select(User).where(
                User.account == user_data.account,
                User.id != current_user.id
            )
        )
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account already exists"
            )
        current_user.account = user_data.account

    # 更新用户名
    if user_data.username is not None:
        current_user.username = user_data.username

    # 更新密码
    if user_data.password is not None:
        current_user.hashed_password = get_password_hash(user_data.password)

    await db.commit()
    await db.refresh(current_user)

    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user(
    delete_request: UserDeleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    注销当前登录用户账号
    - 需要输入当前密码确认注销操作
    - 密码验证失败将返回401错误
    """
    from app.core.security import verify_password

    # 验证密码
    if not verify_password(delete_request.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )

    # 密码验证通过，删除用户
    await db.delete(current_user)
    await db.commit()

    return None
