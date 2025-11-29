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
    data: Optional[dict] = None
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


class ImageGenerationRequest(BaseModel):
    """文生图请求模型"""
    config_id: str = Field(..., description="模型配置ID（必填）")
    prompt: str = Field(..., description="图像生成提示词")
    size: Optional[str] = Field(None, description="图像尺寸，如 1024x1024, 512x512 等（可选）")
    n: Optional[int] = Field(None, ge=1, le=10, description="生成图像数量（可选）")
    quality: Optional[str] = Field(None, description="图像质量: standard 或 hd（可选）")
    style: Optional[str] = Field(None, description="图像风格: vivid 或 natural（可选）")


class VideoGenerationRequest(BaseModel):
    """视频生成请求模型（支持文生视频和图生视频）

    支持两种格式：
    1. OpenAI/七牛格式：使用 prompt 字段
    2. 火山引擎格式：使用 content 数组
    """
    config_id: str = Field(..., description="模型配置ID（必填）")

    # OpenAI/七牛格式字段
    prompt: Optional[str] = Field(None, description="视频生成提示词（OpenAI格式）")
    input_reference: Optional[str] = Field(None, description="参考图片URL（图生视频时使用）")
    seconds: Optional[str] = Field(None, description="视频时长（秒），如 '4'")
    size: Optional[str] = Field(None, description="视频尺寸，支持 1280x720 或 720x1280")

    # 火山引擎格式字段
    content: Optional[List[dict]] = Field(None, description="视频生成内容数组（火山引擎格式）")
    callback_url: Optional[str] = Field(None, description="回调通知地址（火山引擎格式）")
    return_last_frame: Optional[bool] = Field(None, description="是否返回尾帧图像（火山引擎格式）")


class VideoTaskQueryResponse(BaseModel):
    """视频任务查询响应"""
    id: str
    object: str
    model: str
    status: str
    created_at: int
    updated_at: int
    completed_at: Optional[int] = None
    expires_at: Optional[int] = None
    seconds: Optional[str] = None
    size: Optional[str] = None
    task_result: Optional[dict] = None
