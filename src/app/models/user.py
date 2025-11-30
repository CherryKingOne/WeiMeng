from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    account = Column(String(50), unique=True, index=True, nullable=False)  # 账号,默认与邮箱相同,可修改
    username = Column(String(50), nullable=False)  # 用户名(昵称),默认为邮箱前缀
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    default_models = Column(JSONB, nullable=True)  # 按模型类型存储默认模型: {"LLM": "config_id", "TTS": "config_id", ...}
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
