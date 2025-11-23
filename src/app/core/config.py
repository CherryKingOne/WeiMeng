from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Script Engine"
    API_PORT: int = 7767
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # PostgreSQL
    POSTGRESQL_DB: str
    POSTGRESQL_USER: str
    POSTGRESQL_PASSWORD: str
    POSTGRESQL_HOST: str
    POSTGRESQL_PORT: int
    
    @property
    def DATABASE_URL(self) -> str:
        """Construct PostgreSQL async connection URL"""
        return f"postgresql+asyncpg://{self.POSTGRESQL_USER}:{self.POSTGRESQL_PASSWORD}@{self.POSTGRESQL_HOST}:{self.POSTGRESQL_PORT}/{self.POSTGRESQL_DB}"

    # Minio
    MINIO_ENDPOINT: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_BUCKET_NAME: str
    MINIO_SECURE: bool = False

    # LLM
    LLM_API_URL: str
    LLM_API_KEY: str
    LLM_MODEL_NAME: str
    CONTEXT_TOKEN_LIMIT: int = 4096

    # External AI APIs
    JIMENG_API_KEY: str = ""
    QINIU_ACCESS_KEY: str = ""

    # Email SMTP
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SENDER_EMAIL: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
