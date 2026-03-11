from src.modules.providers.infrastructure.providers.fastchat.llm_adapter import FastChatLLMAdapter


class OpenAILLMAdapter(FastChatLLMAdapter):
    DEFAULT_BASE_URL = "https://api.openai.com/v1"
    DEFAULT_CONVERSATION_TEMPLATE = "openai"
    DEFAULT_MODEL = "gpt-4o-mini"
    SUPPORTED_MODELS = (
        "gpt-4o-mini",
        "gpt-4.1-mini",
        "gpt-4.1",
        "gpt-4o",
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
