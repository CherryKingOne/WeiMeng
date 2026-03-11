import asyncio
from collections.abc import AsyncIterator

import pytest

from src.modules.providers.application.dto.generate_request_dto import GenerateTextRequest
from src.modules.providers.application.services.model_generation_service import ModelGenerationService
from src.modules.providers.domain.entities.provider_catalog import ProviderCatalog
from src.modules.providers.domain.entities.provider_config import ProviderConfig
from src.modules.providers.domain.exceptions import (
    ProviderConfigNotFoundException,
    ProviderModelNotSupportedException,
)
from src.modules.providers.domain.interfaces.llm_provider import ILLMProvider
from src.modules.providers.domain.repositories import IProviderConfigRepository
from src.modules.providers.domain.value_objects.model_type import ModelType
from src.modules.providers.domain.value_objects.provider_name import ProviderName
from src.modules.providers.infrastructure.factories import ModelProviderFactory


class FakeProviderConfigRepository(IProviderConfigRepository):
    def __init__(self, config: ProviderConfig | None, catalogs: list[ProviderCatalog] | None = None):
        self._config = config
        self._catalogs = catalogs or []

    def get_provider_config(self, provider: ProviderName) -> ProviderConfig | None:
        if self._config and self._config.provider == provider:
            return self._config
        return None

    def list_configured_providers(self) -> list[ProviderName]:
        if self._config:
            return [self._config.provider]
        return []

    def get_provider_catalog(
        self,
        provider: ProviderName,
        model: str | None = None,
    ) -> ProviderCatalog | None:
        for catalog in self._catalogs:
            if catalog.provider == provider:
                if model:
                    return ProviderCatalog(
                        provider=catalog.provider,
                        base_url=catalog.base_url,
                        conversation_template=catalog.conversation_template,
                        default_model=catalog.default_model,
                        models=catalog.models,
                        selected_model=model,
                        selected_model_detail={"id": model, "object": "model"},
                    )
                return catalog
        return None

    def list_provider_catalog(self) -> list[ProviderCatalog]:
        return list(self._catalogs)


class FakeLLMProvider(ILLMProvider):
    def __init__(self, api_key: str, base_url: str | None = None, conversation_template: str | None = None):
        self.api_key = api_key
        self.base_url = base_url
        self.conversation_template = conversation_template

    async def generate_text(self, prompt: str, model: str, **kwargs) -> str:
        return f"{model}:{prompt}"

    async def stream_generate_text(self, prompt: str, model: str, **kwargs) -> AsyncIterator[str]:
        yield prompt


def test_generate_llm_text_uses_default_model_when_missing_model_name():
    original_adapter = ModelProviderFactory._registry[(ProviderName.OPENAI, ModelType.LLM)]
    ModelProviderFactory.register(ProviderName.OPENAI, ModelType.LLM, FakeLLMProvider)

    service = ModelGenerationService(
        provider_config_repository=FakeProviderConfigRepository(
            ProviderConfig(
                provider=ProviderName.OPENAI,
                api_key="test-key",
                base_url="https://api.openai.com/v1",
                conversation_template="openai",
                default_model="gpt-4o-mini",
                supported_models=("gpt-4o-mini",),
            )
        )
    )

    try:
        response = asyncio.run(
            service.generate_llm_text(
                GenerateTextRequest(
                    provider=ProviderName.OPENAI,
                    prompt="hello",
                )
            )
        )
    finally:
        ModelProviderFactory.register(ProviderName.OPENAI, ModelType.LLM, original_adapter)

    assert response.provider == ProviderName.OPENAI
    assert response.model_name == "gpt-4o-mini"
    assert response.reply == "gpt-4o-mini:hello"


def test_generate_llm_text_raises_when_provider_not_configured():
    service = ModelGenerationService(provider_config_repository=FakeProviderConfigRepository(None))

    with pytest.raises(ProviderConfigNotFoundException):
        asyncio.run(
            service.generate_llm_text(
                GenerateTextRequest(
                    provider=ProviderName.OPENAI,
                    model_name="gpt-test",
                    prompt="hello",
                )
            )
        )


def test_generate_llm_text_raises_when_model_not_in_provider_supported_list():
    service = ModelGenerationService(
        provider_config_repository=FakeProviderConfigRepository(
            ProviderConfig(
                provider=ProviderName.OPENAI,
                api_key="test-key",
                base_url="https://api.openai.com/v1",
                conversation_template="openai",
                default_model="gpt-4o-mini",
                supported_models=("gpt-4o-mini",),
            )
        )
    )

    with pytest.raises(ProviderModelNotSupportedException):
        asyncio.run(
            service.generate_llm_text(
                GenerateTextRequest(
                    provider=ProviderName.OPENAI,
                    model_name="qwen-max",
                    prompt="hello",
                )
            )
        )


