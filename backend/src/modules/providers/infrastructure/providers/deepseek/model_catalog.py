from src.modules.providers.infrastructure.providers.deepseek.llm_adapter import DeepSeekLLMAdapter
from src.modules.providers.infrastructure.providers.fastchat.model_catalog import (
    OpenAICompatibleModelCatalogProvider,
)


class DeepSeekModelCatalogProvider(OpenAICompatibleModelCatalogProvider):
    MODELS_ENDPOINT = f"{DeepSeekLLMAdapter.DEFAULT_BASE_URL}/models"
    DEFAULT_MODEL = DeepSeekLLMAdapter.DEFAULT_MODEL
    FALLBACK_MODELS = DeepSeekLLMAdapter.SUPPORTED_MODELS

    def fetch_model_detail(self, api_key: str | None, model_id: str) -> dict[str, object] | None:
        return super().fetch_model_detail(api_key=api_key, model_id=model_id)
