import asyncio
from collections.abc import AsyncIterator
from datetime import datetime, timezone
import uuid

import pytest

from src.modules.providers.application.dto.chat_dto import (
    ChatRequest,
    ThinkingConfig,
    VolcengineReasoningEffort,
    VolcengineThinkingType,
)
from src.modules.providers.application.services import chat_service as chat_service_module
from src.modules.providers.application.services.chat_service import ChatService
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
from src.modules.providers.infrastructure.providers.openai_compatible import (
    OPENAI_COMPATIBLE_PROVIDER,
    OpenAICompatibleConfigPayload,
    OpenAICompatibleConfigRecord,
)
from src.shared.domain.exceptions import ValidationException


class _FakeProviderConfigRepository(IProviderConfigRepository):
    def __init__(self, provider_config: ProviderConfig | None):
        self._provider_config = provider_config

    def get_provider_config(self, provider: ProviderName) -> ProviderConfig | None:
        if self._provider_config and self._provider_config.provider == provider:
            return self._provider_config
        return None

    def list_configured_providers(self) -> list[ProviderName]:
        if self._provider_config is None:
            return []
        return [self._provider_config.provider]

    def get_provider_catalog(
        self,
        provider: ProviderName,
        model: str | None = None,
    ) -> ProviderCatalog | None:
        _ = model
        if self._provider_config is None or self._provider_config.provider != provider:
            return None
        return ProviderCatalog(
            provider=provider,
            base_url=self._provider_config.base_url,
            conversation_template=self._provider_config.conversation_template,
            default_model=self._provider_config.default_model,
            models=self._provider_config.supported_models,
        )

    def list_provider_catalog(self) -> list[ProviderCatalog]:
        if self._provider_config is None:
            return []
        return [
            ProviderCatalog(
                provider=self._provider_config.provider,
                base_url=self._provider_config.base_url,
                conversation_template=self._provider_config.conversation_template,
                default_model=self._provider_config.default_model,
                models=self._provider_config.supported_models,
            )
        ]


class _FakeSystemModelConfigEntity:
    def __init__(self, provider: str, model_name: str):
        self.provider = provider
        self.model_name = model_name


class _FakeSystemModelConfigRepository:
    def __init__(self, model: _FakeSystemModelConfigEntity | None = None):
        self._model = model
        self.last_user_id: str | None = None

    async def get_by_user_id_and_type(self, user_id: str, model_type):
        self.last_user_id = user_id
        _ = model_type
        return self._model


class _FakeOpenAICompatiblePersistenceRepository:
    def __init__(self, records: list[OpenAICompatibleConfigRecord]):
        self._records = records

    async def list_openai_compatible_configs(self, user_id: str) -> list[OpenAICompatibleConfigRecord]:
        _ = user_id
        return self._records

    async def get_openai_compatible_config_by_model(
        self,
        user_id: str,
        model: str,
    ) -> OpenAICompatibleConfigRecord | None:
        _ = user_id
        normalized = model.strip().lower()
        for record in self._records:
            if record.payload.model.strip().lower() == normalized:
                return record
        return None


class _FakeLLMProvider(ILLMProvider):
    last_generate_kwargs: dict | None = None
    last_stream_kwargs: dict | None = None

    def __init__(self, api_key: str, base_url: str | None = None, conversation_template: str | None = None):
        self.api_key = api_key
        self.base_url = base_url
        self.conversation_template = conversation_template

    async def generate_text(self, prompt: str, model: str, **kwargs) -> str:
        self.__class__.last_generate_kwargs = dict(kwargs)
        return f"{model}:{prompt}"

    async def stream_generate_text(self, prompt: str, model: str, **kwargs) -> AsyncIterator[str]:
        _ = model
        self.__class__.last_stream_kwargs = dict(kwargs)
        yield prompt


class _FakeOpenAICompatibleLLMProvider(_FakeLLMProvider):
    DEFAULT_CONVERSATION_TEMPLATE = "openai"


