这是一个非常好的提问。你原始的目录结构虽然直观，但在项目扩展、多人协作和长期维护上会遇到瓶颈（例如：API层混杂了业务逻辑、数据库与存储耦合不明、缺乏统一的配置管理等）。

作为一个架构师，我建议采用 **分层架构（Layered Architecture）**，配合 **FastAPI 最佳实践**。我们将项目分为：API 层（路由）、Service 层（业务逻辑）、Crud/Dal 层（数据访问）、Schema 层（数据模型/DTO）和 Core 层（核心配置）。

以下是为你重新规划的架构和代码实现。

---

### 1. 推荐的目录结构树

这个结构实现了**高内聚低耦合**：
*   **api/**: 只负责接收请求和返回响应。
*   **services/**: 处理复杂的业务逻辑（如调用 Minio, LLM, 组合数据库操作）。
*   **models/**: 定义数据库表结构。
*   **schemas/**: 定义前端交互的数据格式（Pydantic 模型）。

```text
project_root/
├── app/
│   ├── __init__.py
│   ├── main.py                # 项目入口，挂载路由，端口配置
│   ├── api/                   # 接口层（Controller）
│   │   ├── __init__.py
│   │   ├── deps.py            # 依赖注入（如获取当前用户）
│   │   └── v1/                # 版本控制
│   │       ├── __init__.py
│   │       ├── auth.py        # 认证相关接口
│   │       ├── llm.py         # LLM 对话接口
│   │       ├── script.py      # 剧本库与文件管理接口（整合了原 file.py 和 script.py）
│   │       └── media.py       # 图像与视频生成接口（整合 image.py, video.py）
│   ├── core/                  # 核心配置
│   │   ├── __init__.py
│   │   ├── config.py          # 环境变量加载 (.env)
│   │   ├── security.py        # JWT, 密码加密工具
│   │   └── database.py        # PostgreSQL 连接会话
│   ├── models/                # 数据库 ORM 模型 (SQLAlchemy)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── script.py          # 剧本库和文件表结构
│   ├── schemas/               # Pydantic 数据模型 (DTO)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── script.py
│   │   └── common.py          # 通用响应结构
│   ├── services/              # 业务逻辑层 (Service Layer)
│   │   ├── __init__.py
│   │   ├── minio_service.py   # Minio 操作封装
│   │   ├── llm_service.py     # LLM 调用封装
│   │   ├── ai_media_service.py# 图片/视频生成 API 封装
│   │   └── email_service.py   # 邮件发送/验证码逻辑
│   └── utils/                 # 工具类
│       └── prompt_loader.py   # 读取 Markdown 提示词
├── prompts/                   # 提示词文件
│   └── storyboard_script_prompts.md
├── .env                       # 环境变量
├── requirements.txt           # 依赖包
└── docker-compose.yml         # (可选) 快速启动 PG 和 Minio
```

---

### 2. 数据库模型设计 (PostgreSQL)

在 `app/models/` 下定义表结构。我们使用 SQLAlchemy。

**`app/models/user.py`**
```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

**`app/models/script.py`**
```python
from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class ScriptLibrary(Base):
    """剧本库（对应 Minio 中的一个文件夹概念）"""
    __tablename__ = "script_libraries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)  # 剧本库名称
    description = Column(String, nullable=True)
    minio_folder_path = Column(String, nullable=False) # 存储在Minio中的前缀路径
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    files = relationship("ScriptFile", back_populates="library", cascade="all, delete-orphan")

class ScriptFile(Base):
    """剧本库中的具体文件"""
    __tablename__ = "script_files"

    id = Column(Integer, primary_key=True, index=True)
    library_id = Column(Integer, ForeignKey("script_libraries.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_url = Column(String, nullable=True) # Minio 访问链接
    minio_object_key = Column(String, nullable=False) # Minio 中的完整 Key
    content_summary = Column(Text, nullable=True) # 剧本摘要或生成的内容
    file_type = Column(String, default="text") # text, image, video
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    library = relationship("ScriptLibrary", back_populates="files")
```

---

### 3. 核心配置与基础设施

**`.env`**
```ini
# App
PROJECT_NAME=AI_Script_Engine
API_PORT=7767
SECRET_KEY=change_this_super_secret_key_for_jwt


#PostgreSql
POSTGRESQL_DB=
POSTGRESQL_USER=
POSTGRESQL_PASSWORD=
POSTGRESQL_HOST=localhost
POSTGRESQL_PORT=5432

# Minio
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=script-libraries
MINIO_SECURE=False

# LLM
LLM_API_URL=https://api.openai.com/v1
LLM_API_KEY=sk-xxxxxx
LLM_MODEL_NAME=gpt-4
CONTEXT_TOKEN_LIMIT=4096

# External AI APIs (Keys)
JIMENG_API_KEY=xxx
QINIU_ACCESS_KEY=xxx
```

**`app/core/config.py`**
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Script Engine"
    API_PORT: int = 7767
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days

    DATABASE_URL: str
    
    # Minio
    MINIO_ENDPOINT: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_BUCKET_NAME: str
    MINIO_SECURE: bool = False

    # LLM
    LLM_API_URL: str
    LLM_API_KEY: str
    LLM_MODEL_NAME: str
    CONTEXT_TOKEN_LIMIT: int = 4096

    class Config:
        env_file = ".env"

settings = Settings()
```

---

### 4. 业务服务层 (Services)

这是解耦的关键，API 只调用 Service，不直接操作底层。

**`app/services/minio_service.py`**
```python
from minio import Minio
from app.core.config import settings
import io

class MinioService:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        self.bucket = settings.MINIO_BUCKET_NAME
        self._ensure_bucket()

    def _ensure_bucket(self):
        if not self.client.bucket_exists(self.bucket):
            self.client.make_bucket(self.bucket)

    def create_folder(self, folder_name: str):
        # Minio 没有真正的文件夹，通常是创建一个以 / 结尾的空对象，
        # 但这里我们不需要显式创建，只需要在上传文件时指定路径前缀即可。
        pass

    def upload_file(self, file_data: bytes, object_name: str, content_type: str):
        """上传文件到指定路径"""
        data_stream = io.BytesIO(file_data)
        self.client.put_object(
            self.bucket,
            object_name,
            data_stream,
            length=len(file_data),
            content_type=content_type
        )
        # 返回访问 URL（如果是私有桶，这里应该生成预签名 URL）
        return f"http://{settings.MINIO_ENDPOINT}/{self.bucket}/{object_name}"

    def delete_file(self, object_name: str):
        self.client.remove_object(self.bucket, object_name)

    def delete_folder(self, prefix: str):
        """删除文件夹（即删除该前缀下的所有文件）"""
        objects_to_delete = self.client.list_objects(self.bucket, prefix=prefix, recursive=True)
        for obj in objects_to_delete:
            self.client.remove_object(self.bucket, obj.object_name)

minio_client = MinioService()
```

**`app/services/llm_service.py`**
```python
import httpx
from app.core.config import settings
from app.utils.prompt_loader import load_prompt

class LLMService:
    async def chat_completion(self, message: str, system_prompt_file: str = None):
        system_content = "You are a helpful assistant."
        if system_prompt_file:
            # 读取 prompts/*.md
            system_content = load_prompt(system_prompt_file)
            
        payload = {
            "model": settings.LLM_MODEL_NAME,
            "messages": [
                {"role": "system", "content": system_content},
                {"role": "user", "content": message}
            ],
            "max_tokens": settings.CONTEXT_TOKEN_LIMIT
        }

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(
                    f"{settings.LLM_API_URL}/chat/completions",
                    headers={"Authorization": f"Bearer {settings.LLM_API_KEY}"},
                    json=payload,
                    timeout=60.0
                )
                resp.raise_for_status()
                return resp.json()["choices"][0]["message"]["content"]
            except Exception as e:
                print(f"LLM Error: {e}")
                raise e

llm_engine = LLMService()
```

---

### 5. API 接口层

将路由拆分，保持 Main 文件干净。

**`app/api/v1/script.py`**
```python
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.script import ScriptLibrary, ScriptFile
from app.schemas.script import LibraryCreate, LibraryResponse, FileResponse
from app.services.minio_service import minio_client
from sqlalchemy import select

router = APIRouter()

# --- 剧本库管理 ---

@router.post("/libraries", response_model=LibraryResponse)
async def create_library(
    library: LibraryCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # 定义 Minio 中的路径规则：user_id/library_name/
    folder_path = f"{current_user.id}/{library.name}/"
    
    new_lib = ScriptLibrary(
        user_id=current_user.id,
        name=library.name,
        description=library.description,
        minio_folder_path=folder_path
    )
    db.add(new_lib)
    await db.commit()
    await db.refresh(new_lib)
    return new_lib

@router.delete("/libraries/{lib_id}")
async def delete_library(
    lib_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ScriptLibrary).where(ScriptLibrary.id == lib_id, ScriptLibrary.user_id == current_user.id))
    lib = result.scalars().first()
    if not lib:
        raise HTTPException(status_code=404, detail="Library not found")

    # 1. 删除 Minio 中的对应文件夹（前缀下的所有文件）
    minio_client.delete_folder(lib.minio_folder_path)
    
    # 2. 删除数据库记录 (Cascade 会自动删除关联的 ScriptFile 记录，如果配置正确)
    await db.delete(lib)
    await db.commit()
    return {"msg": "Library and associated files deleted"}

# --- 文件管理 ---

@router.post("/libraries/{lib_id}/files", response_model=FileResponse)
async def upload_file_to_library(
    lib_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. 检查库是否存在
    result = await db.execute(select(ScriptLibrary).where(ScriptLibrary.id == lib_id))
    lib = result.scalars().first()
    if not lib:
        raise HTTPException(status_code=404, detail="Library not found")

    # 2. 上传到 Minio
    file_content = await file.read()
    object_key = f"{lib.minio_folder_path}{file.filename}"
    file_url = minio_client.upload_file(file_content, object_key, file.content_type)

    # 3. 写入数据库
    new_file = ScriptFile(
        library_id=lib.id,
        filename=file.filename,
        file_url=file_url,
        minio_object_key=object_key
    )
    db.add(new_file)
    await db.commit()
    await db.refresh(new_file)
    return new_file
```

**`app/api/v1/llm.py`**
```python
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.llm_service import llm_engine

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    use_script_prompt: bool = False

@router.post("/chat")
async def chat_with_llm(req: ChatRequest):
    prompt_file = "storyboard_script_prompts.md" if req.use_script_prompt else None
    response = await llm_engine.chat_completion(req.message, prompt_file)
    return {"reply": response}
```

---

### 6. 入口文件 Main.py

**`app/main.py`**
```python
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db

# 导入路由
from app.api.v1 import auth, llm, script, media

app = FastAPI(title=settings.PROJECT_NAME)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(llm.router, prefix="/api/v1/llm", tags=["LLM"])
app.include_router(script.router, prefix="/api/v1/script", tags=["Script & Files"])
# app.include_router(media.router, prefix="/api/v1/media", tags=["AI Media"])

@app.on_event("startup")
async def startup_event():
    # 初始化数据库表（开发环境使用，生产环境建议用 Alembic）
    await init_db()

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.API_PORT, reload=True)
```

---

### 7. 关键改进点总结 (为什么要这样改)

1.  **Minio 逻辑封装**: 你原来的设计中，Minio 操作分散在各个文件里。现在统一在 `services/minio_service.py`。当你需要更换存储（比如换成阿里云 OSS）时，只需要修改这一个文件，而不需要动 API 层的代码。
2.  **数据库与存储联动**: 在 `script.py` 接口中，我演示了删除数据库记录时，如何同步调用 Minio 删除文件。通过 `ScriptLibrary` 模型中的 `minio_folder_path` 字段，将业务 ID 和存储路径关联起来。
3.  **Prompts 管理**: 专门的 `utils/prompt_loader.py` 用来读取 md 文件，避免将长文本硬编码在 Python 代码中。
4.  **配置中心**: 所有的 URL、Key、端口都放在 `.env` 并通过 `config.py` 强类型读取，防止硬编码带来的安全隐患。
5.  **依赖注入**: 使用 FastAPI 的 `Depends` 注入数据库 Session 和当前用户 (`current_user`)，这是处理鉴权和数据库连接最优雅的方式。

你可以直接按照这个结构创建文件夹和文件，这是一个符合工业标准、易于维护的 Python 后端架构。