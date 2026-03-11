from src.modules.providers.application.dto.provider_manage_dto import (
    UpsertProviderConfigRequest,
    UpsertProviderConfigResponse,
)
from src.modules.providers.infrastructure.repositories.provider_persistence_repository import (
    ProviderPersistenceRepository,
)
from src.modules.providers.infrastructure.runtime.provider_key_store import provider_key_store


class ProviderConfigManagementService:
    def __init__(
        self,
        provider_persistence_repository: ProviderPersistenceRepository,
        user_id: str,
    ):
        self._provider_persistence_repository = provider_persistence_repository
        self._user_id = user_id

    async def upsert_provider_config(
        self,
        request: UpsertProviderConfigRequest,
    ) -> UpsertProviderConfigResponse:
        _, created = await self._provider_persistence_repository.upsert_provider_api_key(
            user_id=self._user_id,
            provider=request.provider,
            api_key=request.api_key.strip(),
        )

        # Keep in-memory runtime config in sync after DB write.
        provider_key_store.set_key(
            user_id=self._user_id,
            provider=request.provider,
            api_key=request.api_key,
        )

        return UpsertProviderConfigResponse(
            provider=request.provider,
            configured=True,
            created=created,
        )
