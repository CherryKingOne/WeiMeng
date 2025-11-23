

# LLM 管理与调用 API 接口文档

## 1. 概述 (Overview)

本模块用于管理基于通用 OpenAI 协议的大模型配置（PostgreSQL存储），并提供统一的调用接口。

- **Base URL**: `http://<your-domain>/v1/llm`
- **数据格式**: `application/json`
- **字符编码**: `UTF-8`
- **默认配置**:
    - 单次请求最大Token (`max_tokens`): 4089
    - 默认温度 (`temperature`): 0.7

## 2. 业务状态码大全 (Status Codes)

所有接口返回的 JSON 数据中均包含 `code` 字段，前端/调用方应根据此字段判断业务逻辑结果。

| 状态码 (code) | 状态描述 (msg) | 含义 | 处理建议 |
| :--- | :--- | :--- | :--- |
| **200** | Success | 请求成功 | 正常处理 `data` 数据 |
| **400** | Bad Request | 参数错误 | 检查必填字段或参数格式 |
| **401** | Unauthorized | 系统未授权 | 检查系统 API Key 或登录状态 |
| **404** | Not Found | 资源不存在 | 检查 ID 或模型名称是否正确 |
| **1001** | Model Already Exists | 模型已存在 | 修改模型名称或进行编辑操作 |
| **1002** | Database Error | 数据库操作失败 | 联系管理员检查 PostgreSQL 服务 |
| **2001** | LLM Provider Error | 上游模型服务报错 | 检查配置的 URL 或 Key 是否有效 |
| **2002** | Context Exceeded | 超出上下文限制 | 缩短输入内容或调整配置 |
| **2003** | Connection Timeout | 连接上游服务超时 | 稍后重试或检查网络 |
| **500** | Internal Server Error | 服务器内部错误 | 联系后端开发人员 |

---

## 3. 接口详情

### 3.1 添加 LLM 模型配置

用于向 PostgreSQL 数据库中新增一个符合 OpenAI 协议的模型配置。

- **接口地址**: `/add`
- **请求方法**: `POST`
- **Content-Type**: `application/json`

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
| :--- | :--- | :--- | :--- | :--- |
| `model_name` | string | **是** | 模型真实名称 (如 `gpt-4`, `deepseek-chat`)，需唯一 | - |
| `api_url` | string | **是** | 模型服务的 Base URL (如 `https://api.openai.com/v1`) | - |
| `api_key` | string | **是** | 模型服务的鉴权密钥 (sk-...) | - |
| `max_tokens` | integer | **是** | 单次请求最大生成 Token 数 | 4089 |
| `context_window` | integer | 否 | 模型支持的最大上下文窗口大小 (Token数) | - |
| `description` | string | 否 | 模型备注/描述 | - |

#### 响应参数

| 参数名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `code` | integer | 状态码 |
| `msg` | string | 提示信息 |
| `data` | object | 返回数据 |
| `data.id` | string | 新生成的配置 ID (UUID) |

#### 示例代码

```bash
curl -X POST "http://localhost:8080/v1/llm/add" \
-H "Content-Type: application/json" \
-d '{
    "model_name": "gpt-4-turbo",
    "api_url": "https://api.openai.com/v1",
    "api_key": "sk-xxxxxxxxxxxxxxxxxxxx",
    "max_tokens": 4089,
    "context_window": 128000,
    "description": "OpenAI官方GPT-4 Turbo"
}'
```

---

### 3.2 删除 LLM 模型配置

根据配置 ID 删除已添加的模型。

- **接口地址**: `/delete`
- **请求方法**: `POST`
- **Content-Type**: `application/json`

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | string | **是** | 模型的配置 ID |

#### 响应参数

| 参数名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `code` | integer | 状态码 |
| `msg` | string | 提示信息 |
| `data` | null | 无数据返回 |

#### 示例代码

```bash
curl -X POST "http://localhost:8080/v1/llm/delete" \
-H "Content-Type: application/json" \
-d '{
    "id": "550e8400-e29b-41d4-a716-446655440000"
}'
```

---

### 3.3 获取 LLM 列表

获取当前数据库中已配置的所有模型列表。通常用于前端下拉框选择模型。

- **接口地址**: `/list`
- **请求方法**: `GET`
- **Content-Type**: `application/json`

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `page` | integer | 否 | 页码 (默认 1) |
| `page_size` | integer | 否 | 每页数量 (默认 20) |

#### 响应参数

