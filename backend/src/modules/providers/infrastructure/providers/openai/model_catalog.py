from src.modules.providers.infrastructure.providers.fastchat.model_catalog import (
    OpenAICompatibleModelCatalogProvider,
)
from src.modules.providers.infrastructure.providers.openai.llm_adapter import OpenAILLMAdapter


class OpenAIModelCatalogProvider(OpenAICompatibleModelCatalogProvider):
    MODELS_ENDPOINT = f"{OpenAILLMAdapter.DEFAULT_BASE_URL}/models"
    DEFAULT_MODEL = OpenAILLMAdapter.DEFAULT_MODEL
    FALLBACK_MODELS = OpenAILLMAdapter.SUPPORTED_MODELS

    def fetch_model_detail(self, api_key: str | None, model_id: str) -> dict[str, object] | None:
        return super().fetch_model_detail(api_key=api_key, model_id=model_id)
