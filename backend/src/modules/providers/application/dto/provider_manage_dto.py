from pydantic import BaseModel, Field, model_validator

from src.modules.providers.domain.value_objects.provider_name import ProviderName


class UpsertProviderConfigRequest(BaseModel):
    provider: ProviderName = Field(..., description="模型供应商")
    api_key: str = Field(..., min_length=1, max_length=1024, description="供应商 API Key")

    @model_validator(mode="after")
    def validate_provider(self) -> "UpsertProviderConfigRequest":
        if self.provider == ProviderName.OPENAI_COMPATIBLE:
            raise ValueError(
                "provider=openai-compatible must use /api/v1/models/providers/openai-compatible"
            )
        return self


class UpsertProviderConfigResponse(BaseModel):
    provider: ProviderName
    configured: bool
    created: bool
