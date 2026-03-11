from dataclasses import dataclass

from src.modules.providers.domain.value_objects.provider_name import ProviderName


@dataclass(frozen=True)
class ProviderCatalog:
    provider: ProviderName
    base_url: str
    conversation_template: str
    default_model: str
    models: tuple[str, ...]
    selected_model: str | None = None
    selected_model_detail: dict[str, object] | None = None
