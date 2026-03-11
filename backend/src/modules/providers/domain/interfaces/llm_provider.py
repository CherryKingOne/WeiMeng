from abc import ABC, abstractmethod
from collections.abc import AsyncIterator


class ILLMProvider(ABC):
    @abstractmethod
    async def generate_text(self, prompt: str, model: str, **kwargs) -> str:
        """Generate text with a provider-specific model."""

    @abstractmethod
    async def stream_generate_text(self, prompt: str, model: str, **kwargs) -> AsyncIterator[str]:
        """Generate text stream with a provider-specific model."""
