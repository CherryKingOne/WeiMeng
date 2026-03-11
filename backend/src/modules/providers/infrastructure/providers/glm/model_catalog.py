from src.modules.providers.infrastructure.providers.fastchat.model_catalog import (
    OpenAICompatibleModelCatalogProvider,
)
from src.modules.providers.infrastructure.providers.glm.llm_adapter import GLMLLMAdapter


class GLMModelCatalogProvider(OpenAICompatibleModelCatalogProvider):
    MODELS_ENDPOINT = f"{GLMLLMAdapter.DEFAULT_BASE_URL}/models"
    DEFAULT_MODEL = GLMLLMAdapter.DEFAULT_MODEL
    FALLBACK_MODELS = GLMLLMAdapter.SUPPORTED_MODELS

    def fetch_model_detail(self, api_key: str | None, model_id: str) -> dict[str, object] | None:
        return super().fetch_model_detail(api_key=api_key, model_id=model_id)
