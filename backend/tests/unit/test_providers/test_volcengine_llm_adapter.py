import asyncio
from types import SimpleNamespace

from src.modules.providers.infrastructure.providers.volcengine.llm_adapter import VolcengineLLMAdapter


def test_build_thinking_extra_body_uses_input_type():
    result = VolcengineLLMAdapter.build_thinking_extra_body(
        thinking_type="enabled",
        reasoning_effort="high",
        extra_body={"foo": "bar"},
    )
    assert result == {
        "foo": "bar",
        "thinking": {"type": "enabled"},
        "reasoning": {"effort": "high"},
    }


def test_build_thinking_extra_body_returns_none_when_not_configured():
    result = VolcengineLLMAdapter.build_thinking_extra_body(
        thinking_type=None,
        reasoning_effort=None,
        extra_body=None,
    )
    assert result == {
        "thinking": {"type": "enabled"},
        "reasoning": {"effort": "medium"},
    }


def test_build_thinking_extra_body_forces_minimal_when_disabled():
    result = VolcengineLLMAdapter.build_thinking_extra_body(
        thinking_type="disabled",
        reasoning_effort="high",
        extra_body=None,
    )
    assert result == {
        "thinking": {"type": "disabled"},
        "reasoning": {"effort": "minimal"},
    }


def test_generate_text_returns_answer_only_when_enabled():
    captured: dict[str, object] = {}

    async def fake_create(*, model: str, messages: list[dict[str, str]], **kwargs):
        _ = model
        _ = messages
        captured.update(kwargs)
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

    adapter = VolcengineLLMAdapter(api_key="volcengine-test-key")
    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    result = asyncio.run(
        adapter.generate_text(
            prompt="你好",
            model="doubao-seed-2-0-pro-260215",
            thinking_type="enabled",
            reasoning_effort="minimal",
        )
    )

    assert result == "最终答案"
    assert captured["extra_body"] == {
        "thinking": {"type": "enabled"},
        "reasoning": {"effort": "minimal"},
    }


def test_generate_text_wraps_reasoning_content_when_disabled():
    captured: dict[str, object] = {}

    async def fake_create(*, model: str, messages: list[dict[str, str]], **kwargs):
        _ = model
        _ = messages
        captured.update(kwargs)
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

    adapter = VolcengineLLMAdapter(api_key="volcengine-test-key")
    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    result = asyncio.run(
        adapter.generate_text(
            prompt="你好",
            model="doubao-seed-2-0-pro-260215",
            thinking_type="enabled",
            reasoning_effort="medium",
        )
    )

    assert result == "<think>思考过程</think><answer>最终答案</answer>"
    assert captured["extra_body"] == {
        "thinking": {"type": "enabled"},
        "reasoning": {"effort": "medium"},
    }


def test_generate_text_wraps_reasoning_field_when_disabled():
    async def fake_create(*, model: str, messages: list[dict[str, str]], **kwargs):
        _ = model
        _ = messages
        _ = kwargs
        return SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(
                        content="最终答案",
                        reasoning="思考过程-来自reasoning",
                    )
                )
            ]
        )

    adapter = VolcengineLLMAdapter(api_key="volcengine-test-key")
    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    result = asyncio.run(
        adapter.generate_text(
            prompt="你好",
            model="doubao-seed-2-0-pro-260215",
            thinking_type="enabled",
            reasoning_effort="medium",
        )
    )

    assert result == "<think>思考过程-来自reasoning</think><answer>最终答案</answer>"


def test_generate_text_hides_reasoning_when_disabled():
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

    adapter = VolcengineLLMAdapter(api_key="volcengine-test-key")
    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    result = asyncio.run(
        adapter.generate_text(
            prompt="你好",
            model="doubao-seed-2-0-pro-260215",
            thinking_type="disabled",
            reasoning_effort="minimal",
        )
    )

    assert result == "最终答案"


def test_extract_thinking_and_answer_from_tags():
    think, answer = VolcengineLLMAdapter.extract_thinking_and_answer(
        "<think>推理过程</think><answer>最终结果</answer>"
    )
    assert think == "推理过程"
    assert answer == "最终结果"


def test_stream_generate_text_emits_think_and_answer_tags_when_enabled():
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

    adapter = VolcengineLLMAdapter(api_key="volcengine-test-key")
    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    async def _collect():
        chunks = []
        async for chunk in adapter.stream_generate_text(
            prompt="你好",
            model="doubao-seed-2-0-pro-260215",
            thinking_type="enabled",
            reasoning_effort="medium",
        ):
            chunks.append(chunk)
        return chunks

    chunks = asyncio.run(_collect())
    assert chunks == ["<think>", "思考A", "</think>", "<answer>", "答案B", "</answer>"]


def test_stream_generate_text_outputs_answer_only_when_effort_minimal():
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
                    choices=[SimpleNamespace(delta=SimpleNamespace(reasoning_content="思考A", content="答案B"))]
                ),
            ]
        )

    adapter = VolcengineLLMAdapter(api_key="volcengine-test-key")
    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    async def _collect():
        chunks = []
        async for chunk in adapter.stream_generate_text(
            prompt="你好",
            model="doubao-seed-2-0-pro-260215",
            thinking_type="enabled",
            reasoning_effort="minimal",
        ):
            chunks.append(chunk)
        return chunks

    chunks = asyncio.run(_collect())
    assert chunks == ["答案B"]
