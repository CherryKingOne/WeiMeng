from pydantic_settings import BaseSettings

class AISettings(BaseSettings):
    openai_api_key: str | None = None
    langfuse_public_key: str | None = None
    langfuse_secret_key: str | None = None
    
    class Config:
        env_file = ".env"
        extra = "ignore"
