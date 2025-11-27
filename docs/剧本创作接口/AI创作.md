这是一个完整的、开箱即用的代码方案。包含 **SQL表结构设计**、**LangChain 服务封装** 以及 **FastAPI 路由逻辑**（含完整的耗时统计和错误处理）。

### 目录结构规划
```text
src/
├── app/
│   ├── chat/
│   │   ├── __init__.py
│   │   └── model_chat.py      # LangChain 模型调用封装
│   ├── api/
│   │   ├── v3/
│   │   │   ├── __init__.py
│   │   │   └── chat.py        # 路由核心逻辑
```

---

### 第一部分：数据库设计 (SQL)

请在数据库中执行以下 SQL 语句，创建用于存储会话、消息、错误日志和请求耗时统计的表。

```sql
-- 1. 聊天会话表 (Chat Sessions)
-- 记录对话的基础配置和上下文
CREATE TABLE chat_sessions (
    session_id VARCHAR(255) PRIMARY KEY, -- 格式：UserUUID_13位时间戳
    user_id VARCHAR(255) NOT NULL,
    config_id VARCHAR(64) NOT NULL,      -- 关联的模型配置ID
    title VARCHAR(255) DEFAULT '新对话',
    model_name VARCHAR(128) NOT NULL,
    temperature FLOAT DEFAULT 0.7,
    is_thinking_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 聊天消息表 (Chat Messages)
-- 存储具体的对话内容 (User 和 Assistant)
CREATE TABLE chat_messages (
    message_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,           -- user, assistant, system
    content LONGTEXT NOT NULL,           -- 消息内容
    token_usage INT DEFAULT 0,           -- (预留) Token消耗
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 聊天请求任务表 (Chat Request Tasks)
-- 核心分析表：记录从接收请求到回复完成的完整时长
CREATE TABLE chat_request_tasks (
    task_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    config_id VARCHAR(64) NOT NULL,
    model_name VARCHAR(128),
    start_time TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3), -- 精确到毫秒
    end_time TIMESTAMP(3) NULL,                           -- 结束时间
    duration_ms INT DEFAULT 0,                            -- 完整耗时(ms)
    status VARCHAR(20) DEFAULT 'processing',              -- processing, success, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. 聊天错误日志表 (Chat Errors)
-- 记录异常堆栈，用于Debug
CREATE TABLE chat_errors (
    error_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255),
    user_id VARCHAR(255),
    config_id VARCHAR(64),
    error_message TEXT,
    stack_trace LONGTEXT,
    request_params TEXT,                 -- 当时的请求参数JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 第二部分：LangChain 服务封装

**文件位置:** `src/app/chat/model_chat.py`

```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from typing import List, Dict, Generator, Any

class ModelChatService:
    def __init__(
        self, 
        base_url: str, 
        api_key: str, 
        model_name: str, 
        temperature: float = 0.7,
        thinking_mode: bool = False
    ):
        """
        初始化 LangChain ChatOpenAI 实例
        """
        self.model_name = model_name
        self.thinking_mode = thinking_mode
        
        # 思考模式下，可能需要降低温度以保证逻辑严密性
        final_temp = max(0.1, temperature - 0.2) if thinking_mode else temperature

        self.llm = ChatOpenAI(
            base_url=base_url,
            api_key=api_key,
            model=model_name,
            temperature=final_temp,
            streaming=True  # 默认支持流式
        )

    def _prepare_messages(self, history: List[Dict[str, str]], current_query: str) -> List[Any]:
        """
        构建 LangChain 消息对象列表
        """
        messages = []
        
        # 1. 如果开启思考模式，注入系统提示词
        if self.thinking_mode:
            messages.append(SystemMessage(content="你现在处于深度思考模式。请一步步进行逻辑推理，并在回答前仔细验证你的结论。"))
        
        # 2. 转换历史记录
        for msg in history:
            if msg['role'] == 'user':
                messages.append(HumanMessage(content=msg['content']))
            elif msg['role'] == 'assistant':
                messages.append(AIMessage(content=msg['content']))
            elif msg['role'] == 'system':
                messages.append(SystemMessage(content=msg['content']))
        
        # 3. 添加当前用户提问
        messages.append(HumanMessage(content=current_query))
        return messages

    async def chat_stream(self, history: List[Dict], query: str) -> Generator:
        """
        流式对话生成器
        """
        messages = self._prepare_messages(history, query)
        async for chunk in self.llm.astream(messages):
            if chunk.content:
                yield chunk.content

    async def chat_invoke(self, history: List[Dict], query: str) -> str:
        """
        非流式直接对话
        """
        messages = self._prepare_messages(history, query)
        response = await self.llm.ainvoke(messages)
        return response.content
```

---

### 第三部分：路由逻辑实现 (API + 业务逻辑)

**文件位置:** `src/app/api/v3/chat.py`

此文件包含了完整的生命周期：接收请求 -> 创建任务记录 -> 调用LLM -> 存消息 -> 结束任务并计算耗时。

**注意**：代码中标记为 `# [TODO: DB]` 的部分是模拟数据库操作，你需要将其替换为你项目中实际使用的 ORM 代码（如 SQLAlchemy, Tortoise 等）。