class _FakeOpenAICompatibleRetryLLMProvider(ILLMProvider):
    DEFAULT_CONVERSATION_TEMPLATE = "openai"
    last_generate_kwargs: dict | None = None

    def __init__(self, api_key: str, base_url: str | None = None, conversation_template: str | None = None):
        _ = api_key
        _ = base_url
        _ = conversation_template

    async def generate_text(self, prompt: str, model: str, **kwargs) -> str:
        self.__class__.last_generate_kwargs = dict(kwargs)
        max_tokens = kwargs.get("max_tokens")
        if isinstance(max_tokens, int) and max_tokens > 8192:
            raise Exception(
                "Error code: 400 - {'error': {'message': 'Invalid max_tokens value, "
                "the valid range of max_tokens is [1, 8192]'}}"
            )
        return f"{model}:{prompt}"

    async def stream_generate_text(self, prompt: str, model: str, **kwargs) -> AsyncIterator[str]:
        _ = model
        self.__class__.last_generate_kwargs = dict(kwargs)
        max_tokens = kwargs.get("max_tokens")
        if isinstance(max_tokens, int) and max_tokens > 8192:
            raise Exception(
                "Error code: 400 - {'error': {'message': 'Invalid max_tokens value, "
                "the valid range of max_tokens is [1, 8192]'}}"
            )
        yield prompt


class _FakeThinkingLLMProvider(ILLMProvider):
    def __init__(self, api_key: str, base_url: str | None = None, conversation_template: str | None = None):
        _ = api_key
        _ = base_url
        _ = conversation_template

    async def generate_text(self, prompt: str, model: str, **kwargs) -> str:
        _ = prompt
        _ = model
        _ = kwargs
        return "<think>思考过程A</think><answer>最终答案B</answer>"

    async def stream_generate_text(self, prompt: str, model: str, **kwargs) -> AsyncIterator[str]:
        _ = prompt
        _ = model
        _ = kwargs
        yield "<think>"
        yield "思考过程A"
        yield "</think>"
        yield "<answer>"
        yield "最终答案B"
        yield "</answer>"


class _FakeThinkingNoThinkProvider(ILLMProvider):
    def __init__(self, api_key: str, base_url: str | None = None, conversation_template: str | None = None):
        _ = api_key
        _ = base_url
        _ = conversation_template

    async def generate_text(self, prompt: str, model: str, **kwargs) -> str:
        _ = prompt
        _ = model
        _ = kwargs
        return "<answer>只有答案</answer>"

    async def stream_generate_text(self, prompt: str, model: str, **kwargs) -> AsyncIterator[str]:
        _ = prompt
        _ = model
        _ = kwargs
        yield "<answer>只有答案</answer>"


def _build_provider_config() -> ProviderConfig:
    return ProviderConfig(
        provider=ProviderName.QWEN,
        api_key="qwen-test-key",
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        conversation_template="qwen",
        default_model="qwen3.5-plus",
        supported_models=("qwen3.5-plus", "qwen-max"),
    )


def _build_openai_provider_config() -> ProviderConfig:
    return ProviderConfig(
        provider=ProviderName.OPENAI,
        api_key="openai-test-key",
        base_url="https://api.openai.com/v1",
        conversation_template="openai",
        default_model="gpt-4o-mini",
        supported_models=("gpt-4o-mini",),
    )


def _build_volcengine_provider_config() -> ProviderConfig:
    return ProviderConfig(
        provider=ProviderName.VOLCENGINE,
        api_key="volcengine-test-key",
        base_url="https://ark.cn-beijing.volces.com/api/v3",
        conversation_template="volcengine",
        default_model="doubao-seed-2-0-pro-260215",
        supported_models=("doubao-seed-2-0-pro-260215",),
    )


def _build_deepseek_provider_config() -> ProviderConfig:
    return ProviderConfig(
        provider=ProviderName.DEEPSEEK,
        api_key="deepseek-test-key",
        base_url="https://api.deepseek.com/v1",
        conversation_template="deepseek",
        default_model="deepseek-chat",
        supported_models=("deepseek-chat", "deepseek-reasoner"),
    )


