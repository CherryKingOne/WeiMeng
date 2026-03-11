from dataclasses import dataclass

from src.modules.providers.domain.value_objects.provider_name import ProviderName


@dataclass(frozen=True)
class ProviderConfig:
    provider: ProviderName
    api_key: str
    base_url: str
    conversation_template: str
    default_model: str
    supported_models: tuple[str, ...]
