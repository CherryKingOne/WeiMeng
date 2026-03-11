from typing import Any

from pydantic import BaseModel

from src.modules.providers.domain.value_objects.model_type import ModelType
from src.modules.providers.domain.value_objects.provider_name import ProviderName


class ProviderCapabilityItem(BaseModel):
    provider: ProviderName
    model_types: list[ModelType]
    configured: bool


class SupportedProvidersResponse(BaseModel):
    providers: list[ProviderCapabilityItem]


class ProviderModelItem(BaseModel):
    provider: ProviderName
    configured: bool
    model_types: list[ModelType]
    conversation_template: str
    default_model: str
    models: list[str]
    selected_model: str | None = None
    selected_model_detail: dict[str, Any] | None = None


class ProviderModelsResponse(BaseModel):
    providers: list[ProviderModelItem]