def test_chat_with_provider_and_model_name_success():
    original_adapter = ModelProviderFactory._registry[(ProviderName.QWEN, ModelType.LLM)]
    ModelProviderFactory.register(ProviderName.QWEN, ModelType.LLM, _FakeLLMProvider)
    try:
        service = ChatService(
            user_id="00000000-0000-0000-0000-000000000021",
            provider_config_repository=_FakeProviderConfigRepository(_build_provider_config()),
            system_model_config_repository=_FakeSystemModelConfigRepository(),
        )

        response = asyncio.run(
            service.chat(
                ChatRequest(
                    provider=ProviderName.QWEN,
                    model_name="qwen3.5-plus",
                    message="你好",
                )
            )
        )
    finally:
        ModelProviderFactory.register(ProviderName.QWEN, ModelType.LLM, original_adapter)

    assert response.provider == ProviderName.QWEN
    assert response.model_name == "qwen3.5-plus"
    assert response.think is None
    assert response.answer == "qwen3.5-plus:你好"


def test_chat_uses_system_model_when_provider_and_model_missing():
    original_adapter = ModelProviderFactory._registry[(ProviderName.QWEN, ModelType.LLM)]
    ModelProviderFactory.register(ProviderName.QWEN, ModelType.LLM, _FakeLLMProvider)
    try:
        service = ChatService(
            user_id="00000000-0000-0000-0000-000000000022",
            provider_config_repository=_FakeProviderConfigRepository(_build_provider_config()),
            system_model_config_repository=_FakeSystemModelConfigRepository(
                _FakeSystemModelConfigEntity(
                    provider=ProviderName.QWEN.value,
                    model_name="qwen3.5-plus",
                )
            ),
        )

        response = asyncio.run(
            service.chat(
                ChatRequest(
                    message="测试系统模型",
                )
            )
        )
    finally:
        ModelProviderFactory.register(ProviderName.QWEN, ModelType.LLM, original_adapter)

    assert response.provider == ProviderName.QWEN
    assert response.model_name == "qwen3.5-plus"
    assert response.think is None
    assert response.answer == "qwen3.5-plus:测试系统模型"


def test_chat_uses_openai_compatible_system_model(monkeypatch):
    now = datetime.now(timezone.utc)
    persistence_repository = _FakeOpenAICompatiblePersistenceRepository(
        records=[
            OpenAICompatibleConfigRecord(
                id=uuid.uuid4(),
                provider_key=f"{OPENAI_COMPATIBLE_PROVIDER}:deepseek-chat",
                payload=OpenAICompatibleConfigPayload(
                    provider=OPENAI_COMPATIBLE_PROVIDER,
                    base_url="https://third-party.example.com/v1",
                    api_key="third-party-key",
                    model="deepseek-chat",
                    max_token=128000,
                    temperature=0.7,
                ),
                created_at=now,
                updated_at=now,
            )
        ]
    )
    _FakeOpenAICompatibleLLMProvider.last_generate_kwargs = None
    monkeypatch.setattr(
        chat_service_module,
        "OpenAILLMAdapter",
        _FakeOpenAICompatibleLLMProvider,
    )
    service = ChatService(
        user_id="00000000-0000-0000-0000-000000000045",
        provider_config_repository=_FakeProviderConfigRepository(None),
        provider_persistence_repository=persistence_repository,
        system_model_config_repository=_FakeSystemModelConfigRepository(
            _FakeSystemModelConfigEntity(
                provider=ProviderName.OPENAI_COMPATIBLE.value,
                model_name="deepseek-chat",
            )
        ),
    )

    response = asyncio.run(service.chat(ChatRequest(message="openai-compatible 测试")))

    assert response.provider == ProviderName.OPENAI_COMPATIBLE
    assert response.model_name == "deepseek-chat"
    assert response.answer == "deepseek-chat:openai-compatible 测试"
    assert _FakeOpenAICompatibleLLMProvider.last_generate_kwargs is not None
    assert _FakeOpenAICompatibleLLMProvider.last_generate_kwargs.get("temperature") == 0.7
    assert _FakeOpenAICompatibleLLMProvider.last_generate_kwargs.get("max_tokens") == 128000


