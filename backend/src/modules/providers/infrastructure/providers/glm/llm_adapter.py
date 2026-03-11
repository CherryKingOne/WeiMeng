from src.modules.providers.infrastructure.providers.fastchat.llm_adapter import FastChatLLMAdapter


class GLMLLMAdapter(FastChatLLMAdapter):
    DEFAULT_BASE_URL = "https://open.bigmodel.cn/api/paas/v4"
    DEFAULT_CONVERSATION_TEMPLATE = "glm"
    DEFAULT_MODEL = "glm-5"
    SUPPORTED_MODELS = (
        "glm-4.7-flash",
        "glm-4-flash-250414",
        "glm-4v-flash",
        "glm-4.6v-flash",
        "glm-4.1v-thinking-flash"
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
