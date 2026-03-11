from enum import Enum


class ProviderName(str, Enum):
    OPENAI = "openai"
    QWEN = "qwen"
    VOLCENGINE = "volcengine"
    GROK = "grok"
    GEMINI = "gemini"
    ANTHROPIC = "anthropic"
    KIMI = "kimi"
    GLM = "glm"
    MINIMAX = "minimax"
    DEEPSEEK = "deepseek"
