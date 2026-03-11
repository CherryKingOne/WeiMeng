from pydantic_settings import BaseSettings


class AISettings(BaseSettings):
    langfuse_public_key: str | None = None
    langfuse_secret_key: str | None = None

    class Config:
        env_file = ".env"
        extra = "ignore"
