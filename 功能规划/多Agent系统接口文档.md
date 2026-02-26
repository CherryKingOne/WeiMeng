# WeiMeng-Agent 多智能体系统 API 接口文档

## 1. 接口概览

### 1.1 基础信息

- **基础路径**: `/api/v1/agent`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON
- **编码格式**: UTF-8

### 1.2 核心功能模块

| 模块 | 说明 |
|------|------|
| 会话管理 | 创建、管理多智能体对话会话 |
| 消息交互 | 用户与 Agent 的消息往来 |
| Agent 管理 | 查询 Agent 状态、能力信息 |
| 任务管理 | 任务创建、状态跟踪、完成通知 |
| 监控运维 | 运行时状态、统计信息 |

---

## 2. 通用定义

### 2.1 通用响应结构

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "timestamp": 1706246400000
}
```

### 2.2 分页响应结构

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "page_size": 20
  },
  "timestamp": 1706246400000
}
```

### 2.3 错误响应结构

```json
{
  "code": 1001,
  "message": "Invalid parameter: session_id",
  "data": null,
  "timestamp": 1706246400000
}
```

### 2.4 错误码定义

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1001 | 参数错误 |
| 1002 | 认证失败 |
| 1003 | 权限不足 |
| 2001 | 会话不存在 |
| 2002 | 会话已关闭 |
| 3001 | Agent 不存在 |
| 3002 | Agent 不可用 |
| 3003 | Agent 忙碌中 |
| 4001 | 任务不存在 |
| 4002 | 任务执行超时 |
| 4003 | 任务执行失败 |
| 5001 | 系统内部错误 |

---

## 3. 会话管理接口

### 3.1 创建会话

**接口说明**: 创建一个新的多智能体对话会话

**请求路径**: `POST /api/v1/agent/sessions`

**请求头**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| Authorization | string | 是 | Bearer {token} |

**请求体**:

```json
{
  "user_message": "帮我创作一个关于小兔子探险的动画故事",
  "reference_picture": "https://example.com/images/ref_001.jpg",
  "meta_info": {
    "llm":"gemini 3 pro",
    "image": "nanobanana pro",
    "video": "kling3.0",
    "3D": "Tripo",
    "audio":"ElevenLabs V3"

  }
}
```
**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_message | string | 是 | 用户输入的消息/需求描述 |
| reference_picture | string | 否 | 参考图片 URL |
| meta_info | object | 否 | 模型元信息，如不填则使用默认值 |
| meta_info.llm | string | 否 | 大语言模型，默认: gemini3 |
| meta_info.image | string | 否 | 图像生成模型，默认: nanobanana pro |
| meta_info.video | string | 否 | 视频生成模型，默认: kling3.0 |
| meta_info.3D | string | 否 | 3D生成模型，默认: Tripo |
| meta_info.audio | string | 否 | 音频生成模型，默认: Elevenlabs v3 |


**支持模型列表**:

| 模型类型 | 字段名 | 可选值 |
|---------|--------|-------|
| 大语言模型 | llm | gemini3, gpt5.3, glm-5, claude-opes-4.6 |
| 图像生成模型 | image | nanobanana pro, midjourney, stable-diffusion, kling |
| 视频生成模型 | video | kling3.0, sora2, wan2.6, runway, vudo |
| 3D生成模型 | 3D | Tripo |
| 音频生成模型 | audio | ElevenLabs V3 |

**默认模型配置**:

```json
{
  "llm": "gemini3",
  "image": "nanobanana pro",
  "video": "kling3.0",
  "3D": "Tripo",
  "audio": "ElevenLabs V3"
}
```

**响应体**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_message": "帮我创作一个关于小兔子探险的动画故事",
    "reference_picture": "https://example.com/images/ref_001.jpg",
    "meta_info": {
      "llm": "gemini3",
      "image": "nanobanana pro",
      "video": "kling3.0",
      "3D": "Tripo",
      "audio": "ElevenLabs V3"
    },
    "status": "active",
    "created_at": 1706246400000,
    "updated_at": 1706246400000
  },
  "timestamp": 1706246400000
}
```

### 3.2 获取会话列表

**接口说明**: 获取当前用户的所有会话列表

**请求路径**: `GET /api/v1/agent/sessions`

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| page_size | int | 否 | 每页数量，默认 20 |
| status | string | 否 | 筛选状态: active/closed |

**响应体**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "session_id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "创作一个动画短片",
        "status": "active",
        "created_at": 1706246400000,
        "updated_at": 1706246400000,
        "last_message": "我已经完成了角色设计...",
        "active_agents": ["sarah", "bob"]
      }
    ],
    "total": 50,
    "page": 1,
    "page_size": 20
  },
  "timestamp": 1706246400000
}
```

