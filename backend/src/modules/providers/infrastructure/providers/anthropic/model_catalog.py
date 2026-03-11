from src.modules.providers.infrastructure.providers.anthropic.llm_adapter import AnthropicLLMAdapter
from src.modules.providers.infrastructure.providers.fastchat.model_catalog import (
    OpenAICompatibleModelCatalogProvider,
)


class AnthropicModelCatalogProvider(OpenAICompatibleModelCatalogProvider):
    MODELS_ENDPOINT = f"{AnthropicLLMAdapter.DEFAULT_BASE_URL}/models"
    DEFAULT_MODEL = AnthropicLLMAdapter.DEFAULT_MODEL
    FALLBACK_MODELS = AnthropicLLMAdapter.SUPPORTED_MODELS

    def fetch_model_detail(self, api_key: str | None, model_id: str) -> dict[str, object] | None:
        return super().fetch_model_detail(api_key=api_key, model_id=model_id)
