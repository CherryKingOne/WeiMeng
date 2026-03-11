import asyncio
import pytest

from src.modules.providers.application.dto.system_model_config_dto import (
    UpsertSystemModelConfigRequest,
)
from src.modules.providers.application.services.system_model_config_service import (
    SystemModelConfigService,
)
from src.modules.providers.domain.entities.provider_catalog import ProviderCatalog
from src.modules.providers.domain.entities.provider_config import ProviderConfig
from src.modules.providers.domain.exceptions import (
    ProviderConfigNotFoundException,
    ProviderModelNotSupportedException,
)
from src.modules.providers.domain.value_objects.provider_name import ProviderName


class _FakeProviderConfigRepository:
    def __init__(self):
        self.has_config = True
        self.models = ("qwen-plus", "qwen-max")

    def get_provider_config(self, provider: ProviderName) -> ProviderConfig | None:
        if not self.has_config:
            return None
        return ProviderConfig(
            provider=provider,
            api_key="test-key",
            base_url="https://example.com/v1",
            conversation_template="qwen",
            default_model="qwen-plus",
            supported_models=self.models,
        )

    def list_configured_providers(self) -> list[ProviderName]:
        return [ProviderName.QWEN] if self.has_config else []

    def get_provider_catalog(
        self,
        provider: ProviderName,
        model: str | None = None,
    ) -> ProviderCatalog | None:
        _ = model
        if provider != ProviderName.QWEN:
            return None
        return ProviderCatalog(
            provider=provider,
            base_url="https://example.com/v1",
            conversation_template="qwen",
            default_model="qwen-plus",
            models=self.models,
        )

    def list_provider_catalog(self) -> list[ProviderCatalog]:
        return [
            ProviderCatalog(
                provider=ProviderName.QWEN,
                base_url="https://example.com/v1",
                conversation_template="qwen",
                default_model="qwen-plus",
                models=self.models,
            )
        ]


class _FakeSystemModelConfigEntity:
    def __init__(self, provider: str, model_name: str):
        self.provider = provider
        self.model_name = model_name


class _FakeSystemModelConfigRepository:
    def __init__(self):
        self.last_user_id: str | None = None
        self.last_provider: ProviderName | None = None
        self.last_model_name: str | None = None
        self.created = True
        self.current_model: _FakeSystemModelConfigEntity | None = None

    async def upsert(
        self,
        user_id: str,
        provider: ProviderName,
        model_name: str,
    ) -> tuple[object, bool]:
        self.last_user_id = user_id
        self.last_provider = provider
        self.last_model_name = model_name
        self.current_model = _FakeSystemModelConfigEntity(provider=provider.value, model_name=model_name)
        return object(), self.created

    async def get_by_user_id(self, user_id: str):
        self.last_user_id = user_id
        return self.current_model


def test_upsert_system_model_config_success():
    provider_repository = _FakeProviderConfigRepository()
    system_repository = _FakeSystemModelConfigRepository()
    user_id = "00000000-0000-0000-0000-000000000011"
    service = SystemModelConfigService(
        user_id=user_id,
        provider_config_repository=provider_repository,
        system_model_config_repository=system_repository,
    )

    response = asyncio.run(
        service.upsert(
            UpsertSystemModelConfigRequest(
                provider=ProviderName.QWEN,
                model_name=" qwen-max ",
            )
        )
    )

    assert system_repository.last_user_id == user_id
    assert system_repository.last_provider == ProviderName.QWEN
    assert system_repository.last_model_name == "qwen-max"
    assert response.configured is True
    assert response.created is True
    assert response.provider == ProviderName.QWEN
    assert response.model_name == "qwen-max"


def test_upsert_system_model_config_raises_when_provider_not_configured():
    provider_repository = _FakeProviderConfigRepository()
    provider_repository.has_config = False
    service = SystemModelConfigService(
        user_id="00000000-0000-0000-0000-000000000012",
        provider_config_repository=provider_repository,
        system_model_config_repository=_FakeSystemModelConfigRepository(),
    )

    with pytest.raises(ProviderConfigNotFoundException):
        asyncio.run(
            service.upsert(
                UpsertSystemModelConfigRequest(
                    provider=ProviderName.QWEN,
                    model_name="qwen-max",
                )
            )
        )


def test_upsert_system_model_config_raises_when_model_not_supported():
    provider_repository = _FakeProviderConfigRepository()
    service = SystemModelConfigService(
        user_id="00000000-0000-0000-0000-000000000013",
        provider_config_repository=provider_repository,
        system_model_config_repository=_FakeSystemModelConfigRepository(),
    )

    with pytest.raises(ProviderModelNotSupportedException):
        asyncio.run(
            service.upsert(
                UpsertSystemModelConfigRequest(
                    provider=ProviderName.QWEN,
                    model_name="qwen-unknown",
                )
            )
        )


def test_get_system_model_config_returns_not_configured_when_missing():
    service = SystemModelConfigService(
        user_id="00000000-0000-0000-0000-000000000014",
        provider_config_repository=_FakeProviderConfigRepository(),
        system_model_config_repository=_FakeSystemModelConfigRepository(),
    )

    response = asyncio.run(service.get())

    assert response.configured is False
    assert response.provider is None
    assert response.model_name is None


def test_get_system_model_config_returns_saved_value():
    repository = _FakeSystemModelConfigRepository()
    repository.current_model = _FakeSystemModelConfigEntity(
        provider=ProviderName.QWEN.value,
        model_name="qwen-max",
    )
    service = SystemModelConfigService(
        user_id="00000000-0000-0000-0000-000000000015",
        provider_config_repository=_FakeProviderConfigRepository(),
        system_model_config_repository=repository,
    )

    response = asyncio.run(service.get())

    assert response.configured is True
    assert response.provider == ProviderName.QWEN
    assert response.model_name == "qwen-max"