def test_chat_openai_compatible_retries_with_provider_max_tokens_limit(monkeypatch):
    now = datetime.now(timezone.utc)
    persistence_repository = _FakeOpenAICompatiblePersistenceRepository(
        records=[
            OpenAICompatibleConfigRecord(
                id=uuid.uuid4(),
                provider_key=f"{OPENAI_COMPATIBLE_PROVIDER}:deepseek-chat",
                payload=OpenAICompatibleConfigPayload(
                    provider=OPENAI_COMPATIBLE_PROVIDER,
                    base_url="https://third-party.example.com/v1",
                    api_key="third-party-key",
                    model="deepseek-chat",
                    max_token=128000,
                    temperature=0.7,
                ),
                created_at=now,
                updated_at=now,
            )
        ]
    )
    _FakeOpenAICompatibleRetryLLMProvider.last_generate_kwargs = None
    monkeypatch.setattr(
        chat_service_module,
        "OpenAILLMAdapter",
        _FakeOpenAICompatibleRetryLLMProvider,
    )
    service = ChatService(
        user_id="00000000-0000-0000-0000-000000000046",
        provider_config_repository=_FakeProviderConfigRepository(None),
        provider_persistence_repository=persistence_repository,
        system_model_config_repository=_FakeSystemModelConfigRepository(
            _FakeSystemModelConfigEntity(
                provider=ProviderName.OPENAI_COMPATIBLE.value,
                model_name="deepseek-chat",
            )
        ),
    )

    response = asyncio.run(service.chat(ChatRequest(message="重试测试")))

    assert response.provider == ProviderName.OPENAI_COMPATIBLE
    assert response.model_name == "deepseek-chat"
    assert response.answer == "deepseek-chat:重试测试"
    assert _FakeOpenAICompatibleRetryLLMProvider.last_generate_kwargs is not None
    assert _FakeOpenAICompatibleRetryLLMProvider.last_generate_kwargs.get("max_tokens") == 8192


def test_chat_raises_when_system_model_not_configured():
    service = ChatService(
        user_id="00000000-0000-0000-0000-000000000023",
        provider_config_repository=_FakeProviderConfigRepository(_build_provider_config()),
        system_model_config_repository=_FakeSystemModelConfigRepository(),
    )

    with pytest.raises(ValidationException):
        asyncio.run(service.chat(ChatRequest(message="测试")))


def test_chat_raises_when_provider_not_configured():
    service = ChatService(
        user_id="00000000-0000-0000-0000-000000000024",
        provider_config_repository=_FakeProviderConfigRepository(None),
        system_model_config_repository=_FakeSystemModelConfigRepository(),
    )

    with pytest.raises(ProviderConfigNotFoundException):
        asyncio.run(
            service.chat(
                ChatRequest(
                    provider=ProviderName.QWEN,
                    model_name="qwen3.5-plus",
                    message="你好",
                )
            )
        )


def test_chat_raises_when_model_not_supported():
    service = ChatService(
        user_id="00000000-0000-0000-0000-000000000025",
        provider_config_repository=_FakeProviderConfigRepository(_build_provider_config()),
        system_model_config_repository=_FakeSystemModelConfigRepository(),
    )

    with pytest.raises(ProviderModelNotSupportedException):
        asyncio.run(
            service.chat(
                ChatRequest(
                    provider=ProviderName.QWEN,
                    model_name="qwen-unknown",
                    message="你好",
                )
            )
        )


def test_stream_chat_returns_provider_model_and_chunks():
    original_adapter = ModelProviderFactory._registry[(ProviderName.QWEN, ModelType.LLM)]
    ModelProviderFactory.register(ProviderName.QWEN, ModelType.LLM, _FakeLLMProvider)
    try:
        service = ChatService(
            user_id="00000000-0000-0000-0000-000000000026",
            provider_config_repository=_FakeProviderConfigRepository(_build_provider_config()),
            system_model_config_repository=_FakeSystemModelConfigRepository(),
        )

        async def _collect():
            provider, model_name, stream = await service.stream_chat(
                ChatRequest(
                    provider=ProviderName.QWEN,
                    model_name="qwen3.5-plus",
                    message="流式你好",
                    stream=True,
                )
            )
            chunks = [chunk async for chunk in stream]
            return provider, model_name, chunks

        provider, model_name, chunks = asyncio.run(_collect())
    finally:
        ModelProviderFactory.register(ProviderName.QWEN, ModelType.LLM, original_adapter)

    assert provider == ProviderName.QWEN
    assert model_name == "qwen3.5-plus"
    assert chunks == ["流式你好"]


