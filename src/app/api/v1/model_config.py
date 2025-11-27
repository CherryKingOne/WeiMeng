from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict, Any

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.model_config import ModelConfig
from app.schemas.model_config import (
    ModelConfigCreate,
    ModelConfigUpdate,
    ModelConfigList,
    ModelConfigResponse,
    ModelConfigListResponse
)
from app.utils.encryption import generate_wm_id, encrypt_key, decrypt_key

router = APIRouter()


@router.post("/create", response_model=Dict[str, Any])
async def create_model_config(
    req: ModelConfigCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """创建模型配置"""
    config_id = generate_wm_id()
    encrypted_api_key = encrypt_key(req.api_key)

    new_config = ModelConfig(
        id=config_id,
        tenant_id=current_user.id,
        model_name=req.model_name,
        model_type=req.model_type,
        base_url=req.base_url,
        encrypted_api_key=encrypted_api_key,
        description=req.description
    )

    db.add(new_config)
    await db.commit()

    return {
        "code": 200,
        "msg": "success",
        "data": {
            "config_id": config_id,
            "model_name": req.model_name,
            "model_type": req.model_type.value,
            "base_url": req.base_url
        }
    }


@router.get("/list", response_model=Dict[str, Any])
async def list_model_configs(
    page: int = 1,
    page_size: int = 10,
    keyword: str = None,
    model_type: str = None,
    config_id: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """查询模型配置列表

    参数:
    - page: 页码
    - page_size: 每页数量
    - keyword: 按模型名称搜索（可选）
    - model_type: 按模型类型筛选（可选）：LLM, Rerank, Text Embedding, Speech2text, TTS, Video, Image
    - config_id: 按配置ID查询指定模型（可选）
    """
    query = select(ModelConfig).where(
        ModelConfig.tenant_id == current_user.id,
        ModelConfig.is_deleted == False
    )

    if config_id:
        query = query.where(ModelConfig.id == config_id)

    if keyword:
        query = query.where(ModelConfig.model_name.ilike(f"%{keyword}%"))

    if model_type:
        query = query.where(ModelConfig.model_type == model_type)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    configs = result.scalars().all()

    config_list = [
        ModelConfigResponse(
            config_id=config.id,
            model_name=config.model_name,
            model_type=config.model_type,
            base_url=config.base_url,
            api_key=decrypt_key(config.encrypted_api_key),
            description=config.description,
            created_at=config.created_at
        )
        for config in configs
    ]

    return {
        "code": 200,
        "msg": "success",
        "data": {
            "total": total,
            "list": config_list
        }
    }


@router.put("/{config_id}", response_model=Dict[str, Any])
async def update_model_config(
    config_id: str,
    req: ModelConfigUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新模型配置"""
    result = await db.execute(
        select(ModelConfig).where(
            ModelConfig.id == config_id,
            ModelConfig.tenant_id == current_user.id,
            ModelConfig.is_deleted == False
        )
    )
    config = result.scalars().first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found"
        )

    if req.model_name:
        config.model_name = req.model_name
    if req.model_type:
        config.model_type = req.model_type
    if req.base_url:
        config.base_url = req.base_url
    if req.api_key:
        config.encrypted_api_key = encrypt_key(req.api_key)
    if req.description is not None:
        config.description = req.description

    await db.commit()

    return {
        "code": 200,
        "msg": "updated successfully"
    }


@router.delete("/{config_id}", response_model=Dict[str, Any])
async def delete_model_config(
    config_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """删除模型配置"""
    result = await db.execute(
        select(ModelConfig).where(
            ModelConfig.id == config_id,
            ModelConfig.tenant_id == current_user.id,
            ModelConfig.is_deleted == False
        )
    )
    config = result.scalars().first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found"
        )

    config.is_deleted = True
    await db.commit()

    return {
        "code": 200,
        "msg": "deleted successfully"
    }
