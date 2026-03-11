import asyncio
from types import SimpleNamespace

from src.modules.providers.infrastructure.providers.qwen.llm_adapter import QwenLLMAdapter


def test_build_thinking_extra_body_merges_fields():
    result = QwenLLMAdapter.build_thinking_extra_body(
        enable_thinking=True,
        thinking_budget=50,
        extra_body={"foo": "bar"},
    )
    assert result == {"foo": "bar", "enable_thinking": True, "thinking_budget": 50}


def test_build_thinking_extra_body_returns_none_when_empty():
    result = QwenLLMAdapter.build_thinking_extra_body(
        enable_thinking=None,
        extra_body=None,
    )
    assert result is None


def test_generate_text_maps_enable_thinking_to_extra_body():
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

    adapter = QwenLLMAdapter(api_key="qwen-test-key")
    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    result = asyncio.run(
        adapter.generate_text(
            prompt="你好",
            model="qwen3.5-plus",
            enable_thinking=True,
            extra_body={"foo": "bar"},
        )
    )

    assert result == "<think>思考过程</think><answer>最终答案</answer>"
    assert captured["extra_body"] == {
        "foo": "bar",
        "enable_thinking": True,
        "thinking_budget": 65536,
    }


def test_generate_text_maps_thinking_budget_to_extra_body():
    captured: dict[str, object] = {}

    async def fake_create(*, model: str, messages: list[dict[str, str]], **kwargs):
        _ = model
        _ = messages
        captured.update(kwargs)
        return SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content="最终答案"))]
        )

    adapter = QwenLLMAdapter(api_key="qwen-test-key")
    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    result = asyncio.run(
        adapter.generate_text(
            prompt="你好",
            model="qwen3.5-plus",
            enable_thinking=True,
            thinking_budget=50,
        )
    )

    assert result == "最终答案"
    assert captured["extra_body"] == {"enable_thinking": True, "thinking_budget": 50}


def test_extract_thinking_and_answer_from_tags():
    think, answer = QwenLLMAdapter.extract_thinking_and_answer(
        "<think>推理过程</think><answer>最终结果</answer>"
    )
    assert think == "推理过程"
    assert answer == "最终结果"


def test_extract_thinking_and_answer_falls_back_to_raw_when_no_answer_tag():
    think, answer = QwenLLMAdapter.extract_thinking_and_answer("<think>推理过程</think>直接答案")
    assert think == "推理过程"
    assert answer == "直接答案"


def test_generate_text_uses_tagged_content_directly():
    captured: dict[str, object] = {}

    async def fake_create(*, model: str, messages: list[dict[str, str]], **kwargs):
        _ = model
        _ = messages
        captured.update(kwargs)
        return SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(
                        content="<think>过程</think><answer>结论</answer>",
                        reasoning_content="不会使用",
                    )
                )
            ]
        )

    adapter = QwenLLMAdapter(api_key="qwen-test-key")
    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    result = asyncio.run(
        adapter.generate_text(
            prompt="你好",
            model="qwen3.5-plus",
            enable_thinking=True,
        )
    )

    assert result == "<think>过程</think><answer>结论</answer>"


def test_stream_generate_text_emits_think_and_answer_tags():
    captured: dict[str, object] = {}

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
        captured.update(kwargs)
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

    adapter = QwenLLMAdapter(api_key="qwen-test-key")
    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    async def _collect():
        chunks = []
        async for chunk in adapter.stream_generate_text(
            prompt="你好",
            model="qwen3.5-plus",
            enable_thinking=True,
        ):
            chunks.append(chunk)
        return chunks

    chunks = asyncio.run(_collect())

    assert chunks == ["<think>", "思考A", "</think>", "<answer>", "答案B", "</answer>"]
    assert captured["extra_body"] == {"enable_thinking": True, "thinking_budget": 65536}


def test_stream_generate_text_without_thinking_outputs_answer_only():
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

    adapter = QwenLLMAdapter(api_key="qwen-test-key")
    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    async def _collect():
        chunks = []
        async for chunk in adapter.stream_generate_text(
            prompt="你好",
            model="qwen3.5-plus",
            enable_thinking=False,
        ):
            chunks.append(chunk)
        return chunks

    chunks = asyncio.run(_collect())
    assert chunks == ["答案B"]
