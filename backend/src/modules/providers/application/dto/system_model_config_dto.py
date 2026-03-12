from pydantic import BaseModel, Field

from src.modules.providers.domain.value_objects.system_model_type import SystemModelType
from src.modules.providers.domain.value_objects.provider_name import ProviderName


class UpsertSystemModelConfigRequest(BaseModel):
    type: SystemModelType = Field(..., description="系统模型类型：text / image / video")
    provider: ProviderName = Field(..., description="系统默认模型供应商")
    model_name: str = Field(..., min_length=1, max_length=128, description="系统默认模型名称")


class UpsertSystemModelConfigResponse(BaseModel):
    configured: bool
    created: bool
    type: SystemModelType
    provider: ProviderName
    model_name: str


class GetSystemModelConfigResponse(BaseModel):
    configured: bool
    type: SystemModelType | None = None
    provider: ProviderName | None = None
    model_name: str | None = None
