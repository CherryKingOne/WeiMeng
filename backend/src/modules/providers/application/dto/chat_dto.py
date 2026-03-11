from enum import Enum

from pydantic import BaseModel, Field, model_validator

from src.modules.providers.domain.value_objects.provider_name import ProviderName


class VolcengineThinkingType(str, Enum):
    ENABLED = "enabled"
    DISABLED = "disabled"
    AUTO = "auto"


class VolcengineReasoningEffort(str, Enum):
    MINIMAL = "minimal"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ThinkingType(str, Enum):
    ENABLED = "enabled"
    DISABLED = "disabled"
    AUTO = "auto"


class ThinkingConfig(BaseModel):
    type: ThinkingType = Field(
        default=ThinkingType.ENABLED,
        description="思考模式：enabled/disabled/auto（各供应商支持范围不同）",
    )
    reasoning_effort: VolcengineReasoningEffort | None = Field(
        default=None,
        description="volcengine 思考长度：minimal/low/medium/high",
    )

    @model_validator(mode="after")
    def validate_reasoning_effort(self) -> "ThinkingConfig":
        if self.reasoning_effort is None:
            return self
        if self.type == ThinkingType.DISABLED:
            if self.reasoning_effort != VolcengineReasoningEffort.MINIMAL:
                raise ValueError(
                    "when thinking.type=disabled, reasoning_effort must be minimal"
                )
        return self


class ChatRequest(BaseModel):
    provider: ProviderName | None = Field(default=None, description="模型供应商")
    model_name: str | None = Field(default=None, min_length=1, max_length=128, description="模型名称")
    message: str = Field(..., min_length=1, description="对话内容")
    stream: bool = Field(default=False, description="是否使用流式输出")
    enable_thinking: bool | None = Field(
        default=None,
        description="Qwen 专属参数：是否启用思考模式",
    )
    thinking_budget: int | None = Field(
        default=None,
        gt=0,
        le=65536,
        description="Qwen 专属参数：思考长度预算，默认 65536（64K）",
    )
    thinking: ThinkingConfig | None = Field(
        default=None,
        description="volcengine/deepseek 专属思考配置",
    )
    conversation_template: str | None = Field(
        default=None,
        description="FastChat 会话模板（可选覆盖）",
    )
    temperature: float | None = Field(default=None, ge=0, le=2)
    max_tokens: int | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def validate_provider_and_model_name(self) -> "ChatRequest":
        if self.provider is None and self.model_name:
            raise ValueError("provider is required when model_name is provided")
        return self


class ChatResponse(BaseModel):
    provider: ProviderName
    model_name: str
    think: str | None = None
    answer: str