def test_chat_passes_enable_thinking_for_qwen():
    original_adapter = ModelProviderFactory._registry[(ProviderName.QWEN, ModelType.LLM)]
    ModelProviderFactory.register(ProviderName.QWEN, ModelType.LLM, _FakeLLMProvider)
    _FakeLLMProvider.last_generate_kwargs = None
    try:
        service = ChatService(
            user_id="00000000-0000-0000-0000-000000000027",
            provider_config_repository=_FakeProviderConfigRepository(_build_provider_config()),
            system_model_config_repository=_FakeSystemModelConfigRepository(),
        )

        _ = asyncio.run(
            service.chat(
                ChatRequest(
                    provider=ProviderName.QWEN,
                    model_name="qwen3.5-plus",
                    message="启用思考",
                    enable_thinking=True,
                )
            )
        )
    finally:
        ModelProviderFactory.register(ProviderName.QWEN, ModelType.LLM, original_adapter)

    assert _FakeLLMProvider.last_generate_kwargs is not None
    assert _FakeLLMProvider.last_generate_kwargs.get("enable_thinking") is True


def test_chat_raises_when_enable_thinking_used_for_non_qwen():
    original_adapter = ModelProviderFactory._registry[(ProviderName.OPENAI, ModelType.LLM)]
    ModelProviderFactory.register(ProviderName.OPENAI, ModelType.LLM, _FakeLLMProvider)
    try:
        service = ChatService(
            user_id="00000000-0000-0000-0000-000000000028",
            provider_config_repository=_FakeProviderConfigRepository(_build_openai_provider_config()),
            system_model_config_repository=_FakeSystemModelConfigRepository(),
        )

        with pytest.raises(ValidationException):
            asyncio.run(
                service.chat(
                    ChatRequest(
                        provider=ProviderName.OPENAI,
                        model_name="gpt-4o-mini",
                        message="测试",
                        enable_thinking=True,
                    )
                )
            )
    finally:
        ModelProviderFactory.register(ProviderName.OPENAI, ModelType.LLM, original_adapter)


def test_chat_passes_thinking_budget_for_qwen():
    original_adapter = ModelProviderFactory._registry[(ProviderName.QWEN, ModelType.LLM)]
    ModelProviderFactory.register(ProviderName.QWEN, ModelType.LLM, _FakeLLMProvider)
    _FakeLLMProvider.last_generate_kwargs = None
    try:
        service = ChatService(
            user_id="00000000-0000-0000-0000-000000000029",
            provider_config_repository=_FakeProviderConfigRepository(_build_provider_config()),
            system_model_config_repository=_FakeSystemModelConfigRepository(),
        )

        _ = asyncio.run(
            service.chat(
                ChatRequest(
                    provider=ProviderName.QWEN,
                    model_name="qwen3.5-plus",
                    message="预算测试",
                    thinking_budget=50,
                )
            )
        )
    finally:
        ModelProviderFactory.register(ProviderName.QWEN, ModelType.LLM, original_adapter)

    assert _FakeLLMProvider.last_generate_kwargs is not None
    assert _FakeLLMProvider.last_generate_kwargs.get("thinking_budget") == 50
    assert _FakeLLMProvider.last_generate_kwargs.get("enable_thinking") is True


def test_chat_returns_think_and_answer_when_qwen_thinking_enabled():
    original_adapter = ModelProviderFactory._registry[(ProviderName.QWEN, ModelType.LLM)]
    ModelProviderFactory.register(ProviderName.QWEN, ModelType.LLM, _FakeThinkingLLMProvider)
    try:
        service = ChatService(
            user_id="00000000-0000-0000-0000-000000000030",
            provider_config_repository=_FakeProviderConfigRepository(_build_provider_config()),
            system_model_config_repository=_FakeSystemModelConfigRepository(),
        )

        response = asyncio.run(
            service.chat(
                ChatRequest(
                    provider=ProviderName.QWEN,
                    model_name="qwen3.5-plus",
                    message="你好",
                    enable_thinking=True,
                )
            )
        )
    finally:
        ModelProviderFactory.register(ProviderName.QWEN, ModelType.LLM, original_adapter)

    assert response.think == "思考过程A"
    assert response.answer == "最终答案B"


