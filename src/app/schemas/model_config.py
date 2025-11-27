from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ModelConfigCreate(BaseModel):
    model_name: str = Field(..., description="模型名称")
    base_url: str = Field(..., description="基础URL")
    api_key: str = Field(..., description="API密钥")
    description: Optional[str] = Field(None, description="备注信息")


class ModelConfigUpdate(BaseModel):
    model_name: Optional[str] = Field(None, description="模型名称")
    base_url: Optional[str] = Field(None, description="基础URL")
    api_key: Optional[str] = Field(None, description="API密钥")
    description: Optional[str] = Field(None, description="备注信息")


class ModelConfigList(BaseModel):
    page: int = Field(1, ge=1, description="页码")
    page_size: int = Field(10, ge=1, le=100, description="每页数量")
    keyword: Optional[str] = Field(None, description="搜索关键词")


class ModelConfigDelete(BaseModel):
    config_id: str = Field(..., description="配置ID")


class ModelConfigResponse(BaseModel):
    config_id: str
    model_name: str
    base_url: str
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ModelConfigListResponse(BaseModel):
    total: int
    list: List[ModelConfigResponse]
