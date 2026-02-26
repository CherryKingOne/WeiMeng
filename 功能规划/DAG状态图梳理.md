# WeiMeng-Agent DAG 状态图标准化设计文档

## 1. DAG 核心语义定义

### 1.1 图的定义

本 DAG 是一个**有向无环图（Directed Acyclic Graph）**，用于描述 WeiMeng-Agent 多智能体系统的任务调度与协作流程。

- **图类型**：有向无环图（DAG）
- **图性质**：可并发、可中断、可回溯
- **根节点**：用户输入（USER）
- **终止节点**：用户回复（EMMA_RESPOND → USER）

### 1.2 节点语义

| 节点类别 | 节点名称 | 语义定义 |
|---------|---------|---------|
| 用户层 | USER | 整个系统的输入源和输出目标，代表用户交互的入口和终点 |
| Emma常驻层 | EMMA_* | 协调器节点，始终在线，负责全局调度、意图分析、任务分发 |
| 专业Agent层 | SARAH, OLIVER, DAVID, ALEX, BOB, ROBERT | 专业能力节点，按需激活，平时处于休眠态 |
| 活跃交互区 | AGENT_* | 任务执行过程中的中间状态节点，描述 Agent 工作流程 |

### 1.3 边语义

| 边类型 | 符号 | 语义 |
|-------|------|------|
| 控制流 | `--> | 主流程传递，表示下一步操作 |
| 信息流 | `-.->` | 监听/观察流，不干预但保持连接 |
| 条件分支 | `-->\|条件\|` | 根据条件选择不同分支 |

---

## 2. 节点类型与元数据定义

### 2.1 节点类型枚举

```typescript
enum NodeType {
  // 核心节点类型
  USER = "user",                    // 用户节点
  EMMA_COORDINATOR = "emma",         // Emma 协调器
  PROFESSIONAL_AGENT = "agent",      // 专业 Agent
  ACTIVE_STATE = "active",           // 活跃状态
  WORK_STATE = "work",               // 工作状态
  INTERACTION_STATE = "interaction", // 交互状态
  COMPLETION_STATE = "completion",   // 完成状态
  
  // 决策节点
  DECISION = "decision",             // 决策节点
  EVALUATION = "evaluation"           // 评估节点
}
```

### 2.2 节点状态枚举

```typescript
enum AgentState {
  DORMANT = "dormant",   // 休眠态：未被激活
  ENGAGED = "engaged",   // 活跃态：正在执行任务
  IDLE = "idle"          // 空闲态：任务完成等待释放
}

enum NodeStatus {
  PENDING = "pending",     // 待执行
  RUNNING = "running",     // 执行中
  COMPLETED = "completed", // 已完成
  FAILED = "failed",       // 失败
  WAITING = "waiting"      // 等待中
}
```

### 2.3 节点元数据结构

```typescript
interface DAGNode {
  // 唯一标识
  id: string;                    // 节点唯一ID
  name: string;                  // 节点名称（英文）
  displayName: string;          // 显示名称（中文）
  
  // 类型定义
  type: NodeType;                // 节点类型
  category: string;              // 所属类别（用户层/Emma常驻层/专业Agent层/活跃交互区）
  
  // 状态信息
  state?: AgentState;             // Agent 状态（Dormant/Engaged）
  status: NodeStatus;             // 执行状态
  
  // 执行上下文
  context?: {
    userInput?: string;           // 用户输入
    taskSummary?: string;         // 任务摘要
    conversationHistory?: Message[]; // 对话历史
  };
  
  // 元数据
  metadata: {
    createdAt: number;           // 创建时间戳
    updatedAt: number;           // 更新时间戳
    priority?: number;            // 优先级
    timeout?: number;            // 超时时间（毫秒）
    retryCount?: number;         // 重试次数
    maxRetries?: number;         // 最大重试次数
  };
  
  // 能力定义（仅专业Agent）
  capabilities?: string[];       // 支持的能力列表
  agentRole?: string;            // Agent 角色标识
}
```

### 2.4 各层级节点元数据详述

#### 2.4.1 用户层节点 (USER)

```typescript
interface UserNode extends DAGNode {
  type: NodeType.USER;
  category: "用户层";
  context: {
    userInput: string;           // 原始用户输入
    sessionId: string;           // 会话ID
    userId?: string;             // 用户ID
  };
}
```

#### 2.4.2 Emma 常驻层节点

```typescript
interface EmmaNode extends DAGNode {
  type: NodeType.EMMA_COORDINATOR;
  category: "Emma常驻层";
  state: AgentState.ENGAGED;     // Emma 始终处于活跃态
  
