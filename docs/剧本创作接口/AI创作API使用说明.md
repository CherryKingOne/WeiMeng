# AI创作聊天API使用说明

## 概述

基于LangChain实现的AI聊天对话系统，支持流式和非流式输出，自动记录会话、消息和任务耗时。

## 功能特性

- ✅ 支持流式（SSE）和非流式输出
- ✅ 会话管理（创建、查询、删除）
- ✅ 消息历史记录
- ✅ 深度思考模式
- ✅ 完整的耗时统计
- ✅ 错误日志记录
- ✅ 多租户隔离（基于用户ID）

## API端点

### 1. 创建对话 / 继续对话

**POST** `/api/v3/chat/completions`

#### 请求头
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

#### 请求体（指定模型）
```json
{
  "config_id": "wm63405339065589127630",
  "messages": [
    {
      "role": "user",
      "content": "请帮我写一个关于人工智能的短剧大纲"
    }
  ],
  "stream": true,
  "temperature": 0.7,
  "thinking_mode": false,
  "session_id": null
}
```

#### 请求体（使用全局默认模型）
```json
{
  "messages": [
    {
      "role": "user",
      "content": "请帮我写一个关于人工智能的短剧大纲"
    }
  ],
  "stream": true,
  "temperature": 0.7,
  "thinking_mode": false
}
```

**注意**：如果不传 `config_id`，系统会自动使用用户设置的全局默认模型。如果用户未设置默认模型，会返回 400 错误。

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| config_id | string | 否 | 模型配置ID，不传则使用全局默认模型 |
| messages | array | 是 | 消息列表，最后一条为当前提问 |
| stream | boolean | 否 | 是否流式输出，默认true |
| temperature | float | 否 | 随机性参数(0-2)，默认0.7 |
| thinking_mode | boolean | 否 | 是否开启深度思考模式，默认false |
| session_id | string | 否 | 继续对话时传入，新对话传null |

#### 响应（流式）

SSE格式，逐字推送：

```
data: {"content": "好"}

data: {"content": "的"}

data: {"content": "，"}

data: [DONE]
```

#### 响应（非流式）

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "session_id": "u_1001_1701234567890",
    "content": "好的，我来帮你写一个关于人工智能的短剧大纲..."
  },
  "meta": {
    "duration_ms": 1234
  }
}
```

### 2. 设置默认模型（按类型）

**POST** `/api/v3/chat/default-model`

#### 请求头
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

#### 请求体（自动使用模型配置中的类型）
```json
{
  "config_id": "wm63405339065589127630"
}
```

#### 请求体（指定模型类型）
```json
{
  "config_id": "wm63405339065589127630",
  "model_type": "LLM"
}
```

**说明**：
- 如果不传 `model_type`，系统会自动使用模型配置中的类型
- 支持的模型类型：LLM, Rerank, Text Embedding, Speech2text, TTS, Video, Image
- 可以为不同类型设置不同的默认模型

#### 响应
```json
{
  "code": 200,
  "msg": "Default model set successfully",
  "data": {
    "config_id": "wm63405339065589127630",
    "model_name": "Qwen/Qwen3-Coder-480B-A35B-Instruct",
    "model_type": "LLM"
  }
}
```

### 3. 查看默认模型

**GET** `/api/v3/chat/default-model`

#### 请求头
```
Authorization: Bearer <your_jwt_token>
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| config_id | string | 否 | 模型配置ID，查询该配置是否被设置为默认模型 |
| model_type | string | 否 | 模型类型，查询该类型的默认模型 |

**说明**：
- 如果同时传入 `config_id` 和 `model_type`，优先使用 `config_id`
- 如果都不传，返回所有类型的默认模型

#### 使用示例

**1. 通过 config_id 查询**
```bash
GET /api/v3/chat/default-model?config_id=wm63405339065589127630
```

响应：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "config_id": "wm63405339065589127630",
    "model_name": "Qwen/Qwen3-Coder-480B-A35B-Instruct",
    "model_type": "LLM",
    "base_url": "https://api-inference.modelscope.cn/v1",
    "description": "通义千问编程模型",
    "default_for_types": ["LLM", "Rerank"],
    "created_at": "2025-11-27T10:00:00",
    "updated_at": "2025-11-27T10:00:00"
  }
}
```

**2. 通过 model_type 查询**
```bash
GET /api/v3/chat/default-model?model_type=LLM
```

响应：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "model_type": "LLM",
    "config_id": "wm63405339065589127630",
    "model_name": "Qwen/Qwen3-Coder-480B-A35B-Instruct",
    "base_url": "https://api-inference.modelscope.cn/v1",
    "description": "通义千问编程模型",
    "created_at": "2025-11-27T10:00:00",
    "updated_at": "2025-11-27T10:00:00"
  }
}
```

**3. 查询所有类型的默认模型**
```bash
GET /api/v3/chat/default-model
```

