# 唯梦 (WeiMeng)

![唯梦 Logo](./logo.png)

**[English Documentation](./README.md)**

## 项目简介

唯梦是一个AI辅助的影视剧制作平台，简化从剧本创作到最终视频编辑的整个创作流程。

## 功能特性

- **剧本管理**：编写、上传和管理剧本，支持AI智能续写
- **角色提取**：从剧本中自动提取角色并生成详细档案
- **分镜生成**：AI驱动的分镜创建，支持自定义风格
- **视频编辑**：基于时间轴的视频编辑器，支持拖放操作
- **项目管理**：组织项目并支持团队协作
- **多语言支持**：完整的国际化支持（中文/英文）

## 技术栈

**前端**: Vue 3, Vite, Tailwind CSS, Vue Router, Vue I18n
**后端**: FastAPI, Python 3.8+

## 快速开始

### 环境要求

- Node.js 20.19.0+ 或 22.12.0+
- Python 3.8+

### 前端启动

```bash
cd web-ui
npm install
npm run dev
```

前端运行在 `http://localhost:5173`

### 后端启动

```bash
cd src
pip install -r requirements.txt
python main.py
```

后端运行在 `http://localhost:7767`

## 项目结构

```
WeiMeng/
├── web-ui/          # Vue 3 前端应用
├── src/             # FastAPI 后端应用
├── docs/            # 文档
└── logo.png         # 项目 Logo
```

## 开发说明

- 前端开发服务器：在 `web-ui/` 目录下运行 `npm run dev`
- 后端开发服务器：在 `src/` 目录下运行 `python main.py`
- 构建前端：在 `web-ui/` 目录下运行 `npm run build`
