from pydantic_settings import BaseSettings


class MinIOSettings(BaseSettings):
    endpoint: str = "localhost:9000"
    access_key: str = "minioadmin"
    secret_key: str = "minioadmin"
    bucket_name: str = "scripts"
    secure: bool = False

    class Config:
        env_prefix = "MINIO_"
        env_file = ".env"
        extra = "ignore"