### 3.3 获取会话详情

**接口说明**: 获取指定会话的详细信息

**请求路径**: `GET /api/v1/agent/sessions/{session_id}`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| session_id | string | 是 | 会话 ID |

**响应体**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "创作一个动画短片",
    "status": "active",
    "created_at": 1706246400000,
    "updated_at": 1706246400000,
    "context": {
      "project_type": "animation",
      "target_audience": "children"
    },
    "agents": [
      {
        "agent_id": "sarah",
        "name": "Sarah",
        "role": "screenwriter",
        "state": "engaged",
        "activated_at": 1706246400000
      }
    ],
    "task_history": [
      {
        "task_id": "task_001",
        "agent_id": "sarah",
        "status": "completed",
        "created_at": 1706246400000,
        "completed_at": 1706246500000
      }
    ]
  },
  "timestamp": 1706246400000
}
```

### 3.4 关闭会话

**接口说明**: 关闭指定会话

**请求路径**: `DELETE /api/v1/agent/sessions/{session_id}`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| session_id | string | 是 | 会话 ID |

**响应体**:

```json
{
  "code": 0,
  "message": "success",
  "data": null,
  "timestamp": 1706246400000
}
```

---

## 4. 消息交互接口

### 4.1 发送消息（流式）

**接口说明**: 用户发送消息，开启流式响应

**请求路径**: `POST /api/v1/agent/sessions/{session_id}/messages/stream`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| session_id | string | 是 | 会话 ID |

**请求体**:

```json
{
  "content": "帮我创作一个关于小兔子探险的动画故事",
  "metadata": {
    "attachments": [],
    "priority": "normal"
  }
}
```

**响应类型**: `text/event-stream` (SSE)

**响应体 (SSE 格式)**:

```
event: start
data: {"type": "start", "agent_id": "emma"}

event: thinking
data: {"type": "thinking", "content": "分析用户意图..."}

event: agent_selected
data: {"type": "agent_selected", "agents": ["sarah", "bob"]}

event: message
data: {"type": "message", "agent_id": "sarah", "content": "好的，我来为您创作这个故事...", "timestamp": 1706246400000}

event: message
data: {"type": "message", "agent_id": "bob", "content": "我已经设计了角色形象...", "timestamp": 1706246401000}

event: complete
data: {"type": "complete", "session_id": "550e8400-e29b-41d4-a716-446655440000", "summary": "已完成角色设计和故事创作"}
```

**事件类型说明**:

| 事件类型 | 说明 |
|---------|------|
| start | 开始响应 |
| thinking | 思考中状态 |
| agent_selected | 选中的 Agent |
| message | Agent 消息 |
| handoff | Agent 交接 |
| error | 错误发生 |
| complete | 完成 |

### 4.2 发送消息（非流式）

**接口说明**: 用户发送消息，获取完整响应

**请求路径**: `POST /api/v1/agent/sessions/{session_id}/messages`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| session_id | string | 是 | 会话 ID |

**请求体**:

```json
{
  "content": "帮我创作一个关于小兔子探险的动画故事"
}
```

**响应体**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message_id": "msg_001",
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "content": "我已经为您创作了一个关于小兔子探险的动画故事，并设计了主要角色形象。",
    "agents_involved": ["sarah", "bob"],
    "created_at": 1706246400000
  },
  "timestamp": 1706246400000
}
```

### 4.3 获取消息历史

**接口说明**: 获取会话的消息历史

**请求路径**: `GET /api/v1/agent/sessions/{session_id}/messages`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| session_id | string | 是 | 会话 ID |

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页数量 |
| agent_id | string | 否 | 筛选特定 Agent |

