from pydantic_settings import BaseSettings
from config.database import DatabaseSettings
from config.redis import RedisSettings
from config.email import EmailSettings
from config.ai import AISettings
from config.elasticsearch import ElasticsearchSettings
from config.minio import MinIOSettings


class Settings(BaseSettings):
    app_env: str = "development"
    app_name: str = "WeiMeng"
    secret_key: str = "your-secret-key"
    algorithm: str = "HS256"
    access_token_expire_days: int = 30
    scripts_chunk_size: int = 1200
    scripts_chunk_overlap: int = 200
    scripts_upload_max_text_length: int = 10000

    database: DatabaseSettings = DatabaseSettings()
    redis: RedisSettings = RedisSettings()
    email: EmailSettings = EmailSettings()
    ai: AISettings = AISettings()
    elasticsearch: ElasticsearchSettings = ElasticsearchSettings()
    minio: MinIOSettings = MinIOSettings()

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
