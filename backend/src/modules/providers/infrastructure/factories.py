from typing import Any

from src.modules.providers.domain.exceptions import ProviderCapabilityNotSupportedException
from src.modules.providers.domain.value_objects.model_type import ModelType
from src.modules.providers.domain.value_objects.provider_name import ProviderName
from src.modules.providers.infrastructure.providers.anthropic.llm_adapter import AnthropicLLMAdapter
from src.modules.providers.infrastructure.providers.deepseek.llm_adapter import DeepSeekLLMAdapter
from src.modules.providers.infrastructure.providers.gemini.llm_adapter import GeminiLLMAdapter
from src.modules.providers.infrastructure.providers.glm.llm_adapter import GLMLLMAdapter
from src.modules.providers.infrastructure.providers.grok.llm_adapter import GrokLLMAdapter
from src.modules.providers.infrastructure.providers.kimi.llm_adapter import KimiLLMAdapter
from src.modules.providers.infrastructure.providers.minimax.llm_adapter import MiniMaxLLMAdapter
from src.modules.providers.infrastructure.providers.openai.llm_adapter import OpenAILLMAdapter
from src.modules.providers.infrastructure.providers.qwen.llm_adapter import QwenLLMAdapter
from src.modules.providers.infrastructure.providers.volcengine.llm_adapter import VolcengineLLMAdapter


class ModelProviderFactory:
    _registry: dict[tuple[ProviderName, ModelType], type[Any]] = {}

    @classmethod
    def register(
        cls,
        provider: ProviderName,
        model_type: ModelType,
        adapter_class: type[Any],
    ) -> None:
        cls._registry[(provider, model_type)] = adapter_class

    @classmethod
    def create(
        cls,
        provider: ProviderName,
        model_type: ModelType,
        **config,
    ) -> Any:
        adapter_class = cls._registry.get((provider, model_type))
        if adapter_class is None:
            raise ProviderCapabilityNotSupportedException(
                provider=provider.value,
                model_type=model_type.value,
            )
        return adapter_class(**config)

    @classmethod
    def list_supported_providers(cls) -> list[ProviderName]:
        providers = {provider for provider, _ in cls._registry.keys()}
        return sorted(providers, key=lambda item: item.value)

    @classmethod
    def list_supported_model_types(cls, provider: ProviderName | None = None) -> list[ModelType]:
        if provider is None:
            model_types = {model_type for _, model_type in cls._registry.keys()}
        else:
            model_types = {
                model_type
                for registered_provider, model_type in cls._registry.keys()
                if registered_provider == provider
            }
        return sorted(model_types, key=lambda item: item.value)


ModelProviderFactory.register(ProviderName.OPENAI, ModelType.LLM, OpenAILLMAdapter)
ModelProviderFactory.register(ProviderName.QWEN, ModelType.LLM, QwenLLMAdapter)
ModelProviderFactory.register(ProviderName.VOLCENGINE, ModelType.LLM, VolcengineLLMAdapter)
ModelProviderFactory.register(ProviderName.GROK, ModelType.LLM, GrokLLMAdapter)
ModelProviderFactory.register(ProviderName.GEMINI, ModelType.LLM, GeminiLLMAdapter)
ModelProviderFactory.register(ProviderName.ANTHROPIC, ModelType.LLM, AnthropicLLMAdapter)
ModelProviderFactory.register(ProviderName.KIMI, ModelType.LLM, KimiLLMAdapter)
ModelProviderFactory.register(ProviderName.GLM, ModelType.LLM, GLMLLMAdapter)
ModelProviderFactory.register(ProviderName.MINIMAX, ModelType.LLM, MiniMaxLLMAdapter)
ModelProviderFactory.register(ProviderName.DEEPSEEK, ModelType.LLM, DeepSeekLLMAdapter)
