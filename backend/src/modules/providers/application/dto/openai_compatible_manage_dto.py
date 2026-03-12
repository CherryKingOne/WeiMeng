from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class UpsertOpenAICompatibleConfigRequest(BaseModel):
    provider: Literal["openai-compatible"] = Field(
        ...,
        description="固定值 openai-compatible（与标准供应商配置复用同一 providers 表）",
    )
    base_url: str = Field(..., min_length=1, max_length=1024, description="第三方兼容服务 Base URL")
    api_key: str = Field(..., min_length=1, max_length=1024, description="第三方兼容服务 API Key")
    model: str = Field(..., min_length=1, max_length=128, description="兼容模型名称")
    max_token: int = Field(default=128000, gt=0, description="最大输出 token，默认 128000")
    temperature: float = Field(default=0.7, ge=0, le=2, description="温度参数，默认 0.7")

    @model_validator(mode="after")
    def normalize(self) -> "UpsertOpenAICompatibleConfigRequest":
        self.base_url = self.base_url.strip()
        self.api_key = self.api_key.strip()
        self.model = self.model.strip()
        return self


class UpsertOpenAICompatibleConfigResponse(BaseModel):
    provider: Literal["openai-compatible"]
    model: str
    configured: bool
    created: bool


class OpenAICompatibleModelItem(BaseModel):
    provider: Literal["openai-compatible"]
    base_url: str
    model: str
    max_token: int | None = None
    temperature: float | None = None
    created_at: datetime
    updated_at: datetime


class ListOpenAICompatibleModelsResponse(BaseModel):
    models: list[OpenAICompatibleModelItem]


class DeleteOpenAICompatibleConfigResponse(BaseModel):
    provider: Literal["openai-compatible"]
    model: str
    deleted: bool