**响应体**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "message_id": "msg_001",
        "role": "user",
        "content": "帮我创作一个关于小兔子探险的动画故事",
        "timestamp": 1706246400000
      },
      {
        "message_id": "msg_002",
        "role": "agent",
        "agent_id": "emma",
        "content": "我来帮您分析一下需求...",
        "timestamp": 1706246401000
      },
      {
        "message_id": "msg_003",
        "role": "agent",
        "agent_id": "sarah",
        "content": "好的，我来为您创作这个故事...",
        "timestamp": 1706246402000
      }
    ],
    "total": 100,
    "page": 1,
    "page_size": 20
  },
  "timestamp": 1706246400000
}
```

---

## 5. Agent 管理接口

### 5.1 获取可用 Agent 列表

**接口说明**: 获取系统中所有可用的专业 Agent

**请求路径**: `GET /api/v1/agent/agents`

**响应体**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "emma": {
      "agent_id": "emma",
      "name": "Emma",
      "role": "coordinator",
      "description": "多智能体系统协调器，负责全局调度",
      "state": "active",
      "capabilities": [
        "intent_recognition",
        "task_decomposition",
        "agent_selection",
        "result_aggregation"
      ]
    },
    "sarah": {
      "agent_id": "sarah",
      "name": "Sarah",
      "role": "screenwriter",
      "description": "专业编剧，擅长故事创作",
      "state": "dormant",
      "capabilities": [
        "剧本创作",
        "台词撰写",
        "情节设计",
        "角色塑造"
      ]
    },
    "oliver": {
      "agent_id": "oliver",
      "name": "Oliver",
      "role": "animator",
      "description": "专业动画师",
      "state": "dormant",
      "capabilities": [
        "动画制作",
        "动作设计",
        "场景渲染"
      ]
    },
    "david": {
      "agent_id": "david",
      "name": "David",
      "role": "storyboard",
      "description": "专业分镜师",
      "state": "dormant",
      "capabilities": [
        "分镜设计",
        "镜头规划",
        "画面构图"
      ]
    },
    "alex": {
      "agent_id": "alex",
      "name": "Alex",
      "role": "editor",
      "description": "专业剪辑师",
      "state": "dormant",
      "capabilities": [
        "视频剪辑",
        "节奏把控",
        "特效合成"
      ]
    },
    "bob": {
      "agent_id": "bob",
      "name": "Bob",
      "role": "designer",
      "description": "专业角色设计师",
      "state": "dormant",
      "capabilities": [
        "角色设计",
        "服装设计",
        "道具设计"
      ]
    },
    "robert": {
      "agent_id": "robert",
      "name": "Robert",
      "role": "sound_engineer",
      "description": "专业音效师",
      "state": "dormant",
      "capabilities": [
        "音效制作",
        "配乐创作",
        "声音设计"
      ]
    }
  },
  "timestamp": 1706246400000
}
```

**Agent 状态说明**:

| 状态 | 说明 |
|------|------|
| active | 活跃（Emma 专用状态） |
| dormant | 休眠（未激活） |
| engaged | 忙碌（正在执行任务） |

### 5.2 获取单个 Agent 信息

**接口说明**: 获取指定 Agent 的详细信息

**请求路径**: `GET /api/v1/agent/agents/{agent_id}`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | string | 是 | Agent ID |

**响应体**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "agent_id": "sarah",
    "name": "Sarah",
    "role": "screenwriter",
    "description": "专业编剧，擅长故事创作",
    "state": "dormant",
    "capabilities": [
      "剧本创作",
      "台词撰写",
      "情节设计",
      "角色塑造"
    ],
    "statistics": {
      "total_tasks": 50,
      "completed_tasks": 48,
      "average_duration": 30000
    }
  },
  "timestamp": 1706246400000
}
```

### 5.3 手动激活 Agent

**接口说明**: 在会话中手动激活指定的 Agent

**请求路径**: `POST /api/v1/agent/sessions/{session_id}/agents/{agent_id}/activate`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| session_id | string | 是 | 会话 ID |
| agent_id | string | 是 | Agent ID |

**请求体**:

```json
{
  "task_description": "创作一个儿童动画故事"
}
```

**响应体**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "agent_id": "sarah",
    "state": "engaged",
    "activated_at": 1706246400000
  },
  "timestamp": 1706246400000
}
```

### 5.4 手动释放 Agent

**接口说明**: 在会话中手动释放指定的 Agent

