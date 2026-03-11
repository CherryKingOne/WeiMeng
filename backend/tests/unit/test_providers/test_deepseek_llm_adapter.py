import asyncio
from types import SimpleNamespace

from src.modules.providers.infrastructure.providers.deepseek.llm_adapter import DeepSeekLLMAdapter


def test_build_thinking_extra_body_enabled():
    result = DeepSeekLLMAdapter.build_thinking_extra_body(
        thinking_type="enabled",
        extra_body={"foo": "bar"},
    )
    assert result == {"foo": "bar", "thinking": {"type": "enabled"}}


def test_build_thinking_extra_body_none_returns_none():
    result = DeepSeekLLMAdapter.build_thinking_extra_body(
        thinking_type=None,
        extra_body=None,
    )
    assert result is None


def test_generate_text_wraps_reasoning_when_thinking_enabled():
    async def fake_create(*, model: str, messages: list[dict[str, str]], **kwargs):
        _ = model
        _ = messages
        _ = kwargs
        return SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(
                        content="最终答案",
                        reasoning_content="思考过程",
                    )
                )
            ]
        )

    adapter = DeepSeekLLMAdapter(api_key="deepseek-test-key")
    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    result = asyncio.run(
        adapter.generate_text(
            prompt="你好",
            model="deepseek-chat",
            deepseek_thinking_type="enabled",
        )
    )

    assert result == "<think>思考过程</think><answer>最终答案</answer>"


def test_generate_text_wraps_reasoning_for_reasoner_by_default():
    async def fake_create(*, model: str, messages: list[dict[str, str]], **kwargs):
        _ = model
        _ = messages
        _ = kwargs
        return SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(
                        content="最终答案",
                        reasoning_content="思考过程",
                    )
                )
            ]
        )

    adapter = DeepSeekLLMAdapter(api_key="deepseek-test-key")
    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    result = asyncio.run(
        adapter.generate_text(
            prompt="你好",
            model="deepseek-reasoner",
        )
    )

    assert result == "<think>思考过程</think><answer>最终答案</answer>"


def test_generate_text_hides_reasoning_when_thinking_disabled():
    async def fake_create(*, model: str, messages: list[dict[str, str]], **kwargs):
        _ = model
        _ = messages
        _ = kwargs
        return SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(
                        content="最终答案",
                        reasoning_content="思考过程",
                    )
                )
            ]
        )

    adapter = DeepSeekLLMAdapter(api_key="deepseek-test-key")
    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    result = asyncio.run(
        adapter.generate_text(
            prompt="你好",
            model="deepseek-reasoner",
            deepseek_thinking_type="disabled",
        )
    )

    assert result == "最终答案"


def test_stream_generate_text_emits_think_and_answer():
    class _FakeStream:
        def __init__(self, items):
            self._items = list(items)
            self._index = 0

        def __aiter__(self):
            return self

        async def __anext__(self):
            if self._index >= len(self._items):
                raise StopAsyncIteration
            item = self._items[self._index]
            self._index += 1
            return item

    async def fake_create(*, model: str, messages: list[dict[str, str]], stream: bool = False, **kwargs):
        _ = model
        _ = messages
        _ = kwargs
        assert stream is True
        return _FakeStream(
            [
                SimpleNamespace(
                    choices=[SimpleNamespace(delta=SimpleNamespace(reasoning_content="思考A", content=None))]
                ),
                SimpleNamespace(
                    choices=[SimpleNamespace(delta=SimpleNamespace(reasoning_content=None, content="答案B"))]
                ),
            ]
        )

    adapter = DeepSeekLLMAdapter(api_key="deepseek-test-key")
    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    async def _collect():
        chunks = []
        async for chunk in adapter.stream_generate_text(
            prompt="你好",
            model="deepseek-chat",
            deepseek_thinking_type="enabled",
        ):
            chunks.append(chunk)
        return chunks

    chunks = asyncio.run(_collect())
    assert chunks == ["<think>", "思考A", "</think>", "<answer>", "答案B", "</answer>"]

