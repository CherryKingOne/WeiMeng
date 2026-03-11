from collections.abc import AsyncIterator
import re
from typing import Any

from src.modules.providers.infrastructure.providers.fastchat.llm_adapter import FastChatLLMAdapter


class VolcengineLLMAdapter(FastChatLLMAdapter):
    DEFAULT_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"
    DEFAULT_CONVERSATION_TEMPLATE = "volcengine"
    DEFAULT_MODEL = "doubao-seed-2-0-pro-260215"
    THINKING_TYPES = ("enabled", "disabled", "auto")
    REASONING_EFFORTS = ("minimal", "low", "medium", "high")
    SUPPORTED_MODELS = (
        "doubao-seed-2-0-pro-260215",
        "doubao-lite-128k-240428",
        "doubao-pro-128k-240515",
        "doubao-1-5-thinking-pro-m-250428",
    )

    def __init__(
        self,
        api_key: str,
        base_url: str | None = None,
        conversation_template: str | None = None,
    ):
        super().__init__(
            api_key=api_key,
            base_url=base_url or self.DEFAULT_BASE_URL,
            conversation_template=conversation_template or self.DEFAULT_CONVERSATION_TEMPLATE,
        )

    @staticmethod
    def _normalize_thinking_type(thinking_type: str | None) -> str:
        if thinking_type in VolcengineLLMAdapter.THINKING_TYPES:
            return str(thinking_type)
        return "enabled"

    @staticmethod
    def _normalize_reasoning_effort(reasoning_effort: str | None) -> str:
        if reasoning_effort in VolcengineLLMAdapter.REASONING_EFFORTS:
            return str(reasoning_effort)
        return "medium"

    @staticmethod
    def _is_thinking_enabled(thinking_type: str, reasoning_effort: str) -> bool:
        return thinking_type == "enabled" and reasoning_effort != "minimal"

    @staticmethod
    def _contains_think_answer_tags(content: str) -> bool:
        lowered = content.lower()
        return "<think>" in lowered or "<answer>" in lowered

    @staticmethod
    def extract_thinking_and_answer(content: str) -> tuple[str | None, str]:
        text = content.strip()
        think_matches = re.findall(r"<think>(.*?)</think>", text, flags=re.IGNORECASE | re.DOTALL)
        answer_matches = re.findall(r"<answer>(.*?)</answer>", text, flags=re.IGNORECASE | re.DOTALL)

        think_text = None
        if think_matches:
            think_text = "\n".join(item.strip() for item in think_matches if item.strip()) or None

        if answer_matches:
            answer_text = "\n".join(item.strip() for item in answer_matches if item.strip())
            if answer_text:
                return think_text, answer_text

        cleaned = re.sub(r"<think>.*?</think>", "", text, flags=re.IGNORECASE | re.DOTALL).strip()
        return think_text, cleaned

    def _extract_reasoning_content(self, message: object) -> str | None:
        reasoning = getattr(message, "reasoning_content", None)
        if reasoning is None:
            reasoning = getattr(message, "reasoning", None)
        if reasoning is None:
            model_extra = getattr(message, "model_extra", None)
            if isinstance(model_extra, dict):
                reasoning = model_extra.get("reasoning_content")
            if reasoning is None and isinstance(model_extra, dict):
                reasoning = model_extra.get("reasoning")
        if reasoning is None and isinstance(message, dict):
            reasoning = message.get("reasoning_content")
            if reasoning is None:
                reasoning = message.get("reasoning")
        if reasoning is None:
            reasoning = self._extract_reasoning_from_content_blocks(getattr(message, "content", None))
        if reasoning is None and isinstance(message, dict):
            reasoning = self._extract_reasoning_from_content_blocks(message.get("content"))
        if reasoning is None:
            return None
        normalized = self._normalize_content(reasoning).strip()
        return normalized or None

    def _extract_reasoning_from_content_blocks(self, content: object) -> str | None:
        if not isinstance(content, list):
            return None

        parts: list[str] = []
        for item in content:
            item_type = getattr(item, "type", None)
            if item_type is None and isinstance(item, dict):
                item_type = item.get("type")
            if str(item_type or "").lower() not in {"reasoning", "thinking"}:
                continue

            text = getattr(item, "text", None)
            if text is None and isinstance(item, dict):
                text = item.get("text")
            if text is None:
                text = getattr(item, "content", None)
            if text is None and isinstance(item, dict):
                text = item.get("content")
            if text:
                parts.append(str(text))

        merged = "".join(parts).strip()
        return merged or None

    @staticmethod
    def build_thinking_extra_body(
        thinking_type: str | None,
        reasoning_effort: str | None = None,
        extra_body: dict[str, Any] | None = None,
    ) -> dict[str, Any] | None:
        normalized_thinking_type = VolcengineLLMAdapter._normalize_thinking_type(thinking_type)
        normalized_reasoning_effort = VolcengineLLMAdapter._normalize_reasoning_effort(
            reasoning_effort
        )
        if normalized_thinking_type == "disabled":
            normalized_reasoning_effort = "minimal"
        merged_body: dict[str, Any] = dict(extra_body or {})
        merged_body["thinking"] = {
            "type": normalized_thinking_type,
        }
        merged_body["reasoning"] = {
            "effort": normalized_reasoning_effort,
        }
        return merged_body

    async def generate_text(self, prompt: str, model: str, **kwargs) -> str:
        thinking_type = kwargs.pop("thinking_type", None)
        reasoning_effort = kwargs.pop("reasoning_effort", None)
        extra_body = kwargs.pop("extra_body", None)
        messages = self._build_messages(prompt=prompt, custom_messages=kwargs.pop("messages", None))
        merged_extra_body = self.build_thinking_extra_body(
            thinking_type=thinking_type,
            reasoning_effort=reasoning_effort,
            extra_body=extra_body,
        )
        if merged_extra_body is not None:
            kwargs["extra_body"] = merged_extra_body

        response = await self._client.chat.completions.create(
            model=model,
            messages=messages,
            **kwargs,
        )
        if not response.choices:
            return ""

        message = response.choices[0].message
        answer_text = self._normalize_content(getattr(message, "content", None))
        if self._contains_think_answer_tags(answer_text):
            return answer_text

        effective_thinking_type = self._normalize_thinking_type(thinking_type)
        effective_reasoning_effort = self._normalize_reasoning_effort(reasoning_effort)
        reasoning_text = self._extract_reasoning_content(message)
        if reasoning_text and self._is_thinking_enabled(
            effective_thinking_type, effective_reasoning_effort
        ):
            return f"<think>{reasoning_text}</think><answer>{answer_text}</answer>"
        return answer_text

    async def stream_generate_text(self, prompt: str, model: str, **kwargs) -> AsyncIterator[str]:
        thinking_type = kwargs.pop("thinking_type", None)
        reasoning_effort = kwargs.pop("reasoning_effort", None)
        extra_body = kwargs.pop("extra_body", None)
        messages = self._build_messages(prompt=prompt, custom_messages=kwargs.pop("messages", None))
        merged_extra_body = self.build_thinking_extra_body(
            thinking_type=thinking_type,
            reasoning_effort=reasoning_effort,
            extra_body=extra_body,
        )
        if merged_extra_body is not None:
            kwargs["extra_body"] = merged_extra_body

        stream = await self._client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True,
            **kwargs,
        )
        effective_thinking_type = self._normalize_thinking_type(thinking_type)
        effective_reasoning_effort = self._normalize_reasoning_effort(reasoning_effort)
        thinking_enabled = self._is_thinking_enabled(
            effective_thinking_type, effective_reasoning_effort
        )
        think_started = False
        answer_started = False

        async for chunk in stream:
            if not chunk.choices:
                continue

            delta = chunk.choices[0].delta
            reasoning_text = self._extract_reasoning_content(delta) or ""
            answer_text = self._normalize_content(getattr(delta, "content", None))

            if thinking_enabled and reasoning_text:
                if not think_started:
                    yield "<think>"
                    think_started = True
                yield reasoning_text

            if answer_text:
                if thinking_enabled and think_started and not answer_started:
                    yield "</think>"
                if thinking_enabled and not answer_started:
                    yield "<answer>"
                    answer_started = True
                yield answer_text

        if thinking_enabled and think_started and not answer_started:
            yield "</think>"
        if thinking_enabled and answer_started:
            yield "</answer>"
