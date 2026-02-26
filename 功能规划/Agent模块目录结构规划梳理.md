# WeiMeng-Agent 模块目录结构规划

## 1. 技术架构概览

基于 LangGraph + LangChain 的技术选型：

- **LangGraph**：负责状态管理、工作流编排、DAG 状态机驱动
- **LangChain**：负责 Agent 能力封装、LLM 调用、工具集成

---

## 2. 整体目录结构

```
backend/src/modules/agent/
├── __init__.py
├── config/
│   ├── __init__.py
│   └── agent_config.py          # Agent 相关配置
│
├── domain/                       # 领域层 - 核心业务实体
│   ├── __init__.py
│   ├── entities/
│   │   ├── __init__.py
│   │   ├── agent.py             # Agent 实体
│   │   ├── task.py              # 任务实体
│   │   ├── session.py           # 会话实体
│   │   └── message.py           # 消息实体
│   │
│   ├── value_objects/
│   │   ├── __init__.py
│   │   ├── agent_state.py       # Agent 状态值对象
│   │   ├── node_status.py      # 节点状态值对象
│   │   └── capabilities.py      # 能力定义值对象
│   │
│   ├── events/
│   │   ├── __init__.py
│   │   ├── base.py              # 事件基类
│   │   ├── agent_events.py     # Agent 相关事件
│   │   └── task_events.py      # 任务相关事件
│   │
│   └── exceptions/
│       ├── __init__.py
│       └── agent_exceptions.py  # Agent 异常定义
│
├── application/                 # 应用层 - 用例编排
│   ├── __init__.py
│   ├── dto/
│   │   ├── __init__.py
│   │   ├── agent_dto.py        # Agent DTO
│   │   ├── task_dto.py         # 任务 DTO
│   │   └── chat_dto.py         # 对话 DTO
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── chat_service.py     # 对话服务
│   │   ├── task_service.py     # 任务服务
│   │   └── session_service.py  # 会话服务
│   │
│   └── interfaces/
│       ├── __init__.py
│       └── agent_factory.py    # Agent 工厂接口
│
├── infrastructure/              # 基础设施层
│   ├── __init__.py
│   ├── persistence/
│   │   ├── __init__.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── agent_model.py      # Agent ORM 模型
│   │   │   ├── task_model.py       # 任务 ORM 模型
│   │   │   ├── session_model.py    # 会话 ORM 模型
│   │   │   └── message_model.py    # 消息 ORM 模型
│   │   │
│   │   └── repositories/
│   │       ├── __init__.py
│   │       ├── agent_repository.py
│   │       ├── task_repository.py
│   │       ├── session_repository.py
│   │       └── message_repository.py
│   │
│   ├── llm/
│   │   ├── __init__.py
│   │   ├── providers/
│   │   │   ├── __init__.py
│   │   │   ├── openai_provider.py
│   │   │   ├── anthropic_provider.py
│   │   │   └── base.py            # LLM 提供商基类
│   │   │
│   │   └── embeddings/
│   │       ├── __init__.py
│   │       └── base.py
│   │
│   └── cache/
│       ├── __init__.py
│       └── redis_cache.py
│
├── graph/                       # LangGraph 核心 - 状态图定义
│   ├── __init__.py
│   ├── state/
│   │   ├── __init__.py
│   │   ├── agent_state.py       # LangGraph AgentState 状态定义
│   │   └── schema.py            # 状态 schema 定义
│   │
│   ├── nodes/                   # 图节点 - 对应 DAG 节点
│   │   ├── __init__.py
│   │   ├── emma/
│   │   │   ├── __init__.py
│   │   │   ├── listen.py        # Emma 监听节点
│   │   │   ├── analyze.py      # Emma 需求解析节点
│   │   │   ├── decide.py       # Emma 决策节点
│   │   │   ├── summary.py      # Emma 生成摘要节点
│   │   │   ├── invite.py       # Emma 邀请 Agent 节点
│   │   │   ├── monitor.py      # Emma 旁听节点
│   │   │   ├── receive.py      # Emma 接收完成通知节点
│   │   │   ├── evaluate.py     # Emma 评估节点
│   │   │   ├── dismiss.py      # Emma 释放 Agent 节点
│   │   │   └── respond.py      # Emma 汇总回复节点
│   │   │
│   │   ├── agents/              # 专业 Agent 节点
│   │   │   ├── __init__.py
│   │   │   ├── base.py         # Agent 基础节点
│   │   │   ├── screenwriter.py # Sarah 编剧 Agent
│   │   │   ├── animator.py     # Oliver 动画师 Agent
│   │   │   ├── storyboard.py   # David 分镜师 Agent
│   │   │   ├── editor.py       # Alex 剪辑师 Agent
│   │   │   ├── designer.py     # Bob 角色设计 Agent
│   │   │   └── sound.py        # Robert 音效师 Agent
│   │   │
│   │   └── common/              # 通用节点
│   │       ├── __init__.py
│   │       ├── active.py        # Agent 活跃态节点
│   │       ├── work.py          # Agent 执行任务节点
│   │       ├── interact.py     # Agent 与用户交互节点
│   │       ├── complete.py      # 任务完成节点
│   │       └── handoff.py       # 任务流转节点
│   │
│   ├── edges/                   # 图边 - 对应 DAG 边
│   │   ├── __init__.py
│   │   ├── conditional.py       # 条件边
│   │   ├── control.py           # 控制流边
│   │   └── listener.py          # 监听边
│   │
│   ├── compiler/
│   │   ├── __init__.py
│   │   └── workflow_compiler.py  # 工作流编译器
│   │
│   └── registry/
│       ├── __init__.py
│       └── node_registry.py     # 节点注册表
│
├── agents/                      # LangChain Agent 封装
│   ├── __init__.py
│   ├── base/
│   │   ├── __init__.py
│   │   ├── base_agent.py       # Agent 基类
│   │   └── agent_protocol.py   # Agent 协议定义
│   │
│   ├── emma/
│   │   ├── __init__.py
│   │   ├── emma_coordinator.py # Emma 协调器
│   │   └── tools.py            # Emma 工具集
│   │
│   └── professionals/          # 专业 Agent
│       ├── __init__.py
│       ├── base.py             # 专业 Agent 基类
│       ├── screenwriter.py     # Sarah 编剧
│       ├── animator.py         # Oliver 动画师
│       ├── storyboard.py        # David 分镜师
│       ├── editor.py           # Alex 剪辑师
│       ├── designer.py         # Bob 角色设计
│       └── sound_engineer.py    # Robert 音效师
│
├── prompts/                     # 提示词工程目录
│   ├── __init__.py
│   ├── base.py                 # 提示词基类和模板
│   │
│   ├── emma/                   # Emma 协调器提示词
│   │   ├── __init__.py
│   │   ├── system.py           # Emma 系统提示词
│   │   ├── intent_analysis.py  # 意图分析提示词
│   │   ├── agent_selection.py  # Agent 选择提示词
│   │   ├── task_summary.py     # 任务摘要提示词
│   │   ├── result_aggregation.py # 结果聚合提示词
│   │   └── evaluation.py       # 评估提示词
│   │
│   └── professionals/          # 专业 Agent 提示词
│       ├── __init__.py
│       ├── base.py             # 专业 Agent 提示词基类
│       ├── screenwriter.py     # Sarah 编剧提示词
│       ├── animator.py         # Oliver 动画师提示词
│       ├── storyboard.py        # David 分镜师提示词
│       ├── editor.py           # Alex 剪辑师提示词
│       ├── designer.py         # Bob 角色设计提示词
│       └── sound_engineer.py    # Robert 音效师提示词
│
├── tools/                       # Agent 工具集
│   ├── __init__.py
│   ├── base.py                 # 工具基类
│   ├── search.py               # 搜索工具
│   ├── memory.py               # 记忆工具
│   ├── file_ops.py             # 文件操作工具
│   └── web_fetch.py            # 网页获取工具
│
├── memory/                      # 记忆系统
│   ├── __init__.py
│   ├── base.py                 # 记忆基类
│   ├── buffer.py               # 对话缓冲
│   ├── summary.py              # 摘要记忆
│   └── vector_store.py         # 向量存储
│
└── api/
    ├── __init__.py
    ├── router.py                # API 路由
    ├── dependencies.py         # API 依赖
    └── schemas.py              # API Schema
```

