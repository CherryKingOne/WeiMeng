from src.modules.providers.infrastructure.providers.fastchat.llm_adapter import FastChatLLMAdapter


class GeminiLLMAdapter(FastChatLLMAdapter):
    DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai"
    DEFAULT_CONVERSATION_TEMPLATE = "gemini"
    DEFAULT_MODEL = "gemini-2.0-flash"
    SUPPORTED_MODELS = (
        "gemini-2.0-flash",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
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
