from pydantic_settings import BaseSettings

class EmailSettings(BaseSettings):
    host: str = "smtp.example.com"
    port: int = 587
    user: str = "user@example.com"
    password: str = "secret"
    use_tls: bool = True
    from_name: str = "WeiMeng"
    
    class Config:
        env_prefix = "SMTP_"
        env_file = ".env"
        extra = "ignore"
