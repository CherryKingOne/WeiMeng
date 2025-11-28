from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ChatMessage(BaseModel):
    """聊天消息模型"""
    role: str = Field(..., description="角色: user, assistant, system")
    content: str = Field(..., description="消息内容")


class ChatRequest(BaseModel):
    """聊天请求模型"""
    config_id: Optional[str] = Field(None, description="模型配置ID，不传则使用全局默认模型")
    messages: List[ChatMessage] = Field(..., description="上下文消息列表")
    stream: bool = Field(default=True, description="是否流式输出")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="随机性 (0-2)")
    thinking_mode: bool = Field(default=False, description="是否开启深度思考模式")
    session_id: Optional[str] = Field(None, description="继续对话时传入，新对话传空")
    system_prompt: Optional[str] = Field(None, description="系统提示词（可选），用于设定AI的角色和行为")


class ChatResponse(BaseModel):
    """聊天响应模型"""
    code: int = 200
    msg: str = "success"
    data: dict
    meta: Optional[dict] = None


class SessionInfo(BaseModel):
    """会话信息"""
    session_id: str
    user_id: str
    config_id: str
    title: str
    model_name: str
    temperature: float
    is_thinking_mode: bool
    created_at: datetime
    updated_at: datetime


class MessageInfo(BaseModel):
    """消息信息"""
    message_id: int
    session_id: str
    role: str
    content: str
    token_usage: int
    created_at: datetime


class SessionListResponse(BaseModel):
    """会话列表响应"""
    total: int
    sessions: List[SessionInfo]


class MessageListResponse(BaseModel):
    """消息列表响应"""
    total: int
    messages: List[MessageInfo]


class SetDefaultModelRequest(BaseModel):
    """设置默认模型请求"""
    config_id: str = Field(..., description="模型配置ID")
    model_type: Optional[str] = Field(None, description="模型类型（可选），如果不传则使用模型配置中的类型")


class SetLibraryLocalModelRequest(BaseModel):
    """设置剧本库局部模型请求"""
    config_id: str = Field(..., description="模型配置ID")
    model_type: Optional[str] = Field(None, description="模型类型（可选），用于验证或记录")
