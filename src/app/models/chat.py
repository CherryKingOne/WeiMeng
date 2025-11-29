from sqlalchemy import Column, String, Float, Boolean, Integer, Text, DateTime, ForeignKey, Index, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class ChatSession(Base):
    """聊天会话表 - 记录对话的基础配置和上下文"""
    __tablename__ = "chat_sessions"

    session_id = Column(String(255), primary_key=True)  # 格式：UserUUID_13位时间戳
    user_id = Column(String(255), nullable=False, index=True)
    config_id = Column(String(64), nullable=False)  # 关联的模型配置ID
    title = Column(String(255), default='新对话')
    model_name = Column(String(128), nullable=False)
    temperature = Column(Float, default=0.7)
    is_thinking_mode = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_chat_sessions_user', 'user_id'),
    )


class ChatMessage(Base):
    """聊天消息表 - 存储具体的对话内容 (User 和 Assistant)"""
    __tablename__ = "chat_messages"

    message_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(255), ForeignKey("chat_sessions.session_id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)  # 消息内容
    token_usage = Column(Integer, default=0)  # (预留) Token消耗
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("ChatSession", back_populates="messages")

    __table_args__ = (
        Index('idx_chat_messages_session', 'session_id'),
    )


class ChatRequestTask(Base):
    """聊天请求任务表 - 记录从接收请求到回复完成的完整时长"""
    __tablename__ = "chat_request_tasks"

    task_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(255), nullable=False)
    user_id = Column(String(255), nullable=False)
    config_id = Column(String(64), nullable=False)
    model_name = Column(String(128))
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration_ms = Column(Integer, default=0)  # 完整耗时(ms)
    status = Column(String(20), default='processing')  # processing, success, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_chat_tasks_created', 'created_at'),
    )


class ChatError(Base):
    """聊天错误日志表 - 记录异常堆栈，用于Debug"""
    __tablename__ = "chat_errors"

    error_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(255))
    user_id = Column(String(255))
    config_id = Column(String(64))
    error_message = Column(Text)
    stack_trace = Column(Text)
    request_params = Column(Text)  # 当时的请求参数JSON
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class VideoTask(Base):
    """视频生成任务表 - 记录视频任务ID和对应的配置信息"""
    __tablename__ = "video_tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(String(255), unique=True, nullable=False, index=True)  # 外部API返回的任务ID
    user_id = Column(String(255), nullable=False, index=True)
    config_id = Column(String(64), nullable=False)  # 使用的模型配置ID
    model_name = Column(String(128))
    prompt = Column(Text)
    status = Column(String(20), default='queued')  # queued, in_progress, completed, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index('idx_video_tasks_user', 'user_id'),
        Index('idx_video_tasks_task_id', 'task_id'),
    )
