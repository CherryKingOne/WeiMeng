from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from typing import BinaryIO


class IStorageProvider(ABC):
    @abstractmethod
    async def upload_file(
        self,
        object_name: str,
        data_stream: BinaryIO,
        data_size: int,
        content_type: str | None = None,
    ) -> str:
        pass

    @abstractmethod
    async def upload_bytes(self, object_name: str, data: bytes, content_type: str | None = None) -> str:
        pass

    @abstractmethod
    def open_object(self, object_name: str) -> AsyncIterator[BinaryIO]:
        pass

    @abstractmethod
    async def get_object_bytes(self, object_name: str) -> bytes:
        pass

    @abstractmethod
    async def delete_object(self, object_name: str) -> None:
        pass
