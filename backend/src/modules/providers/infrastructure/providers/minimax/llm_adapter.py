from src.modules.providers.infrastructure.providers.fastchat.llm_adapter import FastChatLLMAdapter


class MiniMaxLLMAdapter(FastChatLLMAdapter):
    DEFAULT_BASE_URL = "https://api.minimax.io/v1"
    DEFAULT_CONVERSATION_TEMPLATE = "minimax"
    DEFAULT_MODEL = "MiniMax-Text-01"
    SUPPORTED_MODELS = (
        "MiniMax-Text-01",
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
