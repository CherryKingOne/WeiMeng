import asyncio

from src.modules.providers.application.dto.provider_manage_dto import UpsertProviderConfigRequest
from src.modules.providers.application.services.provider_config_management_service import (
    ProviderConfigManagementService,
)
from src.modules.providers.domain.value_objects.provider_name import ProviderName
from src.modules.providers.infrastructure.runtime.provider_key_store import provider_key_store


class _FakeProviderPersistenceRepository:
    def __init__(self):
        self.last_user_id: str | None = None
        self.last_provider: ProviderName | None = None
        self.last_api_key: str | None = None
        self.created = True

    async def upsert_provider_api_key(
        self,
        user_id: str,
        provider: ProviderName,
        api_key: str,
    ) -> tuple[object, bool]:
        self.last_user_id = user_id
        self.last_provider = provider
        self.last_api_key = api_key
        return object(), self.created


def test_upsert_provider_config_persists_and_updates_runtime_store():
    user_id = "00000000-0000-0000-0000-000000000010"
    repository = _FakeProviderPersistenceRepository()
    service = ProviderConfigManagementService(
        provider_persistence_repository=repository,
        user_id=user_id,
    )

    provider_key_store.clear()

    response = asyncio.run(
        service.upsert_provider_config(
            UpsertProviderConfigRequest(
                provider=ProviderName.GEMINI,
                api_key="  test-gemini-key  ",
            )
        )
    )

    assert repository.last_user_id == user_id
    assert repository.last_provider == ProviderName.GEMINI
    assert repository.last_api_key == "test-gemini-key"
    assert provider_key_store.get_key(user_id, ProviderName.GEMINI) == "test-gemini-key"
    assert response.provider == ProviderName.GEMINI
    assert response.configured is True
    assert response.created is True
