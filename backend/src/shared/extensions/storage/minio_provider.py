import asyncio
import logging
from io import BytesIO

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

    async def upload_bytes(self, object_name: str, data: bytes, content_type: str | None = None) -> str:
        await self._ensure_bucket()
        stream = BytesIO(data)
        try:
            await asyncio.to_thread(
                self._client.put_object,
                self._bucket_name,
                object_name,
                stream,
                len(data),
                content_type=content_type,
            )
            return object_name
        except S3Error as exc:  # type: ignore[misc]
            raise RuntimeError(f"Failed to upload object '{object_name}': {exc}") from exc

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
