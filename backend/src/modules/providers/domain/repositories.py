from abc import ABC, abstractmethod

from src.modules.providers.domain.entities.provider_catalog import ProviderCatalog
from src.modules.providers.domain.entities.provider_config import ProviderConfig
from src.modules.providers.domain.value_objects.provider_name import ProviderName


class IProviderConfigRepository(ABC):
    @abstractmethod
    def get_provider_config(self, provider: ProviderName) -> ProviderConfig | None:
        pass

    @abstractmethod
    def list_configured_providers(self) -> list[ProviderName]:
        pass

    @abstractmethod
    def get_provider_catalog(
        self,
        provider: ProviderName,
        model: str | None = None,
    ) -> ProviderCatalog | None:
        pass

    @abstractmethod
    def list_provider_catalog(self) -> list[ProviderCatalog]:
        pass