---

## 3. 目录结构与 DAG 映射关系

### 3.1 节点映射

| DAG 节点 | 代码位置 | 说明 |
|---------|---------|------|
| USER | `graph/state/agent_state.py` | 用户输入作为状态的一部分 |
| EMMA_LISTEN | `graph/nodes/emma/listen.py` | 监听用户输入 |
| EMMA_ANALYZE | `graph/nodes/emma/analyze.py` | 意图识别 |
| EMMA_DECIDE | `graph/nodes/emma/decide.py` | 决策选择 Agent |
| EMMA_SUMMARY | `graph/nodes/emma/summary.py` | 生成任务摘要 |
| EMMA_INVITE | `graph/nodes/emma/invite.py` | 邀请激活 Agent |
| EMMA_MONITOR | `graph/nodes/emma/monitor.py` | 旁听不干预 |
| EMMA_RECEIVE | `graph/nodes/emma/receive.py` | 接收完成通知 |
| EMMA_EVALUATE | `graph/nodes/emma/evaluate.py` | 评估是否需要下一个 Agent |
| EMMA_DISMISS | `graph/nodes/emma/dismiss.py` | 释放 Agent |
| EMMA_RESPOND | `graph/nodes/emma/respond.py` | 汇总回复用户 |
| SARAH | `graph/nodes/agents/screenwriter.py` | 编剧 Agent |
| OLIVER | `graph/nodes/agents/animator.py` | 动画师 Agent |
| DAVID | `graph/nodes/agents/storyboard.py` | 分镜师 Agent |
| ALEX | `graph/nodes/agents/editor.py` | 剪辑师 Agent |
| BOB | `graph/nodes/agents/designer.py` | 角色设计 Agent |
| ROBERT | `graph/nodes/agents/sound.py` | 音效师 Agent |
| AGENT_ACTIVE | `graph/nodes/common/active.py` | Agent 活跃态 |
| AGENT_WORK | `graph/nodes/common/work.py` | Agent 执行任务 |
| AGENT_INTERACT | `graph/nodes/common/interact.py` | Agent 与用户交互 |
| AGENT_COMPLETE | `graph/nodes/common/complete.py` | 任务完成 |
| AGENT_HANDOFF | `graph/nodes/common/handoff.py` | 任务流转 |

