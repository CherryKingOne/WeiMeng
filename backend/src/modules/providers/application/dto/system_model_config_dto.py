from pydantic import BaseModel, Field

from src.modules.providers.domain.value_objects.provider_name import ProviderName


class UpsertSystemModelConfigRequest(BaseModel):
    provider: ProviderName = Field(..., description="系统默认模型供应商")
    model_name: str = Field(..., min_length=1, max_length=128, description="系统默认模型名称")


class UpsertSystemModelConfigResponse(BaseModel):
    configured: bool
    created: bool
    provider: ProviderName
    model_name: str


class GetSystemModelConfigResponse(BaseModel):
    configured: bool
    provider: ProviderName | None = None
    model_name: str | None = None
