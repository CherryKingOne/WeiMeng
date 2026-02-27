graph TD
    subgraph 用户层
        USER[("👤 用户输入")]
    end

    subgraph Emma常驻层["Emma 常驻层（Active）"]
        EMMA_LISTEN["Emma 监听<br/>始终在线"]
        EMMA_DECIDE{"Emma 决策<br/>需要哪个专业Agent?"}
        EMMA_SUMMARY["Emma 生成任务摘要<br/>（非完整上下文）"]
        EMMA_INVITE["Emma 邀请Agent<br/>状态: Dormant → Engaged"]
        EMMA_MONITOR["Emma 旁听<br/>（不干预直接对话）"]
        EMMA_RECEIVE["Emma 接收完成通知"]
        EMMA_EVALUATE{"Emma 评估<br/>是否需要下一个Agent?"}
        EMMA_DISMISS["Emma 释放Agent<br/>状态: Engaged → Dormant"]
        EMMA_RESPOND["Emma 汇总结果<br/>回复用户"]
    end

    subgraph 专业Agent层["专业 Agent 层（Dormant ↔ Engaged）"]
        SARAH["📝 Sarah 编剧<br/>初始: Dormant"]
        OLIVER["🎬 Oliver 动画师<br/>初始: Dormant"]
        DAVID["📐 David 分镜师<br/>初始: Dormant"]
        ALEX["✂️ Alex 剪辑师<br/>初始: Dormant"]
        BOB["🎨 Bob 角色设计<br/>初始: Dormant"]
        ROBERT["🔊 Robert 音效师<br/>初始: Dormant"]
    end

    subgraph 交互态["活跃交互区（Engaged）"]
        AGENT_ACTIVE["专业Agent 活跃态"]
        AGENT_WORK["Agent 执行专业任务"]
        AGENT_INTERACT["Agent ↔ 用户 直接对话"]
        AGENT_COMPLETE["Agent 任务完成通知"]
        AGENT_HANDOFF["Agent 请求流转<br/>需要其他Agent协助"]
    end

    %% 主流程
    USER -->|"所有消息先到"| EMMA_LISTEN
    EMMA_LISTEN --> EMMA_DECIDE

    %% Emma决策分支 - 动态选择
    EMMA_DECIDE -->|"需要编剧"| SARAH
    EMMA_DECIDE -->|"需要动画师"| OLIVER
    EMMA_DECIDE -->|"需要分镜师"| DAVID
    EMMA_DECIDE -->|"需要剪辑师"| ALEX
    EMMA_DECIDE -->|"需要角色设计"| BOB
    EMMA_DECIDE -->|"需要音效师"| ROBERT
    EMMA_DECIDE -->|"Emma可直接处理"| EMMA_RESPOND

    %% 邀请流程
    SARAH & OLIVER & DAVID & ALEX & BOB & ROBERT -.->|"被选中"| EMMA_SUMMARY
    EMMA_SUMMARY -->|"任务摘要<br/>非完整历史"| EMMA_INVITE
    EMMA_INVITE --> AGENT_ACTIVE

    %% 活跃态交互
    AGENT_ACTIVE --> AGENT_WORK
    AGENT_WORK --> AGENT_INTERACT
    USER -.->|"直接对话<br/>绕过Emma"| AGENT_INTERACT
    EMMA_MONITOR -.->|"旁听不干预"| AGENT_INTERACT

    %% 完成或流转
    AGENT_INTERACT --> AGENT_COMPLETE
    AGENT_INTERACT --> AGENT_HANDOFF

    AGENT_COMPLETE -->|"通知Emma"| EMMA_RECEIVE
    AGENT_HANDOFF -->|"通知Emma需要其他Agent"| EMMA_RECEIVE

    EMMA_RECEIVE --> EMMA_EVALUATE

    %% 评估后续
    EMMA_EVALUATE -->|"需要下一个Agent"| EMMA_DISMISS
    EMMA_DISMISS -->|"释放当前Agent"| EMMA_DECIDE
    EMMA_EVALUATE -->|"全部完成"| EMMA_DISMISS
    EMMA_DISMISS -->|"所有任务完成"| EMMA_RESPOND
    EMMA_RESPOND --> USER

    %% 样式
    classDef emma fill:#FF6B6B,stroke:#333,stroke-width:3px,color:#fff
    classDef dormant fill:#95A5A6,stroke:#333,stroke-width:1px,color:#fff
    classDef engaged fill:#2ECC71,stroke:#333,stroke-width:2px,color:#fff
    classDef user fill:#3498DB,stroke:#333,stroke-width:2px,color:#fff
    classDef decision fill:#F39C12,stroke:#333,stroke-width:2px,color:#fff
    classDef active fill:#9B59B6,stroke:#333,stroke-width:2px,color:#fff

    class EMMA_LISTEN,EMMA_SUMMARY,EMMA_INVITE,EMMA_MONITOR,EMMA_RECEIVE,EMMA_DISMISS,EMMA_RESPOND emma
    class EMMA_DECIDE,EMMA_EVALUATE decision
    class SARAH,OLIVER,DAVID,ALEX,BOB,ROBERT dormant
    class AGENT_ACTIVE,AGENT_WORK,AGENT_INTERACT,AGENT_COMPLETE,AGENT_HANDOFF active
    class USER user