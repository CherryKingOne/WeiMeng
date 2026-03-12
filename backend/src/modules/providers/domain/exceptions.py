from src.shared.domain.exceptions import DomainException


class ProviderCapabilityNotSupportedException(DomainException):
    def __init__(self, provider: str, model_type: str):
        super().__init__(
            message="Provider capability not supported",
            code=422,
            detail=f"Provider '{provider}' does not support model type '{model_type}'",
        )


class ProviderConfigNotFoundException(DomainException):
    def __init__(self, provider: str):
        super().__init__(
            message="Provider config not found",
            code=422,
            detail=f"Provider '{provider}' is not configured",
        )


class ModelGenerationFailedException(DomainException):
    def __init__(self, detail: str | None = None):
        super().__init__(
            message="Model generation failed",
            code=500,
            detail=detail or "Model provider returned an unexpected error",
        )


class ProviderModelNotSupportedException(DomainException):
    def __init__(self, provider: str, model: str):
        super().__init__(
            message="Provider model not supported",
            code=422,
            detail=f"Model '{model}' is not supported by provider '{provider}'",
        )


class OpenAICompatibleModelAlreadyExistsException(DomainException):
    def __init__(self, model: str):
        super().__init__(
            message="OpenAI compatible model already exists",
            code=409,
            detail=f"Model '{model}' is already configured for provider 'openai-compatible'",
        )


class OpenAICompatibleModelNotFoundException(DomainException):
    def __init__(self, model: str):
        super().__init__(
            message="OpenAI compatible model not found",
            code=404,
            detail=f"Model '{model}' is not configured for provider 'openai-compatible'",
        )
