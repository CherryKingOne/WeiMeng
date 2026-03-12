from src.modules.providers.application.dto.generate_request_dto import (
    GenerateTextRequest,
    GenerateTextResponse,
)
from src.modules.providers.application.dto.provider_config_dto import (
    ProviderCapabilityItem,
    ProviderModelItem,
    ProviderModelsResponse,
    SupportedProvidersResponse,
)
from src.modules.providers.domain.exceptions import (
    ModelGenerationFailedException,
    ProviderConfigNotFoundException,
    ProviderModelNotSupportedException,
)
from src.modules.providers.domain.repositories import IProviderConfigRepository
from src.modules.providers.domain.value_objects.model_type import ModelType
from src.modules.providers.domain.value_objects.provider_name import ProviderName
from src.modules.providers.infrastructure.factories import ModelProviderFactory
from src.modules.providers.infrastructure.providers.openai.llm_adapter import OpenAILLMAdapter
from src.modules.providers.infrastructure.repositories.provider_persistence_repository import (
    ProviderPersistenceRepository,
)
from src.shared.domain.exceptions import DomainException


class ModelGenerationService:
    def __init__(
        self,
        provider_config_repository: IProviderConfigRepository,
        provider_persistence_repository: ProviderPersistenceRepository | None = None,
        user_id: str | None = None,
    ):
        self._provider_config_repository = provider_config_repository
        self._provider_persistence_repository = provider_persistence_repository
        self._user_id = user_id

    async def generate_llm_text(self, request: GenerateTextRequest) -> GenerateTextResponse:
        provider_config = self._provider_config_repository.get_provider_config(request.provider)
        if provider_config is None:
            raise ProviderConfigNotFoundException(request.provider.value)

        model_name = request.model_name or provider_config.default_model
        if model_name not in provider_config.supported_models:
            raise ProviderModelNotSupportedException(
                provider=request.provider.value,
                model=model_name,
            )

        llm_provider = ModelProviderFactory.create(
            provider=request.provider,
            model_type=ModelType.LLM,
            api_key=provider_config.api_key,
            base_url=provider_config.base_url,
            conversation_template=request.conversation_template
            or provider_config.conversation_template,
        )

        generation_kwargs: dict[str, float | int] = {}
        if request.temperature is not None:
            generation_kwargs["temperature"] = request.temperature
        if request.max_tokens is not None:
            generation_kwargs["max_tokens"] = request.max_tokens

        try:
            reply = await llm_provider.generate_text(
                prompt=request.prompt,
                model=model_name,
                **generation_kwargs,
            )
        except DomainException:
            raise
        except Exception as exc:
            raise ModelGenerationFailedException(detail=str(exc)) from exc

        return GenerateTextResponse(
            provider=request.provider,
            model_name=model_name,
            reply=reply,
        )

    def get_supported_providers(self) -> SupportedProvidersResponse:
        configured_providers = set(self._provider_config_repository.list_configured_providers())
        providers: list[ProviderCapabilityItem] = []

        for provider in ModelProviderFactory.list_supported_providers():
            providers.append(
                ProviderCapabilityItem(
                    provider=provider,
                    model_types=ModelProviderFactory.list_supported_model_types(provider),
                    configured=provider in configured_providers,
                )
            )

        return SupportedProvidersResponse(providers=providers)

    async def get_provider_models(
        self,
        provider: ProviderName | None = None,
        model: str | None = None,
    ) -> ProviderModelsResponse:
        selected_model = model.strip() if model else None
        configured_providers = set(self._provider_config_repository.list_configured_providers())
        items: list[ProviderModelItem] = []

        if provider is None:
            catalogs = self._provider_config_repository.list_provider_catalog()
        elif provider == ProviderName.OPENAI_COMPATIBLE:
            catalogs = []
        else:
            catalog = self._provider_config_repository.get_provider_catalog(
                provider,
                model=selected_model,
            )
            catalogs = [catalog] if catalog is not None else []

        for catalog in catalogs:
            items.append(
                ProviderModelItem(
                    provider=catalog.provider,
                    configured=catalog.provider in configured_providers,
                    model_types=ModelProviderFactory.list_supported_model_types(catalog.provider),
                    conversation_template=catalog.conversation_template,
                    default_model=catalog.default_model,
                    models=list(catalog.models),
                    selected_model=catalog.selected_model,
                    selected_model_detail=catalog.selected_model_detail,
                )
            )

        if provider is None or provider == ProviderName.OPENAI_COMPATIBLE:
            openai_compatible_item = await self._build_openai_compatible_provider_item(
                selected_model=selected_model if provider == ProviderName.OPENAI_COMPATIBLE else None
            )
            if openai_compatible_item is not None:
                items.append(openai_compatible_item)

        return ProviderModelsResponse(providers=items)

    async def _build_openai_compatible_provider_item(
        self,
        selected_model: str | None = None,
    ) -> ProviderModelItem | None:
        if self._provider_persistence_repository is None or self._user_id is None:
            return None

        records = await self._provider_persistence_repository.list_openai_compatible_configs(
            user_id=self._user_id
        )
        normalized_models = [record.payload.model.strip() for record in records if record.payload.model.strip()]
        models = sorted(set(normalized_models), key=str.lower)
        records_by_model = {record.payload.model.strip().lower(): record for record in records}
        selected_model_detail = None
        if selected_model:
            selected_record = records_by_model.get(selected_model.lower())
            if selected_record is None:
                selected_model_detail = {
                    "id": selected_model,
                    "error": "model_detail_unavailable",
                }
            else:
                selected_model_detail = {
                    "id": selected_record.payload.model,
                    "base_url": selected_record.payload.base_url,
                    "max_token": selected_record.payload.max_token,
                    "temperature": selected_record.payload.temperature,
                }

        return ProviderModelItem(
            provider=ProviderName.OPENAI_COMPATIBLE,
            configured=bool(records),
            model_types=[ModelType.LLM],
            conversation_template=OpenAILLMAdapter.DEFAULT_CONVERSATION_TEMPLATE,
            default_model=models[0] if models else "",
            models=models,
            selected_model=selected_model,
            selected_model_detail=selected_model_detail,
        )
