# 剧本库局部模型配置API

## 概述

剧本库支持设置局部模型配置，允许不同的剧本库使用不同的AI模型。

## 优先级规则

**局部模型 > 全局默认模型**

- 如果剧本库设置了局部模型，优先使用局部模型
- 如果未设置局部模型，使用用户的全局默认LLM模型
- 如果都未设置，返回无模型配置状态

## API端点

### 1. 设置剧本库的局部模型

**POST** `/api/v3/chat/libraries/{library_id}/local-model`

#### 请求头
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| library_id | integer | 是 | 剧本库ID |

#### 请求体参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| config_id | string | 是 | 模型配置ID |
| model_type | string | 否 | 模型类型（可选），用于验证模型类型是否匹配 |

#### 请求体示例（仅指定config_id）
```json
{
  "config_id": "wm63405339065589127630"
}
```

#### 请求体示例（同时指定config_id和model_type）
```json
{
  "config_id": "wm63405339065589127630",
  "model_type": "LLM"
}
```

**说明**：
- 如果传入 `model_type`，系统会验证该模型配置的类型是否与传入的类型匹配
- 如果类型不匹配，会返回 400 错误
- 如果不传 `model_type`，则不进行类型验证

#### 响应
```json
{
  "code": 200,
  "msg": "Local model set successfully",
  "data": {
    "library_id": 6250527834723381,
    "library_name": "测试",
    "config_id": "wm63405339065589127630",
    "model_name": "Qwen/Qwen3-Coder-480B-A35B-Instruct",
    "model_type": "LLM"
  }
}
```

#### 使用示例
```bash
curl -X POST "http://0.0.0.0:7767/api/v3/chat/libraries/6250527834723381/local-model" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"config_id": "wm63405339065589127630"}'
```

---

### 2. 移除剧本库的局部模型配置

**DELETE** `/api/v3/chat/libraries/{library_id}/local-model`

#### 请求头
```
Authorization: Bearer <your_jwt_token>
```

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| library_id | integer | 是 | 剧本库ID |

#### 响应
```json
{
  "code": 200,
  "msg": "Local model removed successfully, will use global default model",
  "data": {
    "library_id": 6250527834723381,
    "library_name": "测试"
  }
}
```

#### 使用示例
```bash
curl -X DELETE "http://0.0.0.0:7767/api/v3/chat/libraries/6250527834723381/local-model" \
  -H "Authorization: Bearer your_jwt_token"
```

---

### 3. 查看剧本库实际使用的模型

**GET** `/api/v3/chat/libraries/{library_id}/effective-model`

#### 请求头
```
Authorization: Bearer <your_jwt_token>
```

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| library_id | integer | 是 | 剧本库ID |

#### 响应（使用局部模型）
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "library_id": 6250527834723381,
    "library_name": "测试",
    "model_source": "local",
    "config_id": "wm63405339065589127630",
    "model_name": "Qwen/Qwen3-Coder-480B-A35B-Instruct",
    "model_type": "LLM",
    "base_url": "https://api-inference.modelscope.cn/v1",
    "description": "通义千问编程模型"
  }
}
```

#### 响应（使用全局默认模型）
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "library_id": 6250527834723381,
    "library_name": "测试",
    "model_source": "global",
    "config_id": "wm12345678901234567890",
    "model_name": "GPT-4",
    "model_type": "LLM",
    "base_url": "https://api.openai.com/v1",
    "description": "OpenAI GPT-4"
  }
}
```

#### 响应（未配置任何模型）
```json
{
  "code": 200,
  "msg": "No model configured",
  "data": {
    "library_id": 6250527834723381,
    "library_name": "测试",
    "model_source": "none",
    "config_id": null,
    "model_name": null
  }
}
```

#### 使用示例
```bash
curl -X GET "http://0.0.0.0:7767/api/v3/chat/libraries/6250527834723381/effective-model" \
  -H "Authorization: Bearer your_jwt_token"
```

---

## 使用场景

### 场景1：为不同类型的剧本库设置不同的模型

```bash
# 1. 为小说剧本库设置通义千问模型
curl -X POST "/api/v3/chat/libraries/123/local-model" \
  -d '{"config_id": "qwen_model_id"}'

# 2. 为广告创作库设置GPT-4模型
curl -X POST "/api/v3/chat/libraries/456/local-model" \
  -d '{"config_id": "gpt4_model_id"}'
```

### 场景2：查看剧本库列表时显示使用的模型

```bash
# 1. 获取剧本库列表
curl -X GET "/api/v1/script/libraries"

# 2. 对每个剧本库查询实际使用的模型
curl -X GET "/api/v3/chat/libraries/123/effective-model"
```

### 场景3：临时切换模型进行测试

```bash
# 1. 设置测试模型
curl -X POST "/api/v3/chat/libraries/123/local-model" \
  -d '{"config_id": "test_model_id"}'

# 2. 进行测试...

# 3. 恢复使用全局默认模型
curl -X DELETE "/api/v3/chat/libraries/123/local-model"
```

---

## 模型来源说明

响应中的 `model_source` 字段表示模型的来源：

| 值 | 说明 |
|------|------|
| local | 使用剧本库的局部模型配置 |
| global | 使用用户的全局默认LLM模型 |
| none | 未配置任何模型 |

---

## 错误处理

### 常见错误码

| 错误码 | 说明 |
|--------|------|
| 404 | 剧本库不存在或无权访问 |
| 404 | 模型配置不存在或无权访问 |
| 401 | 未授权（JWT token无效） |
| 500 | 服务器内部错误 |

### 错误响应示例

```json
{
  "detail": "Script library not found"
}
```

---

## 注意事项

1. 局部模型配置只对当前剧本库生效
2. 删除局部模型配置后，会自动使用全局默认模型
3. 如果局部配置的模型被删除，系统会自动降级使用全局默认模型
4. 建议在剧本库列表中显示每个库使用的模型，方便用户管理
5. 局部模型配置不会影响其他剧本库的模型选择
