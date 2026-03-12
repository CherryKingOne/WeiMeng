from src.modules.providers.application.dto.openai_compatible_manage_dto import (
    DeleteOpenAICompatibleConfigResponse,
    ListOpenAICompatibleModelsResponse,
    OpenAICompatibleModelItem,
    UpsertOpenAICompatibleConfigRequest,
    UpsertOpenAICompatibleConfigResponse,
)
from src.modules.providers.domain.exceptions import (
    OpenAICompatibleModelAlreadyExistsException,
    OpenAICompatibleModelNotFoundException,
)
from src.modules.providers.infrastructure.providers.openai_compatible import (
    OPENAI_COMPATIBLE_PROVIDER,
)
from src.modules.providers.infrastructure.repositories.provider_persistence_repository import (
    ProviderPersistenceRepository,
)


class OpenAICompatibleConfigManagementService:
    def __init__(
        self,
        provider_persistence_repository: ProviderPersistenceRepository,
        user_id: str,
    ):
        self._provider_persistence_repository = provider_persistence_repository
        self._user_id = user_id

    async def create_config(
        self,
        request: UpsertOpenAICompatibleConfigRequest,
    ) -> UpsertOpenAICompatibleConfigResponse:
        _, created = await self._provider_persistence_repository.create_openai_compatible_config(
            user_id=self._user_id,
            provider=request.provider,
            base_url=request.base_url,
            api_key=request.api_key,
            model=request.model,
            max_token=request.max_token,
            temperature=request.temperature,
        )
        if not created:
            raise OpenAICompatibleModelAlreadyExistsException(request.model)

        return UpsertOpenAICompatibleConfigResponse(
            provider=OPENAI_COMPATIBLE_PROVIDER,
            model=request.model,
            configured=True,
            created=True,
        )

    async def list_configs(self) -> ListOpenAICompatibleModelsResponse:
        records = await self._provider_persistence_repository.list_openai_compatible_configs(
            user_id=self._user_id
        )

        return ListOpenAICompatibleModelsResponse(
            models=[
                OpenAICompatibleModelItem(
                    provider=OPENAI_COMPATIBLE_PROVIDER,
                    base_url=record.payload.base_url,
                    model=record.payload.model,
                    max_token=record.payload.max_token,
                    temperature=record.payload.temperature,
                    created_at=record.created_at,
                    updated_at=record.updated_at,
                )
                for record in records
            ]
        )

    async def update_config(
        self,
        request: UpsertOpenAICompatibleConfigRequest,
    ) -> UpsertOpenAICompatibleConfigResponse:
        record = await self._provider_persistence_repository.update_openai_compatible_config(
            user_id=self._user_id,
            provider=request.provider,
            base_url=request.base_url,
            api_key=request.api_key,
            model=request.model,
            max_token=request.max_token,
            temperature=request.temperature,
        )
        if record is None:
            raise OpenAICompatibleModelNotFoundException(request.model)

        return UpsertOpenAICompatibleConfigResponse(
            provider=OPENAI_COMPATIBLE_PROVIDER,
            model=record.payload.model,
            configured=True,
            created=False,
        )

    async def delete_config(self, model: str) -> DeleteOpenAICompatibleConfigResponse:
        normalized_model = model.strip()
        deleted = await self._provider_persistence_repository.delete_openai_compatible_config(
            user_id=self._user_id,
            model=normalized_model,
        )
        if not deleted:
            raise OpenAICompatibleModelNotFoundException(normalized_model)

        return DeleteOpenAICompatibleConfigResponse(
            provider=OPENAI_COMPATIBLE_PROVIDER,
            model=normalized_model,
            deleted=True,
        )
