from abc import ABC, abstractmethod
from typing import Any


class IImageProvider(ABC):
    @abstractmethod
    async def text_to_image(self, prompt: str, model: str, **kwargs) -> Any:
        """Generate image from text prompt."""

    @abstractmethod
    async def image_to_image(self, image: bytes, prompt: str, model: str, **kwargs) -> Any:
        """Generate image from source image + prompt."""
