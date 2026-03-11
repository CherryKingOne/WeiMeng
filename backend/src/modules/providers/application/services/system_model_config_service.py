from src.modules.providers.application.dto.system_model_config_dto import (
    GetSystemModelConfigResponse,
    UpsertSystemModelConfigRequest,
    UpsertSystemModelConfigResponse,
)
from src.modules.providers.domain.exceptions import (
    ProviderConfigNotFoundException,
    ProviderModelNotSupportedException,
)
from src.modules.providers.domain.repositories import IProviderConfigRepository
from src.modules.providers.domain.value_objects.provider_name import ProviderName
from src.modules.providers.infrastructure.repositories.system_model_config_repository import (
    SystemModelConfigRepository,
)


class SystemModelConfigService:
    def __init__(
        self,
        user_id: str,
        provider_config_repository: IProviderConfigRepository,
        system_model_config_repository: SystemModelConfigRepository,
    ):
        self._user_id = user_id
        self._provider_config_repository = provider_config_repository
        self._system_model_config_repository = system_model_config_repository

    async def upsert(
        self,
        request: UpsertSystemModelConfigRequest,
    ) -> UpsertSystemModelConfigResponse:
        provider_config = self._provider_config_repository.get_provider_config(request.provider)
        if provider_config is None:
            raise ProviderConfigNotFoundException(request.provider.value)

        model_name = request.model_name.strip()
        catalog = self._provider_config_repository.get_provider_catalog(request.provider)
        supported_models = catalog.models if catalog is not None else ()
        if model_name not in supported_models:
            raise ProviderModelNotSupportedException(
                provider=request.provider.value,
                model=model_name,
            )

        _, created = await self._system_model_config_repository.upsert(
            user_id=self._user_id,
            provider=request.provider,
            model_name=model_name,
        )
        return UpsertSystemModelConfigResponse(
            configured=True,
            created=created,
            provider=request.provider,
            model_name=model_name,
        )

    async def get(self) -> GetSystemModelConfigResponse:
        model = await self._system_model_config_repository.get_by_user_id(user_id=self._user_id)
        if model is None:
            return GetSystemModelConfigResponse(configured=False)

        try:
            provider = ProviderName(model.provider)
        except ValueError:
            return GetSystemModelConfigResponse(configured=False)

        return GetSystemModelConfigResponse(
            configured=True,
            provider=provider,
            model_name=model.model_name,
        )