  // Emma 特有功能
  functions: {
    intentRecognition: boolean;  // 意图识别
    taskDecomposition: boolean;  // 任务分解
    agentSelection: boolean;     // Agent 选择
    resultAggregation: boolean; // 结果聚合
  };
}
```

#### 2.4.3 专业 Agent 层节点

```typescript
interface ProfessionalAgentNode extends DAGNode {
  type: NodeType.PROFESSIONAL_AGENT;
  category: "专业Agent层";
  state: AgentState;             // 动态变化：Dormant ↔ Engaged
  
  // Agent 定义
  agentRole: string;              // 角色标识
  agentName: string;              // 角色名称
  capabilities: string[];         // 专业能力列表
  
  // 任务信息
  currentTask?: {
    taskId: string;              // 当前任务ID
    taskSummary: string;         // 任务摘要
    assignedAt: number;          // 分配时间
  };
}
```

#### 2.4.4 活跃交互区节点

```typescript
interface ActiveStateNode extends DAGNode {
  type: NodeType.ACTIVE_STATE | NodeType.WORK_STATE | NodeType.INTERACTION_STATE;
  category: "活跃交互区";
  parentAgentId?: string;        // 所属 Agent ID
  
  // 交互信息
  interaction?: {
    messages: Message[];         // 交互消息
    handoffRequested?: boolean;  // 是否请求流转
    dependencies?: string[];     // 依赖的其他 Agent
  };
}
```

---

## 3. 边类型与元数据定义

### 3.1 边类型枚举

```typescript
enum EdgeType {
  CONTROL_FLOW = "control",       // 控制流：主流程
  INFORMATION_FLOW = "info",     // 信息流：数据传递
  CONDITIONAL = "conditional",    // 条件分支
  LISTENING = "listening",        // 监听流：旁听不干预
  NOTIFICATION = "notification"   // 通知流：事件通知
}
```

### 3.2 边元数据结构

```typescript
interface DAGEdge {
  // 标识
  id: string;                    // 边唯一ID
  source: string;                // 源节点ID
  target: string;                // 目标节点ID
  
  // 类型定义
  type: EdgeType;                // 边类型
  
  // 条件定义（条件分支边）
  condition?: {
    expression: string;          // 条件表达式
    description: string;         // 条件描述
    priority?: number;          // 优先级（多条件时）
  };
  
  // 边属性
  properties: {
    label?: string;              // 边标签（显示用）
    style?: "solid" | "dashed";  // 线条样式
    animated?: boolean;           // 是否动画
  };
  
  // 传递的数据
  payload?: {
    dataType: string;           // 数据类型
    schema?: object;            // 数据结构定义
  };
  
  // 元数据
  metadata: {
    createdAt: number;
    description?: string;
  };
}
```

### 3.3 边类型详述

| 边类型 | 样式 | 语义 | 示例 |
|--------|------|------|------|
| CONTROL_FLOW | 实线 | 主流程控制，顺序执行 | EMMA_LISTEN → EMMA_ANALYZE |
| INFORMATION_FLOW | 实线 | 数据/消息传递 | EMMA_SUMMARY → EMMA_INVITE |
| CONDITIONAL | 实线+标签 | 条件分支决策 | EMMA_DECIDE -->\|需要编剧\| SARAH |
| LISTENING | 虚线 | 旁听观察，不干预流程 | EMMA_MONITOR -.-> AGENT_INTERACT |
| NOTIFICATION | 实线 | 事件驱动通知 | AGENT_COMPLETE --> EMMA_RECEIVE |

---

## 4. 图级别元数据

```typescript
interface DAGMetadata {
  // 图信息
  id: string;
  name: string;
  version: string;
  description: string;
  
  // 图级别配置
  config: {
    maxConcurrency: number;      // 最大并发数
    defaultTimeout: number;      // 默认超时时间
    enableHandoff: boolean;       // 是否支持任务流转
    maxHandoffDepth: number;     // 最大流转深度
  };
  