def test_get_provider_models_returns_catalog_and_configuration_state():
    catalog = ProviderCatalog(
        provider=ProviderName.OPENAI,
        base_url="https://api.openai.com/v1",
        conversation_template="openai",
        default_model="gpt-4o-mini",
        models=("gpt-4o-mini", "gpt-4.1-mini"),
    )
    repo = FakeProviderConfigRepository(
        config=ProviderConfig(
            provider=ProviderName.OPENAI,
            api_key="test-key",
            base_url=catalog.base_url,
            conversation_template=catalog.conversation_template,
            default_model=catalog.default_model,
            supported_models=catalog.models,
        ),
        catalogs=[catalog],
    )
    service = ModelGenerationService(provider_config_repository=repo)

    response = service.get_provider_models()

    assert len(response.providers) == 1
    assert response.providers[0].provider == ProviderName.OPENAI
    assert response.providers[0].configured is True
    assert response.providers[0].conversation_template == "openai"
    assert response.providers[0].default_model == "gpt-4o-mini"
    assert response.providers[0].models == ["gpt-4o-mini", "gpt-4.1-mini"]


def test_get_provider_models_filters_by_provider():
    openai_catalog = ProviderCatalog(
        provider=ProviderName.OPENAI,
        base_url="https://api.openai.com/v1",
        conversation_template="openai",
        default_model="gpt-4o-mini",
        models=("gpt-4o-mini",),
    )
    qwen_catalog = ProviderCatalog(
        provider=ProviderName.QWEN,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        conversation_template="qwen",
        default_model="qwen-plus",
        models=("qwen-plus", "qwen-max"),
    )
    repo = FakeProviderConfigRepository(
        config=ProviderConfig(
            provider=ProviderName.QWEN,
            api_key="qwen-key",
            base_url=qwen_catalog.base_url,
            conversation_template=qwen_catalog.conversation_template,
            default_model=qwen_catalog.default_model,
            supported_models=qwen_catalog.models,
        ),
        catalogs=[openai_catalog, qwen_catalog],
    )
    service = ModelGenerationService(provider_config_repository=repo)

    response = service.get_provider_models(provider=ProviderName.QWEN)

    assert len(response.providers) == 1
    assert response.providers[0].provider == ProviderName.QWEN
    assert response.providers[0].configured is True
    assert response.providers[0].conversation_template == "qwen"
    assert response.providers[0].models == ["qwen-plus", "qwen-max"]


def test_get_provider_models_returns_selected_model_detail():
    qwen_catalog = ProviderCatalog(
        provider=ProviderName.QWEN,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        conversation_template="qwen",
        default_model="qwen-plus",
        models=("qwen-plus", "qwen-max"),
    )
    repo = FakeProviderConfigRepository(
        config=ProviderConfig(
            provider=ProviderName.QWEN,
            api_key="qwen-key",
            base_url=qwen_catalog.base_url,
            conversation_template=qwen_catalog.conversation_template,
            default_model=qwen_catalog.default_model,
            supported_models=qwen_catalog.models,
        ),
        catalogs=[qwen_catalog],
    )
    service = ModelGenerationService(provider_config_repository=repo)

    response = service.get_provider_models(provider=ProviderName.QWEN, model="qwen-max")

    assert len(response.providers) == 1
    assert response.providers[0].provider == ProviderName.QWEN
    assert response.providers[0].selected_model == "qwen-max"
    assert response.providers[0].selected_model_detail == {
        "id": "qwen-max",
        "object": "model",
    }


def test_factory_has_all_default_provider_registrations():
    providers = set(ModelProviderFactory.list_supported_providers())
    assert providers == {
        ProviderName.OPENAI,
        ProviderName.QWEN,
        ProviderName.VOLCENGINE,
        ProviderName.GROK,
        ProviderName.GEMINI,
        ProviderName.ANTHROPIC,
        ProviderName.KIMI,
        ProviderName.GLM,
        ProviderName.MINIMAX,
        ProviderName.DEEPSEEK,
    }

    for provider in providers:
        model_types = ModelProviderFactory.list_supported_model_types(provider)
        assert ModelType.LLM in model_types