### 3.2 边映射

| DAG 边类型 | 代码位置 | 说明 |
|-----------|---------|------|
| CONTROL_FLOW | `graph/edges/control.py` | 主流程控制 |
| CONDITIONAL | `graph/edges/conditional.py` | 条件分支 |
| LISTENING | `graph/edges/listener.py` | 监听流 |

---

## 4. 核心模块说明

### 4.1 LangGraph 状态定义

```python
# graph/state/agent_state.py
from typing import TypedDict, Annotated, Sequence
from langgraph.graph import add_messages

class AgentState(TypedDict):
    """LangGraph Agent 状态定义"""
    
    # 基础信息
    session_id: str
    user_id: str
    user_input: str
    
    # 当前状态
    current_node: str                    # 当前执行的节点
    active_agents: list[str]             # 当前活跃的 Agent 列表
    
    # Agent 状态映射
    agent_states: dict[str, str]         # agent_id -> state (DORMANT/ENGAGED)
    
    # 任务信息
    current_task: dict | None
    task_history: list[dict]
    
    # 对话历史
    messages: Annotated[list, add_messages]
    
    # 上下文
    context: dict
    
    # 执行结果
    result: dict | None
    error: str | None
```

### 4.2 Emma 协调器 (LangChain Agent)

```python
# agents/emma/emma_coordinator.py
from langchain.agents import Agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

class EmmaCoordinator:
    """Emma 协调器 - 负责全局调度"""
    
    def __init__(self, llm: ChatOpenAI):
        self.llm = llm
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "你是一个多智能体协调器，负责分析用户意图并选择合适的专业 Agent..."),
            ("human", "{user_input}")
        ])
    
    def analyze_intent(self, user_input: str) -> dict:
        """分析用户意图"""
        ...
    
    def select_agents(self, intent: dict) -> list[str]:
        """选择合适的 Agent"""
        ...
    
    def generate_summary(self, context: dict) -> str:
        """生成任务摘要"""
        ...
    
    def aggregate_results(self, results: list[dict]) -> str:
        """聚合结果"""
        ...
```

### 4.3 专业 Agent 基类

```python
# agents/professionals/base.py
from langchain.agents import Agent
from abc import ABC, abstractmethod

class BaseProfessionalAgent(ABC):
    """专业 Agent 基类"""
    
    def __init__(
        self,
        name: str,
        role: str,
        capabilities: list[str],
        llm,
        tools: list = None
    ):
        self.name = name
        self.role = role
        self.capabilities = capabilities
        self.llm = llm
        self.tools = tools or []
    
    @abstractmethod
    def execute_task(self, task: dict) -> dict:
        """执行专业任务"""
        pass
    
    @abstractmethod
    def can_handle(self, task: dict) -> bool:
        """判断是否能处理该任务"""
        pass
    
    def get_capabilities(self) -> list[str]:
        return self.capabilities
```

---

## 5. 状态流转图

