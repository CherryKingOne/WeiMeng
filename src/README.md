# AI Script Engine - WeiMeng Backend

一个基于 FastAPI 构建的 AI 短剧脚本生成引擎后端服务。

## 功能特性

- 🔐 **用户认证**: JWT 令牌认证系统
- 💬 **LLM 集成**: 支持调用 LLM API 进行剧本生成和对话
- 📚 **剧本库管理**: 完整的剧本和文件管理系统
- 🗄️ **MinIO 存储**: 文件对象存储集成
- 🎬 **AI 媒体生成**: 图像和视频生成接口(待实现)

## 项目结构

```
src/
├── app/
│   ├── api/                   # API 路由层
│   │   ├── deps.py            # 依赖注入
│   │   └── v1/                # API v1 版本
│   │       ├── auth.py        # 认证接口
│   │       ├── llm.py         # LLM 对话接口
│   │       ├── script.py      # 剧本管理接口
│   │       └── media.py       # 媒体生成接口
│   ├── core/                  # 核心配置
│   │   ├── config.py          # 环境配置
│   │   ├── database.py        # 数据库连接
│   │   └── security.py        # 安全工具(JWT, 密码)
│   ├── models/                # 数据库模型
│   │   ├── user.py            # 用户模型
│   │   └── script.py          # 剧本模型
│   ├── schemas/               # Pydantic 数据模式
│   │   ├── user.py
│   │   ├── script.py
│   │   └── common.py
│   ├── services/              # 业务逻辑层
│   │   ├── minio_service.py   # MinIO 服务
│   │   ├── llm_service.py     # LLM 服务
│   │   ├── ai_media_service.py# AI 媒体生成
│   │   └── email_service.py   # 邮件服务
│   ├── utils/                 # 工具类
│   │   └── prompt_loader.py   # 提示词加载器
│   └── main.py                # FastAPI 应用入口
├── prompts/                   # 提示词文件
│   └── 分镜头脚本生成提示词.md
├── .env                       # 环境变量配置
├── requirements.txt           # Python 依赖
├── docker-compose.yml         # Docker 编排
└── main.py                    # 应用启动入口
```

## 快速开始

### 1. 环境准备

确保已安装:
- Python 3.9+
- PostgreSQL 15+
- MinIO (或通过 Docker)

### 2. 安装依赖

```bash
cd src
pip install -r requirements.txt
```

### 3. 配置环境变量

编辑 `.env` 文件,配置数据库和服务密钥:

```ini
# 应用配置
PROJECT_NAME=AI_Script_Engine
API_PORT=7767
SECRET_KEY=your-secret-key-here

# PostgreSQL 数据库
POSTGRESQL_DB=weimeng
POSTGRESQL_USER=postgres
POSTGRESQL_PASSWORD=your_password
POSTGRESQL_HOST=localhost
POSTGRESQL_PORT=5432

# MinIO 对象存储
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=weimeng
MINIO_SECRET_KEY=weimeng.
MINIO_BUCKET_NAME=script-libraries

# LLM API
LLM_API_URL=https://api.openai.com/v1
LLM_API_KEY=your-llm-api-key
LLM_MODEL_NAME=gpt-4
```

### 4. 启动数据库服务 (使用 Docker)

```bash
docker-compose up -d
```

这将启动:
- PostgreSQL 数据库 (端口 5432)
- MinIO 对象存储 (端口 9000, 管理界面 9001)

### 5. 运行应用

```bash
python main.py
```

或使用 uvicorn:

```bash
uvicorn app.main:app --reload --port 7767
```

服务将在 `http://localhost:7767` 启动

## API 文档

启动服务后,访问:

- **Swagger UI**: http://localhost:7767/docs
- **ReDoc**: http://localhost:7767/redoc

## 主要 API 端点

### 认证
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `GET /api/v1/auth/me` - 获取当前用户信息

### LLM 对话
- `POST /api/v1/llm/chat` - 与 LLM 对话

### 剧本管理
- `POST /api/v1/script/libraries` - 创建剧本库
- `GET /api/v1/script/libraries` - 获取剧本库列表
- `POST /api/v1/script/libraries/{lib_id}/files` - 上传文件
- `DELETE /api/v1/script/libraries/{lib_id}` - 删除剧本库

### AI 媒体
- `POST /api/v1/media/generate/image` - 生成图像 (待实现)
- `POST /api/v1/media/generate/video` - 生成视频 (待实现)

## 开发说明

### 数据库迁移

首次运行时,应用会自动创建数据库表。如需使用 Alembic 进行迁移管理:

```bash
# 初始化 Alembic
alembic init alembic

# 生成迁移
alembic revision --autogenerate -m "Initial migration"

# 执行迁移
alembic upgrade head
```

### 添加新的提示词

在 `prompts/` 目录下创建 `.md` 文件,然后在 LLM API 调用时指定文件名。

## License

MIT
