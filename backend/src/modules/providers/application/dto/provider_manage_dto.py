from pydantic import BaseModel, Field

from src.modules.providers.domain.value_objects.provider_name import ProviderName


class UpsertProviderConfigRequest(BaseModel):
    provider: ProviderName = Field(..., description="模型供应商")
    api_key: str = Field(..., min_length=1, max_length=1024, description="供应商 API Key")


class UpsertProviderConfigResponse(BaseModel):
    provider: ProviderName
    configured: bool
    created: bool
