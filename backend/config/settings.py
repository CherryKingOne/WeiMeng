from pydantic_settings import BaseSettings
from config.database import DatabaseSettings
from config.redis import RedisSettings
from config.email import EmailSettings
from config.ai import AISettings

class Settings(BaseSettings):
    app_env: str = "development"
    app_name: str = "WeiMeng Agent"
    secret_key: str = "your-secret-key"
    algorithm: str = "HS256"
    access_token_expire_days: int = 30
    
    database: DatabaseSettings = DatabaseSettings()
    redis: RedisSettings = RedisSettings()
    email: EmailSettings = EmailSettings()
    ai: AISettings = AISettings()
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
