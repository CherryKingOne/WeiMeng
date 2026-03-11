from src.modules.providers.infrastructure.providers.fastchat.llm_adapter import FastChatLLMAdapter


class KimiLLMAdapter(FastChatLLMAdapter):
    DEFAULT_BASE_URL = "https://api.moonshot.ai/v1"
    DEFAULT_CONVERSATION_TEMPLATE = "kimi"
    DEFAULT_MODEL = "kimi-k2-turbo-preview"
    SUPPORTED_MODELS = (
        "kimi-k2-turbo-preview",
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
