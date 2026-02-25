from pydantic_settings import BaseSettings

class DatabaseSettings(BaseSettings):
    host: str = "localhost"
    port: int = 5432
    user: str = "postgres"
    password: str = "password"
    db: str = "app_db"
    
    @property
    def url(self) -> str:
        return f"postgresql+asyncpg://{self.user}:{self.password}@{self.host}:{self.port}/{self.db}"
    
    class Config:
        env_prefix = "POSTGRESQL_"
        env_file = ".env"
        extra = "ignore"
