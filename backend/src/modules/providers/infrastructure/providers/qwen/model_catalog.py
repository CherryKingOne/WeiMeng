from src.modules.providers.infrastructure.providers.fastchat.model_catalog import (
    OpenAICompatibleModelCatalogProvider,
)
from src.modules.providers.infrastructure.providers.qwen.llm_adapter import QwenLLMAdapter


class QwenModelCatalogProvider(OpenAICompatibleModelCatalogProvider):
    MODELS_ENDPOINT = f"{QwenLLMAdapter.DEFAULT_BASE_URL}/models"
    DEFAULT_MODEL = QwenLLMAdapter.DEFAULT_MODEL
    FALLBACK_MODELS = (QwenLLMAdapter.DEFAULT_MODEL,)

    def fetch_model_detail(self, api_key: str | None, model_id: str) -> dict[str, object] | None:
        return super().fetch_model_detail(api_key=api_key, model_id=model_id)
