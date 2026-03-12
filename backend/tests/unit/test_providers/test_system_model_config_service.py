import asyncio
import uuid
from datetime import datetime, timezone

import pytest

from src.modules.providers.application.dto.system_model_config_dto import (
    SystemModelType,
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
from src.modules.providers.infrastructure.providers.openai_compatible import (
    OPENAI_COMPATIBLE_PROVIDER,
    OpenAICompatibleConfigPayload,
    OpenAICompatibleConfigRecord,
)


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
    def __init__(self, provider: str, model_name: str, model_type: str = "text"):
        self.provider = provider
        self.model_name = model_name
        self.model_type = model_type


class _FakeSystemModelConfigRepository:
    def __init__(self):
        self.last_user_id: str | None = None
        self.last_model_type: SystemModelType | None = None
        self.last_provider: ProviderName | None = None
        self.last_model_name: str | None = None
        self.created = True
        self.current_model: _FakeSystemModelConfigEntity | None = None

    async def upsert(
        self,
        user_id: str,
        model_type: SystemModelType,
        provider: ProviderName,
        model_name: str,
    ) -> tuple[object, bool]:
        self.last_user_id = user_id
        self.last_model_type = model_type
        self.last_provider = provider
        self.last_model_name = model_name
        self.current_model = _FakeSystemModelConfigEntity(
            provider=provider.value,
            model_name=model_name,
            model_type=model_type.value,
        )
        return object(), self.created

    async def get_by_user_id_and_type(self, user_id: str, model_type: SystemModelType):
        self.last_user_id = user_id
        self.last_model_type = model_type
        return self.current_model


class _FakeOpenAICompatiblePersistenceRepository:
    def __init__(self, models: tuple[str, ...] = ("deepseek-chat",)):
        self._models = models

    async def list_openai_compatible_configs(self, user_id: str) -> list[OpenAICompatibleConfigRecord]:
        _ = user_id
        records: list[OpenAICompatibleConfigRecord] = []
        for model_name in self._models:
            records.append(
                OpenAICompatibleConfigRecord(
                    id=uuid.uuid4(),
                    provider_key=f"{OPENAI_COMPATIBLE_PROVIDER}:{model_name}",
                    payload=OpenAICompatibleConfigPayload(
                        provider=OPENAI_COMPATIBLE_PROVIDER,
                        base_url="https://example.com/v1",
                        api_key="test-key",
                        model=model_name,
                        max_token=128000,
                        temperature=0.7,
                    ),
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )
        return records


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
                type=SystemModelType.TEXT,
                provider=ProviderName.QWEN,
                model_name=" qwen-max ",
            )
        )
    )

    assert system_repository.last_user_id == user_id
    assert system_repository.last_model_type == SystemModelType.TEXT
    assert system_repository.last_provider == ProviderName.QWEN
    assert system_repository.last_model_name == "qwen-max"
    assert response.configured is True
    assert response.created is True
    assert response.type == SystemModelType.TEXT
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
                    type=SystemModelType.TEXT,
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
                    type=SystemModelType.TEXT,
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
    assert response.type is None
    assert response.provider is None
    assert response.model_name is None


def test_get_system_model_config_returns_saved_value():
    repository = _FakeSystemModelConfigRepository()
    repository.current_model = _FakeSystemModelConfigEntity(
        provider=ProviderName.QWEN.value,
        model_name="qwen-max",
        model_type=SystemModelType.TEXT.value,
    )
    service = SystemModelConfigService(
        user_id="00000000-0000-0000-0000-000000000015",
        provider_config_repository=_FakeProviderConfigRepository(),
        system_model_config_repository=repository,
    )

    response = asyncio.run(service.get())

    assert response.configured is True
    assert response.type == SystemModelType.TEXT
    assert response.provider == ProviderName.QWEN
    assert response.model_name == "qwen-max"


def test_upsert_system_model_config_supports_openai_compatible():
    system_repository = _FakeSystemModelConfigRepository()
    service = SystemModelConfigService(
        user_id="00000000-0000-0000-0000-000000000016",
        provider_config_repository=_FakeProviderConfigRepository(),
        provider_persistence_repository=_FakeOpenAICompatiblePersistenceRepository(
            models=("deepseek-chat", "gpt-4o-mini")
        ),
        system_model_config_repository=system_repository,
    )

    response = asyncio.run(
        service.upsert(
            UpsertSystemModelConfigRequest(
                type=SystemModelType.TEXT,
                provider=ProviderName.OPENAI_COMPATIBLE,
                model_name="deepseek-chat",
            )
        )
    )

    assert response.configured is True
    assert response.type == SystemModelType.TEXT
    assert response.provider == ProviderName.OPENAI_COMPATIBLE
    assert response.model_name == "deepseek-chat"
    assert system_repository.last_model_type == SystemModelType.TEXT
    assert system_repository.last_provider == ProviderName.OPENAI_COMPATIBLE


def test_upsert_system_model_config_openai_compatible_model_not_supported():
    service = SystemModelConfigService(
        user_id="00000000-0000-0000-0000-000000000017",
        provider_config_repository=_FakeProviderConfigRepository(),
        provider_persistence_repository=_FakeOpenAICompatiblePersistenceRepository(
            models=("gpt-4o-mini",)
        ),
        system_model_config_repository=_FakeSystemModelConfigRepository(),
    )

    with pytest.raises(ProviderModelNotSupportedException):
        asyncio.run(
            service.upsert(
                UpsertSystemModelConfigRequest(
                    type=SystemModelType.TEXT,
                    provider=ProviderName.OPENAI_COMPATIBLE,
                    model_name="deepseek-chat",
                )
            )
        )
