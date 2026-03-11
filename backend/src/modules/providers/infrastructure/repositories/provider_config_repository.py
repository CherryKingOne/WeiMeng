from src.modules.providers.domain.entities.provider_catalog import ProviderCatalog
from src.modules.providers.domain.entities.provider_config import ProviderConfig
from src.modules.providers.domain.repositories import IProviderConfigRepository
from src.modules.providers.domain.value_objects.provider_name import ProviderName
from src.modules.providers.infrastructure.providers.anthropic.llm_adapter import AnthropicLLMAdapter
from src.modules.providers.infrastructure.providers.anthropic.model_catalog import (
    AnthropicModelCatalogProvider,
)
from src.modules.providers.infrastructure.providers.deepseek.llm_adapter import DeepSeekLLMAdapter
from src.modules.providers.infrastructure.providers.deepseek.model_catalog import (
    DeepSeekModelCatalogProvider,
)
from src.modules.providers.infrastructure.providers.gemini.llm_adapter import GeminiLLMAdapter
from src.modules.providers.infrastructure.providers.gemini.model_catalog import GeminiModelCatalogProvider
from src.modules.providers.infrastructure.providers.glm.llm_adapter import GLMLLMAdapter
from src.modules.providers.infrastructure.providers.glm.model_catalog import GLMModelCatalogProvider
from src.modules.providers.infrastructure.providers.grok.llm_adapter import GrokLLMAdapter
from src.modules.providers.infrastructure.providers.grok.model_catalog import GrokModelCatalogProvider
from src.modules.providers.infrastructure.providers.kimi.llm_adapter import KimiLLMAdapter
from src.modules.providers.infrastructure.providers.kimi.model_catalog import KimiModelCatalogProvider
from src.modules.providers.infrastructure.providers.minimax.llm_adapter import MiniMaxLLMAdapter
from src.modules.providers.infrastructure.providers.minimax.model_catalog import (
    MiniMaxModelCatalogProvider,
)
from src.modules.providers.infrastructure.providers.openai.llm_adapter import OpenAILLMAdapter
from src.modules.providers.infrastructure.providers.openai.model_catalog import OpenAIModelCatalogProvider
from src.modules.providers.infrastructure.providers.qwen.llm_adapter import QwenLLMAdapter
from src.modules.providers.infrastructure.providers.qwen.model_catalog import QwenModelCatalogProvider
from src.modules.providers.infrastructure.providers.volcengine.llm_adapter import VolcengineLLMAdapter
from src.modules.providers.infrastructure.providers.volcengine.model_catalog import (
    VolcengineModelCatalogProvider,
)
from src.modules.providers.infrastructure.runtime.provider_key_store import provider_key_store


