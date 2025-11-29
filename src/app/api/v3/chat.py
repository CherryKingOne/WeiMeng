import time
import json
import traceback
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.model_config import ModelConfig
from app.models.chat import ChatSession, ChatMessage, ChatRequestTask, ChatError, VideoTask
from app.schemas.chat import ChatRequest, ChatResponse, SessionListResponse, MessageListResponse, SetDefaultModelRequest, SetLibraryLocalModelRequest, ImageGenerationRequest, VideoGenerationRequest
from app.chat.model_chat import ModelChatService
from app.utils.encryption import decrypt_key

router = APIRouter()


# --- 辅助函数 ---

def generate_session_id(user_id: str) -> str:
    """生成 session_id: UserID_13位时间戳"""
    timestamp = str(int(time.time() * 1000))
    return f"{user_id}_{timestamp}"


async def db_get_model_config(db: AsyncSession, config_id: str, user_id: str) -> Optional[dict]:
    """根据ID获取模型配置信息"""
    result = await db.execute(
        select(ModelConfig).where(
            ModelConfig.id == config_id,
            ModelConfig.tenant_id == user_id,
            ModelConfig.is_deleted == False
        )
    )
    config = result.scalars().first()
    if not config:
        return None

    return {
        "model_name": config.model_name,
        "base_url": config.base_url,
        "api_key": decrypt_key(config.encrypted_api_key)
    }


async def db_save_session(
    db: AsyncSession,
    session_id: str,
    user_id: str,
    config_id: str,
    model_name: str,
    req: ChatRequest
):
    """保存或更新 chat_sessions"""
    result = await db.execute(
        select(ChatSession).where(ChatSession.session_id == session_id)
    )
    session = result.scalars().first()

    if session:
        # 更新现有会话
        session.updated_at = datetime.utcnow()
        session.temperature = req.temperature
        session.is_thinking_mode = req.thinking_mode
    else:
        # 创建新会话
        session = ChatSession(
            session_id=session_id,
            user_id=user_id,
            config_id=config_id,
            model_name=model_name,
            temperature=req.temperature,
            is_thinking_mode=req.thinking_mode
        )
        db.add(session)

    await db.commit()


async def db_save_message(db: AsyncSession, session_id: str, role: str, content: str):
    """保存 chat_messages"""
    message = ChatMessage(
        session_id=session_id,
        role=role,
        content=content
    )
    db.add(message)
    await db.commit()


