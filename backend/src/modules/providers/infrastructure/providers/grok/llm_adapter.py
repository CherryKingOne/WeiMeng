from src.modules.providers.infrastructure.providers.fastchat.llm_adapter import FastChatLLMAdapter


class GrokLLMAdapter(FastChatLLMAdapter):
    DEFAULT_BASE_URL = "https://api.x.ai/v1"
    DEFAULT_CONVERSATION_TEMPLATE = "grok"
    DEFAULT_MODEL = "grok-3-mini-latest"
    SUPPORTED_MODELS = (
        "grok-3-mini-latest",
        "grok-2-vision-latest",
        "grok-beta",
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