def test_chat_keeps_think_field_when_thinking_enabled_but_no_think_content():
    original_adapter = ModelProviderFactory._registry[(ProviderName.QWEN, ModelType.LLM)]
    ModelProviderFactory.register(ProviderName.QWEN, ModelType.LLM, _FakeThinkingNoThinkProvider)
    try:
        service = ChatService(
            user_id="00000000-0000-0000-0000-000000000031",
            provider_config_repository=_FakeProviderConfigRepository(_build_provider_config()),
            system_model_config_repository=_FakeSystemModelConfigRepository(),
        )

        response = asyncio.run(
            service.chat(
                ChatRequest(
                    provider=ProviderName.QWEN,
                    model_name="qwen3.5-plus",
                    message="你好",
                    enable_thinking=True,
                )
            )
        )
    finally:
        ModelProviderFactory.register(ProviderName.QWEN, ModelType.LLM, original_adapter)

    assert response.think == ""
    assert response.answer == "只有答案"


def test_chat_returns_think_and_answer_when_volcengine_thinking_enabled():
    original_adapter = ModelProviderFactory._registry[(ProviderName.VOLCENGINE, ModelType.LLM)]
    ModelProviderFactory.register(ProviderName.VOLCENGINE, ModelType.LLM, _FakeThinkingLLMProvider)
    try:
        service = ChatService(
            user_id="00000000-0000-0000-0000-000000000032",
            provider_config_repository=_FakeProviderConfigRepository(_build_volcengine_provider_config()),
            system_model_config_repository=_FakeSystemModelConfigRepository(),
        )

        response = asyncio.run(
            service.chat(
                ChatRequest(
                    provider=ProviderName.VOLCENGINE,
                    model_name="doubao-seed-2-0-pro-260215",
                    message="你好",
                    thinking=ThinkingConfig(
                        type=VolcengineThinkingType.ENABLED,
                        reasoning_effort=VolcengineReasoningEffort.MEDIUM,
                    ),
                )
            )
        )
    finally:
        ModelProviderFactory.register(ProviderName.VOLCENGINE, ModelType.LLM, original_adapter)

    assert response.think == "思考过程A"
    assert response.answer == "最终答案B"


def test_chat_hides_think_when_volcengine_thinking_disabled():
    original_adapter = ModelProviderFactory._registry[(ProviderName.VOLCENGINE, ModelType.LLM)]
    ModelProviderFactory.register(ProviderName.VOLCENGINE, ModelType.LLM, _FakeLLMProvider)
    try:
        service = ChatService(
            user_id="00000000-0000-0000-0000-000000000033",
            provider_config_repository=_FakeProviderConfigRepository(_build_volcengine_provider_config()),
            system_model_config_repository=_FakeSystemModelConfigRepository(),
        )

        response = asyncio.run(
            service.chat(
                ChatRequest(
                    provider=ProviderName.VOLCENGINE,
                    model_name="doubao-seed-2-0-pro-260215",
                    message="你好",
                    thinking=ThinkingConfig(
                        type=VolcengineThinkingType.DISABLED,
                        reasoning_effort=VolcengineReasoningEffort.MINIMAL,
                    ),
                )
            )
        )
    finally:
        ModelProviderFactory.register(ProviderName.VOLCENGINE, ModelType.LLM, original_adapter)

    assert response.think is None
    assert response.answer == "doubao-seed-2-0-pro-260215:你好"


def test_chat_allows_volcengine_thinking_disabled_without_effort_field():
    original_adapter = ModelProviderFactory._registry[(ProviderName.VOLCENGINE, ModelType.LLM)]
    ModelProviderFactory.register(ProviderName.VOLCENGINE, ModelType.LLM, _FakeLLMProvider)
    _FakeLLMProvider.last_generate_kwargs = None
    try:
        service = ChatService(
            user_id="00000000-0000-0000-0000-000000000036",
            provider_config_repository=_FakeProviderConfigRepository(_build_volcengine_provider_config()),
            system_model_config_repository=_FakeSystemModelConfigRepository(),
        )

        response = asyncio.run(
            service.chat(
                ChatRequest(
                    provider=ProviderName.VOLCENGINE,
                    model_name="doubao-seed-2-0-pro-260215",
                    message="你好",
                    thinking=ThinkingConfig(type=VolcengineThinkingType.DISABLED),
                )
            )
        )
    finally:
        ModelProviderFactory.register(ProviderName.VOLCENGINE, ModelType.LLM, original_adapter)

    assert _FakeLLMProvider.last_generate_kwargs is not None
    assert _FakeLLMProvider.last_generate_kwargs.get("thinking_type") == "disabled"
    assert _FakeLLMProvider.last_generate_kwargs.get("reasoning_effort") == "minimal"
    assert response.think is None
    assert response.answer == "doubao-seed-2-0-pro-260215:你好"