响应：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "LLM": {
      "config_id": "wm63405339065589127630",
      "model_name": "Qwen/Qwen3-Coder-480B-A35B-Instruct",
      "base_url": "https://api-inference.modelscope.cn/v1",
      "description": "通义千问编程模型",
      "created_at": "2025-11-27T10:00:00",
      "updated_at": "2025-11-27T10:00:00"
    },
    "TTS": {
      "config_id": "wm12345678901234567890",
      "model_name": "CosyVoice-300M",
      "base_url": "https://api.example.com/v1",
      "description": "语音合成模型",
      "created_at": "2025-11-27T11:00:00",
      "updated_at": "2025-11-27T11:00:00"
    }
  }
}
```

#### 响应（未设置默认模型）
```json
{
  "code": 200,
  "msg": "No default model set",
  "data": null
}
```

### 4. 获取会话列表

**GET** `/api/v3/chat/sessions?page=1&page_size=20`

#### 请求头
```
Authorization: Bearer <your_jwt_token>
```

#### 响应
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "total": 10,
    "sessions": [
      {
        "session_id": "u_1001_1701234567890",
        "title": "新对话",
        "model_name": "Qwen/Qwen3-Coder-480B-A35B-Instruct",
        "created_at": "2025-11-27T10:30:00",
        "updated_at": "2025-11-27T10:35:00"
      }
    ]
  }
}
```

### 3. 获取会话消息历史

**GET** `/api/v3/chat/sessions/{session_id}/messages`

#### 请求头
```
Authorization: Bearer <your_jwt_token>
```

#### 响应
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "session_id": "u_1001_1701234567890",
    "messages": [
      {
        "message_id": 1,
        "role": "user",
        "content": "你好",
        "created_at": "2025-11-27T10:30:00"
      },
      {
        "message_id": 2,
        "role": "assistant",
        "content": "你好！有什么我可以帮助你的吗？",
        "created_at": "2025-11-27T10:30:05"
      }
    ]
  }
}
```

### 4. 删除会话

**DELETE** `/api/v3/chat/sessions/{session_id}`

#### 请求头
```
Authorization: Bearer <your_jwt_token>
```

#### 响应
```json
{
  "code": 200,
  "msg": "Session deleted successfully",
  "data": {
    "session_id": "u_1001_1701234567890"
  }
}
```

## 使用示例

### Python示例（流式）

```python
import requests
import json

url = "http://localhost:7767/api/v3/chat/completions"
headers = {
    "Authorization": "Bearer your_jwt_token",
    "Content-Type": "application/json"
}

data = {
    "config_id": "wm63405339065589127630",
    "messages": [
        {"role": "user", "content": "写一个AI短剧大纲"}
    ],
    "stream": True,
    "temperature": 0.7
}

response = requests.post(url, headers=headers, json=data, stream=True)

for line in response.iter_lines():
    if line:
        line = line.decode('utf-8')
        if line.startswith('data: '):
            content = line[6:]
            if content == '[DONE]':
                break
            chunk = json.loads(content)
            print(chunk.get('content', ''), end='', flush=True)
```

### JavaScript示例（流式）

```javascript
const response = await fetch('http://localhost:7767/api/v3/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_jwt_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    config_id: 'wm63405339065589127630',
    messages: [
      { role: 'user', content: '写一个AI短剧大纲' }
    ],
    stream: true,
    temperature: 0.7
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const content = line.slice(6);
      if (content === '[DONE]') break;

      const data = JSON.parse(content);
      console.log(data.content);
    }
  }
}
```

### cURL示例（非流式）

```bash
curl -X POST "http://localhost:7767/api/v3/chat/completions" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "config_id": "wm63405339065589127630",
    "messages": [
      {"role": "user", "content": "写一个AI短剧大纲"}
    ],
    "stream": false,
    "temperature": 0.7
  }'
```

## 深度思考模式

开启 `thinking_mode: true` 后，系统会自动注入思考提示词，让模型进行更深入的逻辑推理：

```json
{
  "config_id": "wm63405339065589127630",
  "messages": [
    {"role": "user", "content": "分析一下量子计算的未来发展"}
  ],
  "stream": true,
  "temperature": 0.5,
  "thinking_mode": true
}
```

思考模式会自动降低温度参数（temperature - 0.2），确保输出更加严谨。

## 多轮对话

继续对话时，传入之前的 `session_id` 和完整的消息历史：

```json
{
  "config_id": "wm63405339065589127630",
  "messages": [
    {"role": "user", "content": "你好"},
    {"role": "assistant", "content": "你好！有什么可以帮助你的吗？"},
    {"role": "user", "content": "写一个AI短剧大纲"}
  ],
  "stream": true,
  "session_id": "u_1001_1701234567890"
}
```

## 数据库表结构

系统会自动创建以下表：

1. **chat_sessions** - 会话表
2. **chat_messages** - 消息表
3. **chat_request_tasks** - 任务耗时统计表
4. **chat_errors** - 错误日志表

所有表在应用启动时自动创建，无需手动执行SQL。

## 错误处理

### 常见错误码

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误（如messages为空） |
| 404 | 配置ID不存在或无权访问 |
| 401 | 未授权（JWT token无效） |
| 500 | 服务器内部错误（LLM调用失败等） |

### 错误响应示例

```json
{
  "detail": "Config ID not found or access denied"
}
```

## 性能监控

每次请求都会记录到 `chat_request_tasks` 表，包含：
- 开始时间
- 结束时间
- 总耗时（毫秒）
- 状态（processing/success/failed）

可通过查询该表进行性能分析和监控。

## 注意事项

1. 所有接口都需要JWT认证
2. 流式输出使用SSE（Server-Sent Events）格式
3. session_id格式：`{user_id}_{13位时间戳}`
4. 删除会话会级联删除所有相关消息
5. 思考模式会自动调整温度参数
6. 建议流式输出用于长文本生成，非流式用于短回复
