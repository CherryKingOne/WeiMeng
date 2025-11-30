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
    UserInfoListResponse
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


@router.get("/{user_id}", response_model=UserInfoResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """查询单个用户详情"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@router.put("/{user_id}", response_model=UserInfoResponse)
async def update_user(
    user_id: str,
    user_data: UserInfoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    修改用户信息
    - 支持修改账号、用户名、密码
    - 修改账号时检查唯一性
    - 修改密码时自动加密
    """
    # 查询用户
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # 更新账号
    if user_data.account is not None:
        # 检查账号唯一性
        result = await db.execute(
            select(User).where(
                User.account == user_data.account,
                User.id != user_id
            )
        )
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account already exists"
            )
        user.account = user_data.account

    # 更新用户名
    if user_data.username is not None:
        user.username = user_data.username

    # 更新密码
    if user_data.password is not None:
        user.hashed_password = get_password_hash(user_data.password)

    await db.commit()
    await db.refresh(user)

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除用户"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # 防止删除自己
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )

    await db.delete(user)
    await db.commit()

    return None