def test_chat_defaults_volcengine_thinking_to_enabled_when_missing_field():
    original_adapter = ModelProviderFactory._registry[(ProviderName.VOLCENGINE, ModelType.LLM)]
    ModelProviderFactory.register(ProviderName.VOLCENGINE, ModelType.LLM, _FakeLLMProvider)
    _FakeLLMProvider.last_generate_kwargs = None
    try:
        service = ChatService(
            user_id="00000000-0000-0000-0000-000000000035",
            provider_config_repository=_FakeProviderConfigRepository(_build_volcengine_provider_config()),
            system_model_config_repository=_FakeSystemModelConfigRepository(),
        )

        response = asyncio.run(
            service.chat(
                ChatRequest(
                    provider=ProviderName.VOLCENGINE,
                    model_name="doubao-seed-2-0-pro-260215",
                    message="默认测试",
                )
            )
        )
    finally:
        ModelProviderFactory.register(ProviderName.VOLCENGINE, ModelType.LLM, original_adapter)

    assert _FakeLLMProvider.last_generate_kwargs is not None
    assert _FakeLLMProvider.last_generate_kwargs.get("thinking_type") == "enabled"
    assert _FakeLLMProvider.last_generate_kwargs.get("reasoning_effort") == "minimal"
    assert response.think is None
    assert response.answer == "doubao-seed-2-0-pro-260215:默认测试"


def test_chat_raises_when_volcengine_thinking_used_for_non_volcengine():
    original_adapter = ModelProviderFactory._registry[(ProviderName.QWEN, ModelType.LLM)]
    ModelProviderFactory.register(ProviderName.QWEN, ModelType.LLM, _FakeLLMProvider)
    try:
        service = ChatService(
            user_id="00000000-0000-0000-0000-000000000034",
            provider_config_repository=_FakeProviderConfigRepository(_build_provider_config()),
            system_model_config_repository=_FakeSystemModelConfigRepository(),
        )
        with pytest.raises(ValidationException):
            asyncio.run(
                service.chat(
                    ChatRequest(
                        provider=ProviderName.QWEN,
                        model_name="qwen3.5-plus",
                        message="你好",
                        thinking=ThinkingConfig(type=VolcengineThinkingType.ENABLED),
                    )
                )
            )
    finally:
        ModelProviderFactory.register(ProviderName.QWEN, ModelType.LLM, original_adapter)


def test_chat_returns_think_and_answer_when_deepseek_reasoner_model():
    original_adapter = ModelProviderFactory._registry[(ProviderName.DEEPSEEK, ModelType.LLM)]
    ModelProviderFactory.register(ProviderName.DEEPSEEK, ModelType.LLM, _FakeThinkingLLMProvider)
    try:
        service = ChatService(
            user_id="00000000-0000-0000-0000-000000000040",
            provider_config_repository=_FakeProviderConfigRepository(_build_deepseek_provider_config()),
            system_model_config_repository=_FakeSystemModelConfigRepository(),
        )

        response = asyncio.run(
            service.chat(
                ChatRequest(
                    provider=ProviderName.DEEPSEEK,
                    model_name="deepseek-reasoner",
                    message="你好",
                )
            )
        )
    finally:
        ModelProviderFactory.register(ProviderName.DEEPSEEK, ModelType.LLM, original_adapter)

    assert response.think == "思考过程A"
    assert response.answer == "最终答案B"


