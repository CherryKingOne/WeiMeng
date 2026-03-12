from enum import Enum


class ProviderName(str, Enum):
    OPENAI = "openai"
    OPENAI_COMPATIBLE = "openai-compatible"
    QWEN = "qwen"
    VOLCENGINE = "volcengine"
    GROK = "grok"
    GEMINI = "gemini"
    ANTHROPIC = "anthropic"
    KIMI = "kimi"
    GLM = "glm"
    MINIMAX = "minimax"
    DEEPSEEK = "deepseek"
