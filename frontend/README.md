# WeiMeng Frontend

WeiMeng Frontend 是一个基于 Next.js 16、React 19 与 TypeScript 的前端应用，提供中英文双语路由、登录注册、项目与工作流浏览、素材与插件页、剧本库管理，以及多种 AI Workbench 页面。

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- Zustand
- Axios

## 主要功能

- 默认访问根路径时跳转到 `/zh/auth/login`
- 支持 `zh`、`en` 两种语言路由
- 认证流程：登录、注册、找回密码
- 业务页面：团队、项目、工作流、素材、插件、剧本库
- Workbench 页面：`text2image`、`image2image`、`text2video`、`image2video`
- 通过 `services/` 目录统一调用后端 API，并在请求拦截器中自动携带本地 `token`

## 目录结构

```text
frontend/
├── app/                         # App Router 页面
│   ├── page.tsx                 # 根路径重定向到默认语言登录页
│   └── [locale]/                # 多语言路由入口
│       ├── auth/                # 登录、注册、忘记密码
│       ├── (public-sidebar)/    # 项目、工作流、素材、插件、剧本库
│       ├── scripts-detail/      # 剧本文本与 chunk 详情
│       └── workbench/           # AI 工作台
├── components/                  # UI 组件与业务组件
├── services/                    # Axios API 封装
├── stores/                      # Zustand 状态管理
├── hooks/                       # 自定义 hooks
├── constants/                   # 路由、国际化、存储常量
├── types/                       # TypeScript 类型定义
├── utils/                       # 格式化、校验、错误处理等工具
└── public/                      # 静态资源与 logo
```

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置后端地址

项目默认请求 `http://0.0.0.0:5607/api/v1`。本地开发建议创建 `.env.local`：

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:5607/api/v1
```

### 3. 启动开发服务器

```bash
npm run dev
```

默认监听 `http://localhost:5678`。

## 常用命令

```bash
npm run dev         # 开发模式，端口 5678
npm run lint        # ESLint 检查
npm run build       # 构建生产版本
npm run start       # 启动生产构建，端口 5678
npx tsc --noEmit    # 单独执行 TypeScript 类型检查
```

## 与后端联调

- 前端默认对接 WeiMeng Backend 的 `http://localhost:5607`
- 推荐先启动后端，再访问 `/zh/scripts`、`/zh/workflows`、`/zh/workbench/text2image` 等页面
- 后端接口文档地址通常为 `http://localhost:5607/docs`

## Docker 部署

项目包含 `Dockerfile` 与 `docker-compose.yml`，可直接构建并启动前端容器：

```bash
docker compose up -d --build
```

容器启动后对外暴露 `5678` 端口。

## 质量检查

当前仓库未配置独立的单元测试或 E2E 测试框架。提交前至少执行以下检查：

```bash
npm run lint
npm run build
npx tsc --noEmit
```

如果你新增测试，建议优先沿用 `*.test.ts` 或 `*.test.tsx` 命名。
