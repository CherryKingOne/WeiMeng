<div align="center">
  <img src="docs/image/logo.png" alt="WeiMeng Logo" width="200"/>
  <p>
    <strong>面向自动化视频制作的多 Agent 协作系统</strong>
  </p>
  <p>
    <strong>中文文档</strong> | <a href="README.md">English</a>
  </p>
</div>

---

## 简介

WeiMeng 是一个基于大语言模型（LLM）的智能多 Agent 协作系统，旨在实现视频制作工作流的自动化。系统采用 LangChain + LangGraph 构建，基于模块化架构设计，填补了概念级多 Agent 设计与工程级系统实现之间的空白。

**核心设计原则：**
- **统一入口**：用户通过统一接口与系统交互
- **集中式调度**：所有 Agent 通过调度中枢协调，避免点对点直接通信
- **任务至上**：任务是第一公民，Agent 是执行者
- **状态可溯**：任务状态完全可追踪、可中断、可回滚

## 技术栈

### 后端
- **框架**：FastAPI + Python 3.10+
- **架构**：模块化架构，分层职责清晰（API -> application -> domain -> infrastructure）
- **数据库**：PostgreSQL + SQLAlchemy 2.0 异步支持
- **缓存**：Redis 会话管理与缓存
- **AI 集成**：LangChain、LangGraph、LangFuse、OpenAI

### 前端
- **框架**：Next.js 16.1 + React 19
- **语言**：TypeScript
- **样式**：Tailwind CSS 4
- **状态管理**：Zustand

## 快速开始

### 环境要求
- Docker & Docker Compose
- Node.js 18+（本地开发）
- Python 3.10+（本地开发）

### Docker 部署

```bash
# 克隆项目
git clone https://github.com/your-repo/WeiMeng-Agent.git
cd WeiMeng-Agent

# 配置环境变量
cd docker
cp .env.example .env
# 编辑 .env 文件，配置必要的环境变量

# 启动所有服务
docker compose up -d

# 查看日志
docker compose logs -f
```

服务启动后：
- 前端访问：http://localhost:5678
- 后端 API：http://localhost:5607
- API 文档：http://localhost:5607/docs

### 本地开发

**后端：**
```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env

# 启动开发服务器
python main.py
```

**前端：**
```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 系统架构

### 核心组件

- **调度中枢（Central Dispatcher）**
  - 系统"总控"
  - 统一接收用户请求
  - 协调各模块工作

- **任务规划器（Task Orchestrator）**
  - 系统"中枢神经"
  - 拆任务、派任务、收结果、记状态
  - 所有 Agent 的任务都从这里来

- **执行型 Agent（Execution Agents）**
  - 分镜师 / 艺术总监 / 动画剪辑
  - 只关心"我这一步要做什么"
  - 不感知用户存在

- **任务状态存储（Task State Store）**
  - 任务生命周期与状态机
  - 支持中断、失败、重试

### 7-Agent 团队架构

系统包含 7 个专业 Agent 协同工作：

| Agent | 职责 |
|-------|------|
| 编剧 Agent | 剧本创作与内容规划 |
| 导演 Agent | 整体创意把控与协调 |
| 分镜师 Agent | 镜头设计与画面构图 |
| 场景设计 Agent | 场景搭建与环境设计 |
| 角色设计 Agent | 角色形象与造型设计 |
| 美术设计 Agent | 视觉风格与色彩把控 |
| 剪辑师 Agent | 后期剪辑与特效处理 |

## 项目结构

```
WeiMeng-Agent/
├── backend/                    # 后端源代码
│   ├── src/
│   │   ├── modules/            # 业务模块
│   │   │   ├── agent/          # Agent 核心模块
│   │   │   ├── auth/           # 认证模块
│   │   │   └── captcha/        # 验证码模块
│   │   ├── shared/             # 共享基础设施
│   │   │   ├── domain/         # 领域基类
│   │   │   ├── infrastructure/ # 基础设施（数据库、Redis）
│   │   │   ├── security/       # 安全组件（JWT、密码）
│   │   │   ├── middleware/     # 中间件
│   │   │   └── extensions/     # 扩展（邮件服务）
│   │   └── api/                # API 路由
│   ├── config/                 # 配置文件
│   ├── tests/                  # 测试代码
│   └── main.py                 # 应用入口
│
├── frontend/                   # 前端源代码
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 认证页面（登录、注册）
│   │   ├── (dashboard)/        # 仪表盘页面
│   │   └── workflow-editor/    # 工作流编辑器
│   ├── components/
│   │   ├── features/           # 业务组件
│   │   ├── layout/             # 布局组件
│   │   └── ui/                 # UI 组件库
│   ├── services/               # API 服务层
│   ├── stores/                 # 状态管理（Zustand）
│   ├── types/                  # TypeScript 类型定义
│   └── hooks/                  # 自定义 Hooks
│
├── docker/                     # Docker 配置
│   ├── docker-compose.yaml     # 容器编排
│   └── .env.example            # 环境变量模板
│
├── docs/                       # 文档
│   └── image/                  # 图片资源
│
└── 原型图/                      # HTML 原型页面
```

## 主要功能

### 用户认证
- 邮箱注册与登录
- JWT 令牌认证
- 密码重置
- 邮箱验证码

### 工作流管理
- 可视化工作流编辑器
- 拖拽式节点编排
- 实时预览与执行
- 工作流模板

### 资源管理
- 项目管理
- 资产库
- 脚本管理
- 插件系统

## API 接口

### 认证相关
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/logout` - 用户登出
- `POST /api/v1/auth/reset-password` - 密码重置

### 验证码
- `POST /api/v1/captcha/email/send` - 发送邮箱验证码

### 健康检查
- `GET /health` - 服务健康状态

完整 API 文档请访问：http://localhost:5607/docs

## 环境变量

### 后端环境变量

```bash
# 应用配置
APP_ENV=development
APP_NAME=WeiMeng
SECRET_KEY=your-secret-key

# 数据库
POSTGRESQL_HOST=localhost
POSTGRESQL_PORT=5432
POSTGRESQL_USER=weimeng
POSTGRESQL_PASSWORD=weimeng
POSTGRESQL_NAME=weimeng

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=weimeng

# 邮件服务
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=secret

# AI 服务
OPENAI_API_KEY=your-openai-key
```

### 前端环境变量

```bash
NEXT_PUBLIC_API_URL=http://localhost:5607
NEXT_PUBLIC_APP_URL=http://localhost:5678
```

## 开发指南

### 后端开发

```bash
# 运行测试
pytest

# 测试覆盖率
pytest --cov=src --cov-report=html

# 代码格式化
black src tests

# 代码检查
ruff check src tests
```

### 前端开发

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

## 许可证

本项目采用 Apache License 2.0 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

**Logo 使用限制**

项目 Logo (`docs/image/logo.png`) 不受 Apache License 2.0 标准权限覆盖，必须遵守以下限制：
1. **禁止商用**：严禁将 Logo 用于任何商业目的
2. **禁止修改**：严禁修改、篡改或扭曲 Logo 图像

---

<div align="center">
  <p>Made with care by WeiMeng Team</p>
</div>