```python
import time
import json
import traceback
import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# 引入 LangChain 服务
from src.app.chat.model_chat import ModelChatService

router = APIRouter(prefix="/v3/chat", tags=["LLM Chat"])

# --- 请求模型定义 ---
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    config_id: str = Field(..., description="从 v2/model_config/list 获取的 config_id")
    messages: List[ChatMessage] = Field(..., description="上下文消息列表")
    stream: bool = Field(default=True, description="是否流式输出")
    temperature: float = Field(default=0.7, description="随机性 (0-1)")
    thinking_mode: bool = Field(default=False, description="是否开启深度思考模式")
    session_id: Optional[str] = Field(None, description="继续对话时传入，新对话传空")

# --- [TODO: DB] 模拟数据库操作层 (请替换为实际SQL代码) ---

async def db_get_model_config(config_id: str):
    """根据ID获取模型配置信息"""
    # 模拟数据，实际应查询 `model_configs` 表
    mock_data = {
        "wm63405339065589127630": {
            "model_name": "Qwen/Qwen3-Coder-480B-A35B-Instruct",
            "base_url": "https://api-inference.modelscope.cn/v1",
            "api_key": "ms-2ecf5308-d03f-4f7c-b4c1-2fc7e789045f"
        }
    }
    return mock_data.get(config_id)

async def db_save_session(session_id: str, user_id: str, config_id: str, model_name: str, req: ChatRequest):
    """保存或更新 chat_sessions"""
    # SQL: INSERT INTO chat_sessions ... ON DUPLICATE KEY UPDATE updated_at=NOW()
    pass

async def db_save_message(session_id: str, role: str, content: str):
    """保存 chat_messages"""
    # SQL: INSERT INTO chat_messages (session_id, role, content) VALUES (...)
    pass

async def db_create_task(session_id: str, user_id: str, config_id: str, model_name: str) -> int:
    """创建请求任务记录，返回 task_id"""
    # SQL: INSERT INTO chat_request_tasks (..., start_time, status) VALUES (..., NOW(), 'processing')
    # RETURN last_insert_id()
    return int(time.time()) # 模拟返回 ID

async def db_update_task(task_id: int, status: str, start_time: float):
    """更新任务状态和耗时"""
    duration_ms = int((time.time() - start_time) * 1000)
    # SQL: UPDATE chat_request_tasks SET end_time=NOW(), duration_ms=duration_ms, status=status WHERE task_id=...
    print(f"--- [任务完成] TaskID: {task_id}, Status: {status}, Duration: {duration_ms}ms ---")

async def db_save_error(user_id: str, session_id: str, config_id: str, error: Exception, params: dict):
    """保存 chat_errors"""
    # SQL: INSERT INTO chat_errors ...
    print(f"!!! [发生错误] {str(error)} !!!")

# --- 辅助函数 ---

def generate_session_id(user_uuid: str) -> str:
    """生成 session_id: UserUUID + 13位时间戳"""
    timestamp = str(int(time.time() * 1000))
    return f"{user_uuid}_{timestamp}"

# --- 核心路由 ---

@router.post("/completions")
async def chat_completions(request: ChatRequest):
    # 1. 【计时开始】
    start_time = time.time()
    
    # 假设当前用户ID (实际应从Token获取)
    user_id = "u_1001" 
    
    # 初始化 ID
    session_id = request.session_id if request.session_id else generate_session_id(user_id)
    task_id = None

    try:
        # 2. 获取配置
        config = await db_get_model_config(request.config_id)
        if not config:
            raise HTTPException(status_code=404, detail="Config ID not found")

        # 3. 【创建任务日志】状态 processing
        task_id = await db_create_task(session_id, user_id, request.config_id, config['model_name'])

        # 4. 保存会话信息
        await db_save_session(session_id, user_id, request.config_id, config['model_name'], request)

        # 5. 准备对话数据
        if not request.messages:
            raise HTTPException(status_code=400, detail="Messages cannot be empty")
        
        # 提取历史和当前问题
        history = [msg.dict() for msg in request.messages[:-1]]
        query = request.messages[-1].content

        # 6. 保存用户提问
        await db_save_message(session_id, "user", query)

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
                        yield f"data: {json.dumps({'content': chunk})}\n\n"
                    
                    yield "data: [DONE]\n\n"

                    # 流结束：保存 AI 回复
                    await db_save_message(session_id, "assistant", full_response)
                    
                    # 8. 【计时结束 - 流式】更新任务表 (Success)
                    await db_update_task(task_id, "success", start_time)

                except Exception as e:
                    # 流中断错误处理
                    await db_save_error(user_id, session_id, request.config_id, e, request.dict())
                    await db_update_task(task_id, "failed", start_time)
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"

            return StreamingResponse(response_generator(), media_type="text/event-stream")

        # --- 分支 B: 非流式输出 ---
        else:
            try:
                # 获取完整回复
                response_text = await chat_service.chat_invoke(history, query)
                
                # 保存 AI 回复
                await db_save_message(session_id, "assistant", response_text)
                
                # 8. 【计时结束 - 普通】更新任务表 (Success)
                await db_update_task(task_id, "success", start_time)

                return {
                    "code": 200,
                    "msg": "success",
                    "data": {
                        "session_id": session_id,
                        "content": response_text
                    },
                    "meta": {
                        "duration_ms": int((time.time() - start_time) * 1000)
                    }
                }
            except Exception as e:
                raise e # 抛给外层 catch

    except Exception as e:
        # 全局异常处理
        error_msg = str(e)
        trace_info = traceback.format_exc()
        
        # 记录错误日志
        await db_save_error(user_id, session_id, request.config_id, e, request.dict())
        
        # 8. 【计时结束 - 异常】更新任务表 (Failed)
        if task_id:
            await db_update_task(task_id, "failed", start_time)
            
        raise HTTPException(status_code=500, detail=f"Chat Error: {error_msg}")
```