**请求路径**: `POST /api/v1/agent/sessions/{session_id}/agents/{agent_id}/dismiss`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| session_id | string | 是 | 会话 ID |
| agent_id | string | 是 | Agent ID |

**响应体**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "agent_id": "sarah",
    "state": "dormant",
    "dismissed_at": 1706246400000
  },
  "timestamp": 1706246400000
}
```

---

## 6. 任务管理接口

### 6.1 获取任务列表

**接口说明**: 获取当前会话的任务列表

**请求路径**: `GET /api/v1/agent/sessions/{session_id}/tasks`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| session_id | string | 是 | 会话 ID |

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | string | 否 | 筛选 Agent |
| status | string | 否 | 筛选状态: pending/running/completed/failed |

**响应体**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "task_id": "task_001",
        "session_id": "550e8400-e29b-41d4-a716-446655440000",
        "agent_id": "sarah",
        "description": "创作动画故事",
        "status": "completed",
        "result": {
          "outline": "小兔子在森林里探险...",
          "characters": ["小兔子", "狐狸", "猫头鹰"]
        },
        "created_at": 1706246400000,
        "started_at": 1706246401000,
        "completed_at": 1706246500000,
        "duration": 99000
      },
      {
        "task_id": "task_002",
        "session_id": "550e8400-e29b-41d4-a716-446655440000",
        "agent_id": "bob",
        "description": "设计角色形象",
        "status": "running",
        "created_at": 1706246600000,
        "started_at": 1706246601000,
        "progress": 60
      }
    ],
    "total": 10,
    "page": 1,
    "page_size": 20
  },
  "timestamp": 1706246400000
}
```

### 6.2 获取任务详情

**接口说明**: 获取指定任务的详细信息

**请求路径**: `GET /api/v1/agent/tasks/{task_id}"

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 任务 ID |

**响应体**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "task_id": "task_001",
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "agent_id": "sarah",
    "description": "创作动画故事",
    "status": "completed",
    "input": {
      "user_request": "帮我创作一个关于小兔子探险的动画故事",
      "task_summary": "需要创作一个儿童动画故事"
    },
    "output": {
      "outline": "小兔子在森林里探险...",
      "characters": ["小兔子", "狐狸", "猫头鹰"],
      "dialogues": []
    },
    "error": null,
    "created_at": 1706246400000,
    "started_at": 1706246401000,
    "completed_at": 1706246500000,
    "duration": 99000
  },
  "timestamp": 1706246400000
}
```

### 6.3 取消任务

**接口说明**: 取消正在执行的任务

**请求路径**: `DELETE /api/v1/agent/tasks/{task_id}"

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 任务 ID |

**响应体**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "task_id": "task_001",
    "status": "cancelled",
    "cancelled_at": 1706246400000
  },
  "timestamp": 1706246400000
}
```

---

## 7. 监控运维接口

### 7.1 获取系统状态

**接口说明**: 获取多智能体系统的整体运行状态

**请求路径**: `GET /api/v1/agent/status`

**响应体**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "system": {
      "status": "healthy",
      "uptime": 86400000,
      "version": "1.0.0"
    },
    "sessions": {
      "active": 10,
      "total": 100
    },
    "agents": {
      "total": 7,
      "active": 1,
      "engaged": 3,
      "dormant": 3
    },
    "tasks": {
      "running": 5,
      "pending": 2,
      "completed_today": 50,
      "failed_today": 2
    },
    "performance": {
      "avg_response_time": 1500,
      "avg_task_duration": 30000,
      "success_rate": 0.96
    }
  },
  "timestamp": 1706246400000
}
```

### 7.2 获取会话实时状态

**接口说明**: 获取指定会话的实时执行状态（用于前端展示）

**请求路径**: `GET /api/v1/agent/sessions/{session_id}/realtime`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| session_id | string | 是 | 会话 ID |

**响应体**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "current_node": "AGENT_WORK",
    "current_agent": "sarah",
    "agent_states": {
      "emma": "active",
      "sarah": "engaged",
      "bob": "dormant"
    },
    "active_tasks": [
      {
        "task_id": "task_002",
        "agent_id": "sarah",
        "progress": 60,
        "status": "running"
      }
    ],
    "message_count": 15,
    "last_update": 1706246400000
  },
  "timestamp": 1706246400000
}
```

### 7.3 获取统计数据

**接口说明**: 获取系统运行统计数据

