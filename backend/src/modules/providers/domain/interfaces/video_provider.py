from abc import ABC, abstractmethod
from typing import Any


class IVideoProvider(ABC):
    @abstractmethod
    async def text_to_video(self, prompt: str, model: str, **kwargs) -> Any:
        """Generate video from text prompt."""

    @abstractmethod
    async def image_to_video(self, image: bytes, prompt: str, model: str, **kwargs) -> Any:
        """Generate video from source image + prompt."""
