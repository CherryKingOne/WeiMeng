import asyncio
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from io import BytesIO
from typing import BinaryIO

from config.settings import settings
from src.shared.extensions.storage.base import IStorageProvider

try:
    from minio import Minio
    from minio.error import S3Error
except Exception:  # pragma: no cover - fallback when dependency is missing
    Minio = None  # type: ignore[assignment]
    S3Error = Exception

logger = logging.getLogger(__name__)


def _mask_key(key: str) -> str:
    if not key:
        return "<empty>"
    if len(key) <= 4:
        return "*" * len(key)
    return f"{key[:2]}***{key[-2:]}"


class MinIOProvider(IStorageProvider):
    def __init__(self):
        minio_settings = settings.minio
        if Minio is None:
            raise RuntimeError("MinIO client is not available, install 'minio' dependency first")

        self._endpoint = minio_settings.endpoint
        self._access_key = minio_settings.access_key
        self._secure = minio_settings.secure
        self._client = Minio(
            endpoint=self._endpoint,
            access_key=self._access_key,
            secret_key=minio_settings.secret_key,
            secure=self._secure,
        )
        self._bucket_name = minio_settings.bucket_name
        self._bucket_ready = False

    async def _ensure_bucket(self) -> None:
        if self._bucket_ready:
            return

        try:
            bucket_exists = await asyncio.to_thread(
                self._client.bucket_exists,
                self._bucket_name,
            )
            if not bucket_exists:
                await asyncio.to_thread(self._client.make_bucket, self._bucket_name)
            self._bucket_ready = True
        except S3Error as exc:  # type: ignore[misc]
            logger.error(
                "MinIO ensure bucket failed: endpoint=%s bucket=%s secure=%s access_key=%s error=%s",
                self._endpoint,
                self._bucket_name,
                self._secure,
                _mask_key(self._access_key),
                exc,
            )
            raise RuntimeError(
                "Failed to ensure bucket "
                f"'{self._bucket_name}' (endpoint={self._endpoint}, secure={self._secure}, "
                f"access_key={_mask_key(self._access_key)}): {exc}"
            ) from exc

    async def upload_file(
        self,
        object_name: str,
        data_stream: BinaryIO,
        data_size: int,
        content_type: str | None = None,
    ) -> str:
        await self._ensure_bucket()
        if data_size < 0:
            raise RuntimeError(f"Invalid object size for upload '{object_name}': {data_size}")

        try:
            await asyncio.to_thread(
                self._client.put_object,
                self._bucket_name,
                object_name,
                data_stream,
                data_size,
                content_type=content_type,
            )
            return object_name
        except S3Error as exc:  # type: ignore[misc]
            raise RuntimeError(f"Failed to upload object '{object_name}': {exc}") from exc

    async def upload_bytes(self, object_name: str, data: bytes, content_type: str | None = None) -> str:
        await self._ensure_bucket()
        stream = BytesIO(data)
        return await self.upload_file(
            object_name=object_name,
            data_stream=stream,
            data_size=len(data),
            content_type=content_type,
        )

    @asynccontextmanager
    async def open_object(self, object_name: str) -> AsyncIterator[BinaryIO]:
        await self._ensure_bucket()
        response = None
        try:
            response = await asyncio.to_thread(
                self._client.get_object,
                self._bucket_name,
                object_name,
            )
            yield response
        except S3Error as exc:  # type: ignore[misc]
            raise RuntimeError(f"Failed to read object '{object_name}': {exc}") from exc
        finally:
            if response is not None:
                await asyncio.to_thread(response.close)
                await asyncio.to_thread(response.release_conn)

    async def get_object_bytes(self, object_name: str) -> bytes:
        async with self.open_object(object_name) as response:
            return await asyncio.to_thread(response.read)

    async def delete_object(self, object_name: str) -> None:
        await self._ensure_bucket()
        try:
            await asyncio.to_thread(
                self._client.remove_object,
                self._bucket_name,
                object_name,
            )
        except S3Error as exc:  # type: ignore[misc]
            raise RuntimeError(f"Failed to delete object '{object_name}': {exc}") from exc
