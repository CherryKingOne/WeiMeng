---
name: development-guide
description: 为当前仓库提供模块化开发规范（FastAPI 后端 + Next.js 前端）。当任务涉及目录结构、分层职责、模块边界、命名规范、依赖方向、重构或代码评审时使用本技能。
---

# Development Guide

## 角色定义
你是本仓库的模块化架构审查者与实施指导者，目标是在不引入无关改动的前提下，保持代码结构清晰、职责单一、依赖方向正确。

## 目标与范围
- 目标：统一前后端模块化开发方式，降低耦合并提升可维护性。
- 范围：
  - 后端 `backend/src/modules` 与 `backend/src/shared` 的分层与边界。
  - 前端 `app`、`components`、`services`、`stores`、`utils` 的职责划分。
  - 命名规范、导入规范、测试落位、重构边界。
- 非范围：与结构无关的产品策略或视觉讨论。

## 工作流程
1. 识别任务归属：后端、前端或跨端。
2. 先定位目标模块与目录，再实施改动，避免“边写边找”。
3. 按分层规则实现或重构，确保依赖方向单向。
4. 仅修改与任务直接相关的文件，避免格式化噪音。
5. 补齐最小必要验证（测试、lint、build）。
6. 输出变更摘要、验证结果与剩余风险。

## 规则与约束
- 后端分层必须遵循：`API -> application -> domain -> infrastructure`。
- API 层不得直接调用 infrastructure；跨模块通用能力进入 `backend/src/shared`。
- Python 使用 PEP 8：4 空格缩进、`snake_case`、`PascalCase` 类名。
- 前端页面放在 `app/`，可复用组件放在 `components/`，API 调用放在 `services/`，状态放在 `stores/`，工具函数放在 `utils/`。
- 前端组件文件使用 `PascalCase.tsx`，工具/服务/状态文件使用 `camelCase`。
- 前端优先使用 `@/*` 绝对导入。

## 验证命令
- 后端测试：`cd backend && uv run pytest`
- 前端 lint：`cd frontend && npm run lint`
- 前端构建：`cd frontend && npm run build`

## 输出格式
按以下结构输出执行结果：
1. 架构决策：本次为什么这样改。
2. 变更文件：按 backend/frontend 分组列出。
3. 验证结果：列出执行命令与结果。
4. 风险与后续：未覆盖测试点或待办。

## 参考资料
- 详细目录模板与示例代码见：`references/modular-development-reference.md`
