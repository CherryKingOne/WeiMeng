from src.modules.providers.infrastructure.providers.fastchat.model_catalog import (
    OpenAICompatibleModelCatalogProvider,
)
from src.modules.providers.infrastructure.providers.grok.llm_adapter import GrokLLMAdapter


class GrokModelCatalogProvider(OpenAICompatibleModelCatalogProvider):
    MODELS_ENDPOINT = f"{GrokLLMAdapter.DEFAULT_BASE_URL}/models"
    DEFAULT_MODEL = GrokLLMAdapter.DEFAULT_MODEL
    FALLBACK_MODELS = GrokLLMAdapter.SUPPORTED_MODELS

    def fetch_model_detail(self, api_key: str | None, model_id: str) -> dict[str, object] | None:
        return super().fetch_model_detail(api_key=api_key, model_id=model_id)