  // 运行时状态
  runtime: {
    activeNodes: string[];        // 当前活跃节点
    completedNodes: string[];     // 已完成节点
    failedNodes: string[];        // 失败节点
    currentAgentId?: string;      // 当前执行的 Agent
  };
  
  // 执行统计
  statistics: {
    totalExecutions: number;     // 总执行次数
    averageDuration: number;      // 平均执行时长
    successRate: number;         // 成功率
  };
  
  // 时间戳
  createdAt: number;
  updatedAt: number;
}
```

---

## 5. 节点分类速查表

### 5.1 按层级分类

| 层级 | 节点 | 初始状态 | 状态转换 |
|------|------|---------|---------|
| 用户层 | USER | - | 一次性 |
| Emma常驻层 | EMMA_LISTEN, EMMA_ANALYZE, EMMA_DECIDE, EMMA_SUMMARY, EMMA_INVITE, EMMA_MONITOR, EMMA_RECEIVE, EMMA_EVALUATE, EMMA_DISMISS, EMMA_RESPOND | Active | 始终在线，循环执行 |
| 专业Agent层 | SARAH, OLIVER, DAVID, ALEX, BOB, ROBERT | Dormant | Dormant ↔ Engaged |
| 活跃交互区 | AGENT_ACTIVE, AGENT_WORK, AGENT_INTERACT, AGENT_COMPLETE, AGENT_HANDOFF | - | 临时状态 |

### 5.2 按功能分类

| 功能类型 | 节点 | 说明 |
|---------|------|------|
| 监听 | EMMA_LISTEN, EMMA_MONITOR | 持续监听用户输入和 Agent 状态 |
| 分析 | EMMA_ANALYZE | 意图识别和需求解析 |
| 决策 | EMMA_DECIDE, EMMA_EVALUATE | 选择合适的 Agent，评估后续流程 |
| 分发 | EMMA_SUMMARY, EMMA_INVITE | 生成摘要，邀请 Agent |
| 执行 | AGENT_WORK | Agent 执行专业任务 |
| 交互 | AGENT_INTERACT | Agent 与用户直接对话 |
| 完成 | AGENT_COMPLETE, EMMA_RECEIVE | 任务完成通知 |
| 流转 | AGENT_HANDOFF | 请求其他 Agent 协助 |
| 释放 | EMMA_DISMISS | 释放 Agent，状态回 Dormant |
| 回复 | EMMA_RESPOND, USER | 汇总结果，回复用户 |

---

## 6. 核心设计原则

1. **Emma 始终在线**：Emma 作为协调器始终处于活跃态，不参与具体业务执行，但管控全局流程
2. **按需激活**：专业 Agent 平时处于 Dormant 态，仅在需要时被激活（Engaged）
3. **状态可逆**：Agent 状态在 Dormant ↔ Engaged 之间转换
4. **直接对话**：特定场景下用户可绕过 Emma 与 Agent 直接交互
5. **任务流转**：Agent 可请求其他 Agent 协助，形成协作链
6. **非完整上下文**：Agent 间传递的是任务摘要，而非完整对话历史

---

## 7. 图结构示例（JSON 表示）

```json
{
  "metadata": {
    "id": "weimeng-agent-dag-v1",
    "name": "WeiMeng-Agent 工作流",
    "version": "1.0.0"
  },
  "nodes": [
    {
      "id": "USER",
      "name": "USER",
      "displayName": "用户输入",
      "type": "user",
      "category": "用户层",
      "status": "pending"
    },
    {
      "id": "EMMA_DECIDE",
      "name": "EMMA_DECIDE",
      "displayName": "Emma 决策",
      "type": "decision",
      "category": "Emma常驻层",
      "status": "pending"
    },
    {
      "id": "SARAH",
      "name": "SARAH",
      "displayName": "Sarah 编剧",
      "type": "agent",
      "category": "专业Agent层",
      "agentRole": "screenwriter",
      "agentName": "Sarah",
      "capabilities": ["剧本创作", "台词撰写", "情节设计"],
      "state": "dormant",
      "status": "pending"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "EMMA_DECIDE",
      "target": "SARAH",
      "type": "conditional",
      "condition": {
        "expression": "needsScreenwriter",
        "description": "需要编剧"
      }
    }
  ]
}
```