**请求路径**: `GET /api/v1/agent/statistics`

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期 (YYYY-MM-DD) |
| end_date | string | 否 | 结束日期 (YYYY-MM-DD) |
| granularity | string | 否 | 粒度: day/hour/minute |

**响应体**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "period": {
      "start_date": "2024-01-01",
      "end_date": "2024-01-31"
    },
    "sessions": {
      "total": 500,
      "active": 50,
      "closed": 450,
      "avg_duration": 300000
    },
    "tasks": {
      "total": 2000,
      "completed": 1920,
      "failed": 80,
      "by_agent": {
        "sarah": 500,
        "oliver": 400,
        "david": 300,
        "alex": 250,
        "bob": 300,
        "robert": 250
      }
    },
    "performance": {
      "avg_response_time": 1500,
      "p95_response_time": 3000,
      "avg_task_duration": 30000,
      "success_rate": 0.96
    }
  },
  "timestamp": 1706246400000
}
```

---

## 8. Webhook 回调接口

### 8.1 注册 Webhook

**接口说明**: 注册任务状态变化的回调地址

**请求路径**: `POST /api/v1/agent/webhooks`

**请求体**:

```json
{
  "url": "https://example.com/webhook/agent",
  "events": [
    "task.completed",
    "task.failed",
    "agent.engaged",
    "agent.dismissed"
  ],
  "secret": "your-webhook-secret"
}
```

**响应体**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "webhook_id": "wh_001",
    "url": "https://example.com/webhook/agent",
    "events": [
      "task.completed",
      "task.failed",
      "agent.engaged",
      "agent.dismissed"
    ],
    "status": "active",
    "created_at": 1706246400000
  },
  "timestamp": 1706246400000
}
```

### 8.2 Webhook 回调 payload

**回调事件: task.completed**

```json
{
  "event": "task.completed",
  "timestamp": 1706246400000,
  "data": {
    "task_id": "task_001",
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "agent_id": "sarah",
    "result": {
      "outline": "...",
      "characters": []
    },
    "completed_at": 1706246400000
  }
}
```

**回调事件: agent.handoff**

```json
{
  "event": "agent.handoff",
  "timestamp": 1706246400000,
  "data": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "from_agent": "sarah",
    "to_agent": "oliver",
    "reason": "需要动画制作",
    "context": {}
  }
}
```

---

## 9. 接口调用流程

### 9.1 典型对话流程

```
1. 创建会话
   POST /api/v1/agent/sessions
   ↓
   返回 session_id

2. 发送消息
   POST /api/v1/agent/sessions/{session_id}/messages/stream
   ↓
   SSE 流式返回:
   - start: 开始
   - thinking: Emma 分析意图
   - agent_selected: 选中的 Agent
   - message: Agent 消息
   - complete: 完成

3. 获取结果
   GET /api/v1/agent/sessions/{session_id}
   GET /api/v1/agent/sessions/{session_id}/messages
```

### 9.2 Agent 手动控制流程

```
1. 激活 Agent
   POST /api/v1/agent/sessions/{session_id}/agents/{agent_id}/activate
   
2. 监控任务
   GET /api/v1/agent/sessions/{session_id}/tasks
   
3. 释放 Agent
   POST /api/v1/agent/sessions/{session_id}/agents/{agent_id}/dismiss
```

---

## 10. 附录

### 10.1 Agent ID 对照表

| Agent ID | 名称 | 角色 | 说明 |
|----------|------|------|------|
| emma | Emma | coordinator | 协调器 |
| sarah | Sarah | screenwriter | 编剧 |
| oliver | Oliver | animator | 动画师 |
| david | David | storyboard | 分镜师 |
| alex | Alex | editor | 剪辑师 |
| bob | Bob | designer | 角色设计 |
| robert | Robert | sound_engineer | 音效师 |

### 10.2 状态对照表

| 状态 | 说明 |
|------|------|
| session.status: active | 会话活跃 |
| session.status: closed | 会话已关闭 |
| agent.state: active | 活跃（Emma 专用） |
| agent.state: dormant | 休眠 |
| agent.state: engaged | 忙碌 |
| task.status: pending | 待执行 |
| task.status: running | 执行中 |
| task.status: completed | 已完成 |
| task.status: failed | 失败 |
| task.status: cancelled | 已取消 |
