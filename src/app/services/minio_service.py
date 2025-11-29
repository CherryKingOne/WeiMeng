from minio import Minio
from app.core.config import settings
import io


class MinioService:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        self.bucket = settings.MINIO_BUCKET_NAME
        self._ensure_bucket()

    def _ensure_bucket(self):
        """Ensure bucket exists, create if not"""
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
        except Exception as e:
            print(f"MinIO bucket check/creation error: {e}")

    def create_folder(self, folder_name: str):
        """
        Minio doesn't have real folders, folders are created implicitly 
        when uploading files with path prefixes
        """
        pass

    def upload_file(self, file_data: bytes, object_name: str, content_type: str) -> str:
        """Upload file to specified path"""
        data_stream = io.BytesIO(file_data)
        self.client.put_object(
            self.bucket,
            object_name,
            data_stream,
            length=len(file_data),
            content_type=content_type
        )
        # Return access URL (for private buckets, should use presigned URLs)
        protocol = "https" if settings.MINIO_SECURE else "http"
        return f"{protocol}://{settings.MINIO_ENDPOINT}/{self.bucket}/{object_name}"

    def delete_file(self, object_name: str):
        """Delete a single file"""
        try:
            self.client.remove_object(self.bucket, object_name)
        except Exception as e:
            print(f"MinIO delete error: {e}")

    def delete_folder(self, prefix: str):
        """Delete folder (all files with this prefix)"""
        try:
            objects_to_delete = self.client.list_objects(self.bucket, prefix=prefix, recursive=True)
            for obj in objects_to_delete:
                self.client.remove_object(self.bucket, obj.object_name)
        except Exception as e:
            print(f"MinIO folder delete error: {e}")

    def get_presigned_url(self, object_name: str, expires_seconds: int = 3600) -> str:
        """Generate presigned download URL"""
        from datetime import timedelta
        try:
            url = self.client.presigned_get_object(
                self.bucket,
                object_name,
                expires=timedelta(seconds=expires_seconds)
            )
            return url
        except Exception as e:
            print(f"MinIO presigned URL error: {e}")
            return ""

    def get_file_content(self, object_name: str) -> bytes:
        """Get file content from MinIO"""
        try:
            response = self.client.get_object(self.bucket, object_name)
            content = response.read()
            response.close()
            response.release_conn()
            return content
        except Exception as e:
            print(f"MinIO get file content error: {e}")
            raise e

    def get_file_size(self, object_name: str) -> int:
        """Get file size from MinIO (in bytes)"""
        try:
            stat = self.client.stat_object(self.bucket, object_name)
            return stat.size
        except Exception as e:
            print(f"MinIO get file size error: {e}")
            return 0


# Global instance
minio_client = MinioService()
