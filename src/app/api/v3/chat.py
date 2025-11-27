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
from app.models.chat import ChatSession, ChatMessage, ChatRequestTask, ChatError
from app.schemas.chat import ChatRequest, ChatResponse, SessionListResponse, MessageListResponse
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

    try:
        # 2. 获取配置
        config = await db_get_model_config(db, request.config_id, user_id)
        if not config:
            raise HTTPException(status_code=404, detail="Config ID not found or access denied")

        # 3. 【创建任务日志】状态 processing
        task_id = await db_create_task(db, session_id, user_id, request.config_id, config['model_name'])

        # 4. 保存会话信息
        await db_save_session(db, session_id, user_id, request.config_id, config['model_name'], request)

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
                    async for chunk in chat_service.chat_stream(history, query):
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
                    await db_save_error(db, user_id, session_id, request.config_id, e, request.dict())
                    await db_update_task(db, task_id, "failed", start_time)
                    yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"

            return StreamingResponse(response_generator(), media_type="text/event-stream")

        # --- 分支 B: 非流式输出 ---
        else:
            try:
                # 获取完整回复
                response_text = await chat_service.chat_invoke(history, query)

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
        await db_save_error(db, user_id, session_id, request.config_id, e, request.dict())

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