class EnvironmentProviderConfigRepository(IProviderConfigRepository):
    _qwen_model_catalog_provider = QwenModelCatalogProvider()
    _model_catalog_providers = {
        ProviderName.OPENAI: OpenAIModelCatalogProvider(),
        ProviderName.QWEN: _qwen_model_catalog_provider,
        ProviderName.VOLCENGINE: VolcengineModelCatalogProvider(),
        ProviderName.GROK: GrokModelCatalogProvider(),
        ProviderName.GEMINI: GeminiModelCatalogProvider(),
        ProviderName.ANTHROPIC: AnthropicModelCatalogProvider(),
        ProviderName.KIMI: KimiModelCatalogProvider(),
        ProviderName.GLM: GLMModelCatalogProvider(),
        ProviderName.MINIMAX: MiniMaxModelCatalogProvider(),
        ProviderName.DEEPSEEK: DeepSeekModelCatalogProvider(),
    }

    _catalog_templates: tuple[ProviderCatalog, ...] = (
        ProviderCatalog(
            provider=ProviderName.OPENAI,
            base_url=OpenAILLMAdapter.DEFAULT_BASE_URL,
            conversation_template=OpenAILLMAdapter.DEFAULT_CONVERSATION_TEMPLATE,
            default_model=OpenAILLMAdapter.DEFAULT_MODEL,
            models=OpenAILLMAdapter.SUPPORTED_MODELS,
        ),
        ProviderCatalog(
            provider=ProviderName.QWEN,
            base_url=QwenLLMAdapter.DEFAULT_BASE_URL,
            conversation_template=QwenLLMAdapter.DEFAULT_CONVERSATION_TEMPLATE,
            default_model=QwenLLMAdapter.DEFAULT_MODEL,
            models=(QwenLLMAdapter.DEFAULT_MODEL,),
        ),
        ProviderCatalog(
            provider=ProviderName.VOLCENGINE,
            base_url=VolcengineLLMAdapter.DEFAULT_BASE_URL,
            conversation_template=VolcengineLLMAdapter.DEFAULT_CONVERSATION_TEMPLATE,
            default_model=VolcengineLLMAdapter.DEFAULT_MODEL,
            models=VolcengineLLMAdapter.SUPPORTED_MODELS,
        ),
        ProviderCatalog(
            provider=ProviderName.GROK,
            base_url=GrokLLMAdapter.DEFAULT_BASE_URL,
            conversation_template=GrokLLMAdapter.DEFAULT_CONVERSATION_TEMPLATE,
            default_model=GrokLLMAdapter.DEFAULT_MODEL,
            models=GrokLLMAdapter.SUPPORTED_MODELS,
        ),
        ProviderCatalog(
            provider=ProviderName.GEMINI,
            base_url=GeminiLLMAdapter.DEFAULT_BASE_URL,
            conversation_template=GeminiLLMAdapter.DEFAULT_CONVERSATION_TEMPLATE,
            default_model=GeminiLLMAdapter.DEFAULT_MODEL,
            models=GeminiLLMAdapter.SUPPORTED_MODELS,
        ),
        ProviderCatalog(
            provider=ProviderName.ANTHROPIC,
            base_url=AnthropicLLMAdapter.DEFAULT_BASE_URL,
            conversation_template=AnthropicLLMAdapter.DEFAULT_CONVERSATION_TEMPLATE,
            default_model=AnthropicLLMAdapter.DEFAULT_MODEL,
            models=AnthropicLLMAdapter.SUPPORTED_MODELS,
        ),
        ProviderCatalog(
            provider=ProviderName.KIMI,
            base_url=KimiLLMAdapter.DEFAULT_BASE_URL,
            conversation_template=KimiLLMAdapter.DEFAULT_CONVERSATION_TEMPLATE,
            default_model=KimiLLMAdapter.DEFAULT_MODEL,
            models=KimiLLMAdapter.SUPPORTED_MODELS,
        ),
        ProviderCatalog(
            provider=ProviderName.GLM,
            base_url=GLMLLMAdapter.DEFAULT_BASE_URL,
            conversation_template=GLMLLMAdapter.DEFAULT_CONVERSATION_TEMPLATE,
            default_model=GLMLLMAdapter.DEFAULT_MODEL,
            models=GLMLLMAdapter.SUPPORTED_MODELS,
        ),
        ProviderCatalog(
            provider=ProviderName.MINIMAX,
            base_url=MiniMaxLLMAdapter.DEFAULT_BASE_URL,
            conversation_template=MiniMaxLLMAdapter.DEFAULT_CONVERSATION_TEMPLATE,
            default_model=MiniMaxLLMAdapter.DEFAULT_MODEL,
            models=MiniMaxLLMAdapter.SUPPORTED_MODELS,
        ),
        ProviderCatalog(
            provider=ProviderName.DEEPSEEK,
            base_url=DeepSeekLLMAdapter.DEFAULT_BASE_URL,
            conversation_template=DeepSeekLLMAdapter.DEFAULT_CONVERSATION_TEMPLATE,
            default_model=DeepSeekLLMAdapter.DEFAULT_MODEL,
            models=DeepSeekLLMAdapter.SUPPORTED_MODELS,
        ),
    )

    def __init__(self, user_id: str):
        self._user_id = user_id

    def get_provider_config(self, provider: ProviderName) -> ProviderConfig | None:
        catalog = self.get_provider_catalog(provider)
        if catalog is None:
            return None

        api_key = self._read_api_key(provider)
        if not api_key:
            return None

        return ProviderConfig(
            provider=provider,
            api_key=api_key,
            base_url=catalog.base_url,
            conversation_template=catalog.conversation_template,
            default_model=catalog.default_model,
            supported_models=catalog.models,
        )

    def list_configured_providers(self) -> list[ProviderName]:
        providers: list[ProviderName] = []
        for template in self._catalog_templates:
            if self._read_api_key(template.provider):
                providers.append(template.provider)
        return providers

    def get_provider_catalog(
        self,
        provider: ProviderName,
        model: str | None = None,
    ) -> ProviderCatalog | None:
        template = self._find_catalog_template(provider)
        if template is None:
            return None

        selected_model = model.strip() if model else None
        models = template.models
        selected_model_detail: dict[str, object] | None = None
        provider_catalog_provider = self._model_catalog_providers.get(provider)
        api_key = self._read_api_key(provider)
        if provider_catalog_provider is not None:
            models = provider_catalog_provider.fetch_supported_models(api_key=api_key)
            if selected_model:
                if api_key:
                    selected_model_detail = provider_catalog_provider.fetch_model_detail(
                        api_key=api_key,
                        model_id=selected_model,
                    )
                    if selected_model_detail is None:
                        selected_model_detail = {
                            "id": selected_model,
                            "error": "model_detail_unavailable",
                        }
                else:
                    selected_model_detail = {
                        "id": selected_model,
                        "error": "provider_api_key_not_configured",
                    }
        elif selected_model:
            selected_model_detail = {
                "id": selected_model,
                "error": "model_catalog_provider_not_implemented",
            }

        return ProviderCatalog(
            provider=template.provider,
            base_url=template.base_url,
            conversation_template=template.conversation_template,
            default_model=template.default_model,
            models=models,
            selected_model=selected_model,
            selected_model_detail=selected_model_detail,
        )

    def list_provider_catalog(self) -> list[ProviderCatalog]:
        catalogs: list[ProviderCatalog] = []
        for template in self._catalog_templates:
            catalog = self.get_provider_catalog(template.provider)
            if catalog is not None:
                catalogs.append(catalog)
        return catalogs

    def _find_catalog_template(self, provider: ProviderName) -> ProviderCatalog | None:
        for template in self._catalog_templates:
            if template.provider == provider:
                return template
        return None

    def _read_api_key(self, provider: ProviderName) -> str | None:
        return provider_key_store.get_key(user_id=self._user_id, provider=provider)
