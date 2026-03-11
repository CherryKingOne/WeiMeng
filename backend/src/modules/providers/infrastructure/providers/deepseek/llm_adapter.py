from collections.abc import AsyncIterator
import re
from typing import Any

from src.modules.providers.infrastructure.providers.fastchat.llm_adapter import FastChatLLMAdapter


class DeepSeekLLMAdapter(FastChatLLMAdapter):
    DEFAULT_BASE_URL = "https://api.deepseek.com/v1"
    DEFAULT_CONVERSATION_TEMPLATE = "deepseek"
    DEFAULT_MODEL = "deepseek-chat"
    SUPPORTED_MODELS = (
        "deepseek-chat",
        "deepseek-reasoner",
    )
    THINKING_TYPES = ("enabled", "disabled")

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
    def _normalize_thinking_type(thinking_type: str | None) -> str | None:
        if thinking_type in DeepSeekLLMAdapter.THINKING_TYPES:
            return str(thinking_type)
        return None

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
            model_extra = getattr(message, "model_extra", None)
            if isinstance(model_extra, dict):
                reasoning = model_extra.get("reasoning_content")
        if reasoning is None and isinstance(message, dict):
            reasoning = message.get("reasoning_content")
        if reasoning is None:
            return None
        normalized = self._normalize_content(reasoning).strip()
        return normalized or None

    @staticmethod
    def build_thinking_extra_body(
        thinking_type: str | None,
        extra_body: dict[str, Any] | None = None,
    ) -> dict[str, Any] | None:
        normalized_thinking_type = DeepSeekLLMAdapter._normalize_thinking_type(thinking_type)
        merged_body: dict[str, Any] = dict(extra_body or {})
        if normalized_thinking_type is not None:
            merged_body["thinking"] = {"type": normalized_thinking_type}
        return merged_body or None

    @staticmethod
    def _is_thinking_enabled(model: str, thinking_type: str | None) -> bool:
        if thinking_type == "enabled":
            return True
        if thinking_type == "disabled":
            return False
        return model == "deepseek-reasoner"

    async def generate_text(self, prompt: str, model: str, **kwargs) -> str:
        thinking_type = kwargs.pop("deepseek_thinking_type", None)
        extra_body = kwargs.pop("extra_body", None)
        messages = self._build_messages(prompt=prompt, custom_messages=kwargs.pop("messages", None))
        merged_extra_body = self.build_thinking_extra_body(
            thinking_type=thinking_type,
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

        reasoning_text = self._extract_reasoning_content(message)
        if reasoning_text and self._is_thinking_enabled(model=model, thinking_type=thinking_type):
            return f"<think>{reasoning_text}</think><answer>{answer_text}</answer>"
        return answer_text

    async def stream_generate_text(self, prompt: str, model: str, **kwargs) -> AsyncIterator[str]:
        thinking_type = kwargs.pop("deepseek_thinking_type", None)
        extra_body = kwargs.pop("extra_body", None)
        messages = self._build_messages(prompt=prompt, custom_messages=kwargs.pop("messages", None))
        merged_extra_body = self.build_thinking_extra_body(
            thinking_type=thinking_type,
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

        thinking_enabled = self._is_thinking_enabled(model=model, thinking_type=thinking_type)
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
