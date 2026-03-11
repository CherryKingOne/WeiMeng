from __future__ import annotations

from collections.abc import AsyncIterator

from openai import AsyncOpenAI

from src.modules.providers.domain.interfaces.llm_provider import ILLMProvider

try:
    from fastchat.conversation import get_conv_template
except ModuleNotFoundError:  # pragma: no cover - optional dependency during bootstrap
    get_conv_template = None


class FastChatLLMAdapter(ILLMProvider):
    def __init__(
        self,
        api_key: str,
        base_url: str,
        conversation_template: str | None = None,
    ):
        self._client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self._conversation_template = conversation_template

    async def generate_text(self, prompt: str, model: str, **kwargs) -> str:
        messages = self._build_messages(prompt=prompt, custom_messages=kwargs.pop("messages", None))
        response = await self._client.chat.completions.create(
            model=model,
            messages=messages,
            **kwargs,
        )

        if not response.choices:
            return ""

        return self._normalize_content(response.choices[0].message.content)

    async def stream_generate_text(self, prompt: str, model: str, **kwargs) -> AsyncIterator[str]:
        messages = self._build_messages(prompt=prompt, custom_messages=kwargs.pop("messages", None))
        stream = await self._client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True,
            **kwargs,
        )

        async for chunk in stream:
            if not chunk.choices:
                continue

            delta_content = chunk.choices[0].delta.content
            if not delta_content:
                continue

            if isinstance(delta_content, str):
                yield delta_content
                continue

            if isinstance(delta_content, list):
                for item in delta_content:
                    text = getattr(item, "text", None)
                    if text is None and isinstance(item, dict):
                        text = item.get("text")
                    if text:
                        yield str(text)
                continue

            yield str(delta_content)

    def _build_messages(
        self,
        prompt: str,
        custom_messages: list[dict[str, str]] | None,
    ) -> list[dict[str, str]]:
        if custom_messages:
            return custom_messages

        fastchat_prompt = self._build_fastchat_prompt(prompt)
        return [{"role": "user", "content": fastchat_prompt}]

    def _build_fastchat_prompt(self, prompt: str) -> str:
        if get_conv_template is None or not self._conversation_template:
            return prompt

        try:
            conv = get_conv_template(self._conversation_template)
            conv.append_message(conv.roles[0], prompt)
            conv.append_message(conv.roles[1], None)
            return conv.get_prompt()
        except Exception:
            return prompt

    @staticmethod
    def _normalize_content(content: object) -> str:
        if content is None:
            return ""

        if isinstance(content, str):
            return content

        if isinstance(content, list):
            parts: list[str] = []
            for item in content:
                text = getattr(item, "text", None)
                if text is None and isinstance(item, dict):
                    text = item.get("text")
                if text:
                    parts.append(str(text))
            return "".join(parts)

        return str(content)
