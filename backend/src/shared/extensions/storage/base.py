from abc import ABC, abstractmethod


class IStorageProvider(ABC):
    @abstractmethod
    async def upload_bytes(self, object_name: str, data: bytes, content_type: str | None = None) -> str:
        pass

    @abstractmethod
    async def get_object_bytes(self, object_name: str) -> bytes:
        pass

    @abstractmethod
    async def delete_object(self, object_name: str) -> None:
        pass
