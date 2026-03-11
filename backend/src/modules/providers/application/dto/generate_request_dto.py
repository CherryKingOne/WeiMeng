from pydantic import BaseModel, Field

from src.modules.providers.domain.value_objects.provider_name import ProviderName


class GenerateTextRequest(BaseModel):
    provider: ProviderName = Field(..., description="模型供应商")
    model_name: str | None = Field(default=None, min_length=1, max_length=128, description="模型名称")
    prompt: str = Field(..., min_length=1, description="输入提示词")
    conversation_template: str | None = Field(default=None, description="FastChat 会话模板")
    temperature: float | None = Field(default=None, ge=0, le=2)
    max_tokens: int | None = Field(default=None, gt=0)


class GenerateTextResponse(BaseModel):
    provider: ProviderName
    model_name: str
    reply: str
