from src.modules.providers.infrastructure.providers.fastchat.llm_adapter import FastChatLLMAdapter


class AnthropicLLMAdapter(FastChatLLMAdapter):
    DEFAULT_BASE_URL = "https://api.anthropic.com/v1"
    DEFAULT_CONVERSATION_TEMPLATE = "anthropic"
    DEFAULT_MODEL = "claude-opus-4-6"
    SUPPORTED_MODELS = (
        "claude-opus-4-6",
        "claude-3-7-sonnet-latest",
        "claude-3-5-haiku-latest",
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