def test_chat_passes_deepseek_thinking_enabled():
    original_adapter = ModelProviderFactory._registry[(ProviderName.DEEPSEEK, ModelType.LLM)]
    ModelProviderFactory.register(ProviderName.DEEPSEEK, ModelType.LLM, _FakeLLMProvider)
    _FakeLLMProvider.last_generate_kwargs = None
    try:
        service = ChatService(
            user_id="00000000-0000-0000-0000-000000000041",
            provider_config_repository=_FakeProviderConfigRepository(_build_deepseek_provider_config()),
            system_model_config_repository=_FakeSystemModelConfigRepository(),
        )

        _ = asyncio.run(
            service.chat(
                ChatRequest(
                    provider=ProviderName.DEEPSEEK,
                    model_name="deepseek-chat",
                    message="你好",
                    thinking=ThinkingConfig(type=VolcengineThinkingType.ENABLED),
                )
            )
        )
    finally:
        ModelProviderFactory.register(ProviderName.DEEPSEEK, ModelType.LLM, original_adapter)

    assert _FakeLLMProvider.last_generate_kwargs is not None
    assert _FakeLLMProvider.last_generate_kwargs.get("deepseek_thinking_type") == "enabled"


def test_chat_passes_deepseek_thinking_disabled_without_reasoning_effort():
    original_adapter = ModelProviderFactory._registry[(ProviderName.DEEPSEEK, ModelType.LLM)]
    ModelProviderFactory.register(ProviderName.DEEPSEEK, ModelType.LLM, _FakeLLMProvider)
    _FakeLLMProvider.last_generate_kwargs = None
    try:
        service = ChatService(
            user_id="00000000-0000-0000-0000-000000000044",
            provider_config_repository=_FakeProviderConfigRepository(_build_deepseek_provider_config()),
            system_model_config_repository=_FakeSystemModelConfigRepository(),
        )

        _ = asyncio.run(
            service.chat(
                ChatRequest(
                    provider=ProviderName.DEEPSEEK,
                    model_name="deepseek-chat",
                    message="你好",
                    thinking=ThinkingConfig(type=VolcengineThinkingType.DISABLED),
                )
            )
        )
    finally:
        ModelProviderFactory.register(ProviderName.DEEPSEEK, ModelType.LLM, original_adapter)

    assert _FakeLLMProvider.last_generate_kwargs is not None
    assert _FakeLLMProvider.last_generate_kwargs.get("deepseek_thinking_type") == "disabled"
    assert _FakeLLMProvider.last_generate_kwargs.get("reasoning_effort") is None


def test_chat_raises_when_deepseek_thinking_auto_used():
    original_adapter = ModelProviderFactory._registry[(ProviderName.DEEPSEEK, ModelType.LLM)]
    ModelProviderFactory.register(ProviderName.DEEPSEEK, ModelType.LLM, _FakeLLMProvider)
    try:
        service = ChatService(
            user_id="00000000-0000-0000-0000-000000000042",
            provider_config_repository=_FakeProviderConfigRepository(_build_deepseek_provider_config()),
            system_model_config_repository=_FakeSystemModelConfigRepository(),
        )

        with pytest.raises(ValidationException):
            asyncio.run(
                service.chat(
                    ChatRequest(
                        provider=ProviderName.DEEPSEEK,
                        model_name="deepseek-chat",
                        message="你好",
                        thinking=ThinkingConfig(type=VolcengineThinkingType.AUTO),
                    )
                )
            )
    finally:
        ModelProviderFactory.register(ProviderName.DEEPSEEK, ModelType.LLM, original_adapter)


def test_chat_raises_when_deepseek_thinking_with_reasoning_effort():
    original_adapter = ModelProviderFactory._registry[(ProviderName.DEEPSEEK, ModelType.LLM)]
    ModelProviderFactory.register(ProviderName.DEEPSEEK, ModelType.LLM, _FakeLLMProvider)
    try:
        service = ChatService(
            user_id="00000000-0000-0000-0000-000000000043",
            provider_config_repository=_FakeProviderConfigRepository(_build_deepseek_provider_config()),
            system_model_config_repository=_FakeSystemModelConfigRepository(),
        )

        with pytest.raises(ValidationException):
            asyncio.run(
                service.chat(
                    ChatRequest(
                        provider=ProviderName.DEEPSEEK,
                        model_name="deepseek-chat",
                        message="你好",
                        thinking=ThinkingConfig(
                            type=VolcengineThinkingType.ENABLED,
                            reasoning_effort=VolcengineReasoningEffort.LOW,
                        ),
                    )
                )
            )
    finally:
        ModelProviderFactory.register(ProviderName.DEEPSEEK, ModelType.LLM, original_adapter)