async def db_create_task(
    db: AsyncSession,
    session_id: str,
    user_id: str,
    config_id: str,
    model_name: str
) -> int:
    """创建请求任务记录，返回 task_id"""
    task = ChatRequestTask(
        session_id=session_id,
        user_id=user_id,
        config_id=config_id,
        model_name=model_name,
        status='processing'
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task.task_id


async def db_update_task(db: AsyncSession, task_id: int, status: str, start_time: float):
    """更新任务状态和耗时"""
    duration_ms = int((time.time() - start_time) * 1000)

    result = await db.execute(
        select(ChatRequestTask).where(ChatRequestTask.task_id == task_id)
    )
    task = result.scalars().first()

    if task:
        task.end_time = datetime.utcnow()
        task.duration_ms = duration_ms
        task.status = status
        await db.commit()


async def db_save_error(
    db: AsyncSession,
    user_id: str,
    session_id: str,
    config_id: str,
    error: Exception,
    params: dict
):
    """保存 chat_errors"""
    error_log = ChatError(
        session_id=session_id,
        user_id=user_id,
        config_id=config_id,
        error_message=str(error),
        stack_trace=traceback.format_exc(),
        request_params=json.dumps(params, ensure_ascii=False)
    )
    db.add(error_log)
    await db.commit()


# --- 核心路由 ---

@router.post("/completions", response_model=ChatResponse)
async def chat_completions(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    AI聊天对话接口

    支持流式和非流式输出，自动记录会话、消息和任务耗时
    """
    # 1. 【计时开始】
    start_time = time.time()

    user_id = current_user.id

    # 初始化 ID
    session_id = request.session_id if request.session_id else generate_session_id(user_id)
    task_id = None
    config_id = None  # 初始化 config_id

    try:
        # 2. 获取配置（如果没有传config_id，使用用户的默认模型）
        config_id = request.config_id

        if not config_id:
            # 使用用户的默认LLM模型
            if not current_user.default_models or "LLM" not in current_user.default_models:
                raise HTTPException(
                    status_code=400,
                    detail="No config_id provided and no default LLM model set. Please set a default LLM model first."
                )
            config_id = current_user.default_models["LLM"]

        config = await db_get_model_config(db, config_id, user_id)
        if not config:
            raise HTTPException(status_code=404, detail="Config ID not found or access denied")

        # 3. 【创建任务日志】状态 processing
        task_id = await db_create_task(db, session_id, user_id, config_id, config['model_name'])

        # 4. 保存会话信息
        await db_save_session(db, session_id, user_id, config_id, config['model_name'], request)

        # 5. 准备对话数据
        if not request.messages:
            raise HTTPException(status_code=400, detail="Messages cannot be empty")

        # 提取历史和当前问题
        history = [{"role": msg.role, "content": msg.content} for msg in request.messages[:-1]]
        query = request.messages[-1].content

        # 6. 保存用户提问
        await db_save_message(db, session_id, "user", query)

        # 7. 初始化 LangChain 服务
        chat_service = ModelChatService(
            base_url=config['base_url'],
            api_key=config['api_key'],
            model_name=config['model_name'],
            temperature=request.temperature,
            thinking_mode=request.thinking_mode
        )

        # --- 分支 A: 流式输出 ---
        if request.stream:
            async def response_generator():
                full_response = ""
                try:
                    # 获取流
                    async for chunk in chat_service.chat_stream(history, query, request.system_prompt):
                        full_response += chunk
                        # SSE 格式推流
                        yield f"data: {json.dumps({'content': chunk}, ensure_ascii=False)}\n\n"

                    yield "data: [DONE]\n\n"

                    # 流结束：保存 AI 回复
                    await db_save_message(db, session_id, "assistant", full_response)

                    # 8. 【计时结束 - 流式】更新任务表 (Success)
                    await db_update_task(db, task_id, "success", start_time)

                except Exception as e:
                    # 流中断错误处理
                    await db_save_error(db, user_id, session_id, config_id, e, request.dict())
                    await db_update_task(db, task_id, "failed", start_time)
                    yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"

            return StreamingResponse(response_generator(), media_type="text/event-stream")

        # --- 分支 B: 非流式输出 ---
        else:
            try:
                # 获取完整回复
                response_text = await chat_service.chat_invoke(history, query, request.system_prompt)

                # 保存 AI 回复
                await db_save_message(db, session_id, "assistant", response_text)

                # 8. 【计时结束 - 普通】更新任务表 (Success)
                await db_update_task(db, task_id, "success", start_time)

                return ChatResponse(
                    code=200,
                    msg="success",
                    data={
                        "session_id": session_id,
                        "content": response_text
                    },
                    meta={
                        "duration_ms": int((time.time() - start_time) * 1000)
                    }
                )
            except Exception as e:
                raise e  # 抛给外层 catch

    except HTTPException:
        # 重新抛出 HTTP 异常
        raise
    except Exception as e:
        # 全局异常处理
        error_msg = str(e)

        # 记录错误日志
        await db_save_error(db, user_id, session_id, config_id or request.config_id, e, request.dict())

        # 8. 【计时结束 - 异常】更新任务表 (Failed)
        if task_id:
            await db_update_task(db, task_id, "failed", start_time)

        raise HTTPException(status_code=500, detail=f"Chat Error: {error_msg}")


@router.get("/sessions", response_model=ChatResponse)
async def get_sessions(
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取用户的会话列表"""
    from sqlalchemy import func, desc

    # 查询总数
    count_result = await db.execute(
        select(func.count(ChatSession.session_id)).where(ChatSession.user_id == current_user.id)
    )
    total = count_result.scalar()

    # 查询会话列表
    offset = (page - 1) * page_size
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .order_by(desc(ChatSession.updated_at))
        .offset(offset)
        .limit(page_size)
    )
    sessions = result.scalars().all()

    return ChatResponse(
        code=200,
        msg="success",
        data={
            "total": total,
            "sessions": [
                {
                    "session_id": s.session_id,
                    "title": s.title,
                    "model_name": s.model_name,
                    "created_at": s.created_at.isoformat(),
                    "updated_at": s.updated_at.isoformat()
                }
                for s in sessions
            ]
        }
    )


@router.get("/sessions/{session_id}/messages", response_model=ChatResponse)
async def get_session_messages(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取会话的消息历史"""
    # 验证会话所有权
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.session_id == session_id,
            ChatSession.user_id == current_user.id
        )
    )
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 查询消息
    messages_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    messages = messages_result.scalars().all()

    return ChatResponse(
        code=200,
        msg="success",
        data={
            "session_id": session_id,
            "messages": [
                {
                    "message_id": m.message_id,
                    "role": m.role,
                    "content": m.content,
                    "created_at": m.created_at.isoformat()
                }
                for m in messages
            ]
        }
    )


@router.delete("/sessions/{session_id}", response_model=ChatResponse)
async def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """删除会话（级联删除所有消息）"""
    # 验证会话所有权
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.session_id == session_id,
            ChatSession.user_id == current_user.id
        )
    )
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    await db.delete(session)
    await db.commit()

    return ChatResponse(
        code=200,
        msg="Session deleted successfully",
        data={"session_id": session_id}
    )


@router.post("/default-model", response_model=ChatResponse)
async def set_default_model(
    request: SetDefaultModelRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    设置指定类型的默认模型

    Args:
        request: 设置默认模型请求体
    """
    # 验证模型配置是否存在且属于当前用户
    result = await db.execute(
        select(ModelConfig).where(
            ModelConfig.id == request.config_id,
            ModelConfig.tenant_id == current_user.id,
            ModelConfig.is_deleted == False
        )
    )
    config = result.scalars().first()

    if not config:
        raise HTTPException(status_code=404, detail="Model config not found")

    # 使用模型配置中的类型，如果没有传入model_type
    target_model_type = request.model_type or config.model_type

    # 初始化或更新用户的默认模型配置
    if current_user.default_models is None:
        current_user.default_models = {}

    current_user.default_models[target_model_type] = request.config_id

    # 标记字段已修改（SQLAlchemy需要这样才能检测到JSONB的变化）
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(current_user, "default_models")

    await db.commit()

    return ChatResponse(
        code=200,
        msg="Default model set successfully",
        data={
            "config_id": request.config_id,
            "model_name": config.model_name,
            "model_type": target_model_type
        }
    )


@router.get("/default-model", response_model=ChatResponse)
async def get_default_model(
    config_id: Optional[str] = None,
    model_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    查看当前设置的默认模型

    Args:
        config_id: 模型配置ID（可选），查询该配置是否被设置为某个类型的默认模型
        model_type: 模型类型（可选），查询该类型的默认模型

    注意：
        - 如果同时传入 config_id 和 model_type，优先使用 config_id
        - 如果都不传，返回所有类型的默认模型
    """
    # 情况1: 通过 config_id 查询
    if config_id:
        if not current_user.default_models:
            return ChatResponse(
                code=200,
                msg="No default model set",
                data=None
            )

        # 查找该 config_id 被设置为哪些类型的默认模型
        matched_types = []
        for m_type, c_id in current_user.default_models.items():
            if c_id == config_id:
                matched_types.append(m_type)

        if not matched_types:
            return ChatResponse(
                code=200,
                msg=f"Config ID {config_id} is not set as default for any model type",
                data=None
            )

        # 查询模型配置详情
        result = await db.execute(
            select(ModelConfig).where(
                ModelConfig.id == config_id,
                ModelConfig.tenant_id == current_user.id,
                ModelConfig.is_deleted == False
            )
        )
        config = result.scalars().first()

        if not config:
            return ChatResponse(
                code=200,
                msg="Model config not found or deleted",
                data=None
            )

        return ChatResponse(
            code=200,
            msg="success",
            data={
                "config_id": config.id,
                "model_name": config.model_name,
                "model_type": config.model_type,
                "base_url": config.base_url,
                "description": config.description,
                "default_for_types": matched_types,  # 该模型被设置为哪些类型的默认模型
                "created_at": config.created_at.isoformat(),
                "updated_at": config.updated_at.isoformat()
            }
        )

    # 情况2: 通过 model_type 查询
    if model_type:
        if not current_user.default_models:
            return ChatResponse(
                code=200,
                msg="No default model set",
                data=None
            )

        config_id = current_user.default_models.get(model_type)
        if not config_id:
            return ChatResponse(
                code=200,
                msg=f"No default model set for type: {model_type}",
                data=None
            )

        # 查询模型配置
        result = await db.execute(
            select(ModelConfig).where(
                ModelConfig.id == config_id,
                ModelConfig.tenant_id == current_user.id,
                ModelConfig.is_deleted == False
            )
        )
        config = result.scalars().first()

        if not config:
            return ChatResponse(
                code=200,
                msg="Default model not found or deleted",
                data=None
            )

        return ChatResponse(
            code=200,
            msg="success",
            data={
                "model_type": model_type,
                "config_id": config.id,
                "model_name": config.model_name,
                "base_url": config.base_url,
                "description": config.description,
                "created_at": config.created_at.isoformat(),
                "updated_at": config.updated_at.isoformat()
            }
        )

    # 情况3: 都不传，返回所有类型的默认模型
    if not current_user.default_models:
        return ChatResponse(
            code=200,
            msg="No default model set",
            data=None
        )

    default_models_info = {}
    for m_type, c_id in current_user.default_models.items():
        result = await db.execute(
            select(ModelConfig).where(
                ModelConfig.id == c_id,
                ModelConfig.tenant_id == current_user.id,
                ModelConfig.is_deleted == False
            )
        )
        config = result.scalars().first()

        if config:
            default_models_info[m_type] = {
                "config_id": config.id,
                "model_name": config.model_name,
                "base_url": config.base_url,
                "description": config.description,
                "created_at": config.created_at.isoformat(),
                "updated_at": config.updated_at.isoformat()
            }

    return ChatResponse(
        code=200,
        msg="success",
        data=default_models_info
    )


# --- Script Library Local Model Configuration ---

@router.post("/libraries/{library_id}/local-model", response_model=ChatResponse)
async def set_library_local_model(
    library_id: int,
    request: SetLibraryLocalModelRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    设置剧本库的局部模型配置

    Args:
        library_id: 剧本库ID（路径参数）
        request: 请求体，包含config_id（必填）和model_type（可选）

    说明：
        - 局部模型配置优先级高于全局默认模型
        - 如果设置了局部模型，该剧本库将使用指定的模型
        - 如果未设置局部模型，将使用用户的全局默认模型
        - model_type为可选参数，可用于验证模型类型是否匹配
    """
    from app.models.script import ScriptLibrary

    # 验证剧本库是否存在且属于当前用户
    result = await db.execute(
        select(ScriptLibrary).where(
            ScriptLibrary.id == library_id,
            ScriptLibrary.user_id == current_user.id
        )
    )
    library = result.scalars().first()

    if not library:
        raise HTTPException(status_code=404, detail="Script library not found")

    # 验证模型配置是否存在且属于当前用户
    config_result = await db.execute(
        select(ModelConfig).where(
            ModelConfig.id == request.config_id,
            ModelConfig.tenant_id == current_user.id,
            ModelConfig.is_deleted == False
        )
    )
    config = config_result.scalars().first()

    if not config:
        raise HTTPException(status_code=404, detail="Model config not found")

    # 如果传入了model_type，验证是否匹配
    if request.model_type and config.model_type != request.model_type:
        raise HTTPException(
            status_code=400,
            detail=f"Model type mismatch: expected {request.model_type}, but config has {config.model_type}"
        )

    # 设置局部模型配置
    library.local_model_config_id = request.config_id
    await db.commit()

    return ChatResponse(
        code=200,
        msg="Local model set successfully",
        data={
            "library_id": library_id,
            "library_name": library.name,
            "config_id": request.config_id,
            "model_name": config.model_name,
            "model_type": config.model_type
        }
    )


@router.delete("/libraries/{library_id}/local-model", response_model=ChatResponse)
async def remove_library_local_model(
    library_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    移除剧本库的局部模型配置，恢复使用全局默认模型

    Args:
        library_id: 剧本库ID
    """
    from app.models.script import ScriptLibrary

    # 验证剧本库是否存在且属于当前用户
    result = await db.execute(
        select(ScriptLibrary).where(
            ScriptLibrary.id == library_id,
            ScriptLibrary.user_id == current_user.id
        )
    )
    library = result.scalars().first()

    if not library:
        raise HTTPException(status_code=404, detail="Script library not found")

    # 移除局部模型配置
    library.local_model_config_id = None
    await db.commit()

    return ChatResponse(
        code=200,
        msg="Local model removed successfully, will use global default model",
        data={
            "library_id": library_id,
            "library_name": library.name
        }
    )


@router.get("/libraries/{library_id}/effective-model", response_model=ChatResponse)
async def get_library_effective_model(
    library_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    查看剧本库实际使用的模型配置

    Args:
        library_id: 剧本库ID

    说明：
        - 如果剧本库设置了局部模型，返回局部模型信息
        - 如果未设置局部模型，返回用户的全局默认LLM模型信息
        - 优先级：局部模型 > 全局默认模型
    """
    from app.models.script import ScriptLibrary

    # 验证剧本库是否存在且属于当前用户
    result = await db.execute(
        select(ScriptLibrary).where(
            ScriptLibrary.id == library_id,
            ScriptLibrary.user_id == current_user.id
        )
    )
    library = result.scalars().first()

    if not library:
        raise HTTPException(status_code=404, detail="Script library not found")

    # 优先使用局部模型配置
    if library.local_model_config_id:
        config_result = await db.execute(
            select(ModelConfig).where(
                ModelConfig.id == library.local_model_config_id,
                ModelConfig.tenant_id == current_user.id,
                ModelConfig.is_deleted == False
            )
        )
        config = config_result.scalars().first()

        if config:
            return ChatResponse(
                code=200,
                msg="success",
                data={
                    "library_id": library_id,
                    "library_name": library.name,
                    "model_source": "local",  # 局部配置
                    "config_id": config.id,
                    "model_name": config.model_name,
                    "model_type": config.model_type,
                    "base_url": config.base_url,
                    "description": config.description
                }
            )

    # 如果没有局部配置或局部配置已删除，使用全局默认LLM模型
    if current_user.default_models and "LLM" in current_user.default_models:
        global_config_id = current_user.default_models["LLM"]
        config_result = await db.execute(
            select(ModelConfig).where(
                ModelConfig.id == global_config_id,
                ModelConfig.tenant_id == current_user.id,
                ModelConfig.is_deleted == False
            )
        )
        config = config_result.scalars().first()

        if config:
            return ChatResponse(
                code=200,
                msg="success",
                data={
                    "library_id": library_id,
                    "library_name": library.name,
                    "model_source": "global",  # 全局默认
                    "config_id": config.id,
                    "model_name": config.model_name,
                    "model_type": config.model_type,
                    "base_url": config.base_url,
                    "description": config.description
                }
            )

    # 既没有局部配置，也没有全局默认模型
    return ChatResponse(
        code=200,
        msg="No model configured",
        data={
            "library_id": library_id,
            "library_name": library.name,
            "model_source": "none",
            "config_id": None,
            "model_name": None
        }
    )


# --- Image Generation ---

@router.post("/images/generations", response_model=ChatResponse)
async def generate_image(
    request: ImageGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    文生图接口 - 根据文本提示词生成图像

    需要指定图像生成模型配置ID（config_id必填）
    """
    import httpx

    start_time = time.time()
    config_id = request.config_id

    try:
        # 获取模型配置
        config = await db_get_model_config(db, config_id, current_user.id)
        if not config:
            raise HTTPException(status_code=404, detail="Config ID not found or access denied")

        # 验证模型类型
        result = await db.execute(
            select(ModelConfig).where(
                ModelConfig.id == config_id,
                ModelConfig.tenant_id == current_user.id,
                ModelConfig.is_deleted == False
            )
        )
        model_config = result.scalars().first()

        if model_config and model_config.model_type != "IMAGE_GENERATION":
            raise HTTPException(
                status_code=400,
                detail=f"Model type mismatch: expected IMAGE_GENERATION, but got {model_config.model_type}"
            )

        # 构建请求参数
        # 如果 base_url 已经包含完整路径，直接使用；否则添加 /images/generations
        base_url = config['base_url'].rstrip('/')
        if base_url.endswith('/images/generations'):
            api_url = base_url
        else:
            api_url = f"{base_url}/images/generations"

        headers = {
            "Authorization": f"Bearer {config['api_key']}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": config['model_name'],
            "prompt": request.prompt
        }

        # 只添加非空的可选参数
        if request.size is not None:
            payload["size"] = request.size
        if request.n is not None:
            payload["n"] = request.n
        if request.quality is not None:
            payload["quality"] = request.quality
        if request.style is not None:
            payload["style"] = request.style

        # 调用图像生成API
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(api_url, json=payload, headers=headers)
            response.raise_for_status()
            result_data = response.json()

        duration_ms = int((time.time() - start_time) * 1000)

        return ChatResponse(
            code=200,
            msg="Image generated successfully",
            data={
                "images": result_data.get("data", []),
                "model": config['model_name'],
                "prompt": request.prompt,
                "size": request.size
            },
            meta={
                "duration_ms": duration_ms
            }
        )

    except httpx.HTTPStatusError as e:
        error_detail = e.response.text if hasattr(e.response, 'text') else str(e)
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Image generation API error: {error_detail}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Request error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Image generation error: {str(e)}"
        )


# --- Video Generation ---

@router.post("/videos", response_model=ChatResponse)
async def generate_video(
    request: VideoGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    视频生成接口 - 支持文生视频和图生视频

    文生视频：只需提供 prompt
    图生视频：需要提供 prompt 和 input_reference（参考图片URL）

    注意：
    - size 只支持 1280x720 或 720x1280
    - 如果图片尺寸与输出视频尺寸不匹配会报错
    """
    import httpx

    start_time = time.time()
    config_id = request.config_id

    try:
        # 获取模型配置
        config = await db_get_model_config(db, config_id, current_user.id)
        if not config:
            raise HTTPException(status_code=404, detail="Config ID not found or access denied")

        # 验证模型类型
        result = await db.execute(
            select(ModelConfig).where(
                ModelConfig.id == config_id,
                ModelConfig.tenant_id == current_user.id,
                ModelConfig.is_deleted == False
            )
        )
        model_config = result.scalars().first()

        if model_config and model_config.model_type != "VIDEO_GENERATION":
            raise HTTPException(
                status_code=400,
                detail=f"Model type mismatch: expected VIDEO_GENERATION, but got {model_config.model_type}"
            )

        # 根据 base_url 判断使用哪种 API 格式
        base_url = config['base_url'].rstrip('/')
        is_volcengine_api = '/api/v3/contents/generations/tasks' in base_url

        # 构建请求 URL
        if is_volcengine_api:
            # 火山引擎 API
            api_url = base_url
        else:
            # OpenAI/七牛 API
            if base_url.endswith('/videos'):
                api_url = base_url
            else:
                api_url = f"{base_url}/videos"

        headers = {
            "Authorization": f"Bearer {config['api_key']}",
            "Content-Type": "application/json"
        }

        # 构建请求体
        if is_volcengine_api:
            # 火山引擎格式：必须使用 content 数组
            if request.content:
                # 用户提供了 content 数组
                payload = {
                    "model": config['model_name'],
                    "content": request.content
                }
                # 用于保存到数据库的 prompt（从 content 中提取）
                prompt_for_db = ""
                for item in request.content:
                    if item.get("type") == "text":
                        prompt_for_db = item.get("text", "")
                        break
            elif request.prompt:
                # 用户提供了 prompt，自动转换为 content 格式
                content_array = [{"type": "text", "text": request.prompt}]
                # 如果有图片参考，添加到 content
                if request.input_reference:
                    content_array.append({
                        "type": "image_url",
                        "image_url": {"url": request.input_reference}
                    })
                payload = {
                    "model": config['model_name'],
                    "content": content_array
                }
                prompt_for_db = request.prompt
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Either 'prompt' or 'content' is required for Volcengine API"
                )

            # 添加火山引擎可选参数
            if request.callback_url:
                payload["callback_url"] = request.callback_url
            if request.return_last_frame is not None:
                payload["return_last_frame"] = request.return_last_frame
        else:
            # OpenAI/七牛格式
            if not request.prompt:
                raise HTTPException(
                    status_code=400,
                    detail="prompt is required for OpenAI/Qiniu format"
                )

            payload = {
                "model": config['model_name'],
                "prompt": request.prompt
            }

            # 添加 OpenAI/七牛可选参数
            if request.input_reference:
                payload["input_reference"] = request.input_reference
            if request.seconds:
                payload["seconds"] = request.seconds
            if request.size:
                # 验证尺寸格式
                if request.size not in ["1280x720", "720x1280"]:
                    raise HTTPException(
                        status_code=400,
                        detail="Size must be either 1280x720 or 720x1280"
                    )
                payload["size"] = request.size

            prompt_for_db = request.prompt

        # 调用视频生成API
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(api_url, json=payload, headers=headers)
            response.raise_for_status()
            result_data = response.json()

        # 保存任务信息到数据库
        task_id = result_data.get("id")
        if task_id:
            video_task = VideoTask(
                task_id=task_id,
                user_id=current_user.id,
                config_id=config_id,
                model_name=config['model_name'],
                prompt=prompt_for_db,
                status=result_data.get("status", "queued")
            )
            db.add(video_task)
            await db.commit()

        duration_ms = int((time.time() - start_time) * 1000)

        return ChatResponse(
            code=200,
            msg="Video generation task created successfully",
            data={
                "task_id": result_data.get("id"),
                "status": result_data.get("status"),
                "model": result_data.get("model"),
                "created_at": result_data.get("created_at"),
                "updated_at": result_data.get("updated_at"),
                "object": result_data.get("object")
            },
            meta={
                "duration_ms": duration_ms,
                "note": "Use GET /videos/{task_id} to query task status"
            }
        )

    except httpx.HTTPStatusError as e:
        error_detail = e.response.text if hasattr(e.response, 'text') else str(e)
        # 检查是否是图片尺寸不匹配的错误
        if "尺寸" in error_detail or "size" in error_detail.lower() or "dimension" in error_detail.lower():
            print(f"[ERROR] Image size mismatch with video output size: {error_detail}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Video generation API error: {error_detail}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Request error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Video generation error: {str(e)}"
        )


@router.get("/videos/{task_id}", response_model=ChatResponse)
async def query_video_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    查询视频生成任务状态

    参数：
    - task_id: 视频任务ID（路径参数），即创建任务时返回的 id

    状态说明：
    - queued: 排队中
    - in_progress: 处理中
    - completed: 已完成（会返回视频URL）
    - failed: 失败

    注意：返回的视频URL字段可能是 url、video_url 等不同名称
    """
    import httpx

    try:
        # 从数据库查询任务信息，获取对应的 config_id
        result = await db.execute(
            select(VideoTask).where(
                VideoTask.task_id == task_id,
                VideoTask.user_id == current_user.id
            )
        )
        video_task = result.scalars().first()

        if not video_task:
            raise HTTPException(
                status_code=404,
                detail="Video task not found or access denied"
            )

        # 获取模型配置
        config = await db_get_model_config(db, video_task.config_id, current_user.id)
        if not config:
            raise HTTPException(status_code=404, detail="Video model config not found or access denied")

        # 构建查询URL - 自动判断是火山引擎还是 OpenAI/七牛格式
        base_url = config['base_url'].rstrip('/')

        # 判断是否为火山引擎格式（包含 /api/v3/contents/generations/tasks）
        if '/api/v3/contents/generations/tasks' in base_url:
            # 火山引擎格式
            api_url = f"{base_url}/{task_id}"
        elif base_url.endswith('/videos'):
            # OpenAI/七牛格式（已包含 /videos）
            api_url = f"{base_url}/{task_id}"
        else:
            # OpenAI/七牛格式（需要添加 /videos）
            api_url = f"{base_url}/videos/{task_id}"

        headers = {
            "Authorization": f"Bearer {config['api_key']}"
        }

        # 查询任务状态
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(api_url, headers=headers)
            response.raise_for_status()
            result_data = response.json()

        # 更新数据库中的任务状态
        current_status = result_data.get("status")
        if current_status and current_status != video_task.status:
            video_task.status = current_status
            await db.commit()

        # 处理返回数据，兼容不同的 API 格式
        # 1. OpenAI/七牛格式：使用 task_result.videos
        # 2. 火山引擎格式：使用 content.video_url

        task_result = None
        content = result_data.get("content")

        # 检查是否为火山引擎格式（有 content 字段）
        if content and isinstance(content, dict):
            # 火山引擎格式：转换为统一的 task_result 格式
            video_url = content.get("video_url")
            if video_url:
                task_result = {
                    "videos": [{
                        "id": result_data.get("id"),
                        "url": video_url,
                        "video_url": video_url,
                        "duration": result_data.get("duration"),
                        "resolution": result_data.get("resolution"),
                        "ratio": result_data.get("ratio")
                    }]
                }
        else:
            # OpenAI/七牛格式：使用原有的 task_result
            task_result = result_data.get("task_result")
            if task_result and "videos" in task_result:
                # 标准化视频URL字段，确保 url 和 video_url 都存在且有值
                for video in task_result["videos"]:
                    # 获取实际的视频URL（优先使用url，其次video_url）
                    actual_url = video.get("url") or video.get("video_url")

                    if actual_url:
                        # 确保两个字段都有值
                        video["url"] = actual_url
                        video["video_url"] = actual_url

        return ChatResponse(
            code=200,
            msg="success",
            data={
                "id": result_data.get("id"),
                "object": result_data.get("object"),
                "model": result_data.get("model"),
                "status": result_data.get("status"),
                "created_at": result_data.get("created_at"),
                "updated_at": result_data.get("updated_at"),
                "completed_at": result_data.get("completed_at"),
                "expires_at": result_data.get("expires_at"),
                "seconds": result_data.get("seconds"),
                "duration": result_data.get("duration"),
                "size": result_data.get("size"),
                "resolution": result_data.get("resolution"),
                "ratio": result_data.get("ratio"),
                "task_result": task_result,
                "error": result_data.get("error")  # 火山引擎失败时的错误信息
            }
        )

    except httpx.HTTPStatusError as e:
        error_detail = e.response.text if hasattr(e.response, 'text') else str(e)
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Video task query API error: {error_detail}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Request error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Video task query error: {str(e)}"
        )