```
                    ┌─────────────────────────────────────────────────┐
                    │                    USER                          │
                    └─────────────────────┬───────────────────────────┘
                                          │
                    ┌─────────────────────▼───────────────────────────┐
                    │              EMMA_LISTEN                         │
                    │         (监听用户输入)                            │
                    └─────────────────────┬───────────────────────────┘
                                          │
                    ┌─────────────────────▼───────────────────────────┐
                    │              EMMA_ANALYZE                        │
                    │         (意图识别/需求解析)                       │
                    └─────────────────────┬───────────────────────────┘
                                          │
                    ┌─────────────────────▼───────────────────────────┐
                    │              EMMA_DECIDE                         │
                    │         (决策: 选择哪个 Agent)                    │
                    └──────┬────────────────────────────────────────────┘
                           │
     ┌──────────┬──────────┼──────────┬──────────┬──────────┐
     │          │          │          │          │          │
     ▼          ▼          ▼          ▼          ▼          ▼
  SARAH      OLIVER     DAVID      ALEX       BOB      ROBERT
 (编剧)     (动画师)   (分镜师)   (剪辑师)   (角色设计) (音效师)
  Dormant   Dormant    Dormant    Dormant    Dormant   Dormant
     │          │          │          │          │          │
     └──────────┴──────────┴──────────┼──────────┴──────────┘
                                      │
                    ┌─────────────────▼───────────────────────────┐
                    │            EMMA_INVITE                        │
                    │      (状态: Dormant → Engaged)                │
                    └─────────────────────┬───────────────────────────┘
                                          │
                    ┌─────────────────────▼───────────────────────────┐
                    │            AGENT_ACTIVE                         │
                    │         (Agent 活跃态)                           │
                    └─────────────────────┬───────────────────────────┘
                                          │
                    ┌─────────────────────▼───────────────────────────┐
                    │             AGENT_WORK                          │
                    │         (执行专业任务)                           │
                    └─────────────────────┬───────────────────────────┘
                                          │
                    ┌─────────────────────▼───────────────────────────┐
                    │           AGENT_INTERACT                        │
                    │      (Agent ↔ 用户直接对话)                     │
                    │         (Emma 旁听不干预)                        │
                    └──────┬────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    AGENT_COMPLETE   AGENT_HANDOFF    (继续交互)
           │               │
           └───────┬───────┘
                   │
    ┌──────────────▼──────────────────────────┐
    │             EMMA_RECEIVE                 │
    │        (接收完成/流转通知)               │
    └─────────────────────┬────────────────────┘
                          │
    ┌─────────────────────▼───────────────────┐
    │            EMMA_EVALUATE                  │
    │      (评估是否需要下一个 Agent)           │
    └──────┬────────────────────────────────────┘
           │
    ┌──────┼────────────────────┐
    │      │                    │
    ▼      ▼                    ▼
需要下一个              全部完成
    │
    ▼
EMMA_DISMISS
    │
    ▼
返回 EMMA_DECIDE
    │
    ▼
EMMA_RESPOND ──────────────────────► USER
```

---

## 6. 层级职责说明

| 层级 | 目录 | 职责 |
|------|------|------|
| **domain** | `domain/` | 核心业务实体、值对象、事件、异常 |
| **graph** | `graph/` | LangGraph 状态图、节点、边定义 |
| **agents** | `agents/` | LangChain Agent 封装 |
| **prompts** | `prompts/` | 提示词工程（Emma + 专业 Agent 提示词） |
| **tools** | `tools/` | Agent 可用工具集 |
| **memory** | `memory/` | 记忆系统（对话缓冲、摘要、向量存储） |
| **application** | `application/` | 用例服务、DTO 定义 |
| **infrastructure** | `infrastructure/` | 持久化、LLM 提供商、缓存 |
| **api** | `api/` | FastAPI 路由、Schema |

---

## 7. 关键设计原则

### 7.1 状态驱动
- 使用 LangGraph 的 `StateGraph` 管理状态
- 所有节点通过状态共享数据，而非直接调用
- 状态包含完整的执行上下文

### 7.2 节点解耦
- 每个 DAG 节点对应一个独立的 Python 模块
- 节点之间通过边（edges）定义流转关系
- 支持动态添加/删除节点

### 7.3 Agent 抽象
- 统一使用 LangChain 的 Agent 抽象
- 专业 Agent 继承基类，实现 `execute_task` 方法
- Emma 协调器作为特殊的 LangChain Agent

### 7.4 提示词工程
- 提示词独立管理，按 Agent 类型分类存储
- `prompts/emma/` 存放 Emma 协调器的所有提示词
- `prompts/professionals/` 存放各专业 Agent 的提示词
- 支持提示词热更新和版本管理
- 使用结构化模板便于维护和调试

### 7.5 工具系统
- 工具使用 LangChain 的 Tool 接口
- 按需加载工具，不使用的 Agent 不加载
- 支持工具动态注册

### 7.6 记忆系统
- 对话历史使用 BufferMemory
- 关键信息提取使用 SummaryMemory
- 向量存储用于长期记忆检索