| 参数名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `code` | integer | 状态码 |
| `msg` | string | 提示信息 |
| `data` | object | 数据主体 |
| `data.list` | array | 模型列表 |
| `data.list[].id` | string | 配置 ID |
| `data.list[].model_name` | string | 模型真实名称 |
| `data.list[].api_url` | string | 接口地址 |
| `data.list[].max_tokens` | integer | 最大生成 Token |
| `data.list[].context_window` | integer | 上下文窗口 |
| `data.total` | integer | 总记录数 |

*(注：出于安全考虑，列表中通常不返回完整的 api_key，仅返回脱敏后的 key 或不返回)*

#### 示例代码

```bash
curl -X GET "http://localhost:8080/v1/llm/list?page=1&page_size=10"
```

---

### 3.4 编辑 LLM 配置

支持对已添加的模型进行配置修改。

- **接口地址**: `/edit`
- **请求方法**: `POST`
- **Content-Type**: `application/json`

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | string | **是** | 需修改的配置 ID |
| `model_name` | string | **是** | 模型真实名称 |
| `api_url` | string | **是** | 接口地址 |
| `api_key` | string | **是** | 密钥 (若传空字符串则不修改原密钥) |
| `max_tokens` | integer | **是** | 单次最大 Token 数 |
| `context_window` | integer | 否 | 上下文窗口 |
| `temperature_default` | float | 否 | 默认温度预设 |

#### 响应参数

| 参数名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `code` | integer | 状态码 |
| `msg` | string | 提示信息 |
| `data` | boolean | 修改结果 |

#### 示例代码

```bash
curl -X POST "http://localhost:8080/v1/llm/edit" \
-H "Content-Type: application/json" \
-d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "model_name": "gpt-4-turbo-preview",
    "api_url": "https://api.openai.com/v1",
    "api_key": "sk-new-key-xxxxxxxx",
    "max_tokens": 4089
}'
```

---

### 3.5 调用 LLM 模型 (Chat)

根据模型的真实名称调用模型。系统将查找数据库中对应的 `api_url` 和 `api_key` 进行转发调用。

- **接口地址**: `/chat`
- **请求方法**: `POST`
- **Content-Type**: `application/json`

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
| :--- | :--- | :--- | :--- | :--- |
| `model_name` | string | **是** | 模型真实名称 (用于匹配配置) | - |
| `messages` | array | **是** | 对话上下文 (OpenAI 格式) | - |
| `messages[].role` | string | **是** | 角色 (`system`, `user`, `assistant`) | - |
| `messages[].content` | string | **是** | 对话内容 | - |
| `temperature` | float | 否 | 采样温度 (0-2)，值越高越随机 | 0.7 |
| `stream` | boolean | 否 | 是否开启流式输出 (SSE) | false |

#### 响应参数 (非流式 stream=false)

| 参数名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `code` | integer | 状态码 |
| `data.content` | string | 模型返回的文本内容 |
| `data.usage` | object | Token 使用统计 |

#### 响应参数 (流式 stream=true)

返回 Content-Type 为 `text/event-stream`，数据包遵循 OpenAI SSE 标准。

#### 示例代码 (非流式)

```bash
curl -X POST "http://localhost:8080/v1/llm/chat" \
-H "Content-Type: application/json" \
-d '{
    "model_name": "gpt-4-turbo",
    "temperature": 0.5,
    "stream": false,
    "messages": [
        {"role": "system", "content": "你是一个有用的助手。"},
        {"role": "user", "content": "你好，请介绍一下PostgreSQL。"}
    ]
}'
```

#### 示例代码 (流式)

```bash
curl -X POST "http://localhost:8080/v1/llm/chat" \
-H "Content-Type: application/json" \
-d '{
    "model_name": "gpt-4-turbo",
    "stream": true,
    "messages": [
        {"role": "user", "content": "写一首关于秋天的诗。"}
    ]
}'
```

---

## 4. 数据库设计参考 (PostgreSQL)

虽然本文档为接口文档，但为了业务对齐，提供基础 Schema 参考：

```sql
CREATE TABLE llm_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(255) NOT NULL UNIQUE, -- 模型真实名称
    api_url VARCHAR(512) NOT NULL,           -- 接口地址
    api_key VARCHAR(512) NOT NULL,           -- 密钥
    max_tokens INTEGER NOT NULL DEFAULT 4089,-- 最大Token数
    context_window INTEGER,                  -- 上下文最大Token
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```