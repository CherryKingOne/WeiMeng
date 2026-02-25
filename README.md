<div align="center">
  <img src="docs/image/logo.png" alt="WeiMeng Logo" width="200"/>
  <p>
    <strong>A Multi-Agent System for Automated Video Production</strong>
  </p>
  <p>
    <a href="README_zh-CN.md">中文文档</a> | <strong>English</strong>
  </p>
</div>

---

## 📖 Introduction

WeiMeng is an advanced multi-agent system designed to automate the video production workflow. It bridges the gap between conceptual multi-agent designs and engineering-level system implementation.

## 🚀 Getting Started

### Docker Deployment

```bash
cd WeiMeng
cd docker
cp .env.example .env
docker compose up -d
```

The core design principles are:
- **Unified Entry**: Users interact with the system through a unified interface.
- **Centralized Scheduling**: All Agents coordinate through a central dispatcher, avoiding direct peer-to-peer chatter.
- **Task-First**: Tasks are first-class citizens; Agents are executors.
- **Traceable State**: Task states are fully traceable, interruptible, and reversible.

## 🏗 System Architecture

The system is composed of a central dispatcher, task planner, and specialized Execution Agents (Storyboard, Art Director, Animation/Editing).

![System Architecture](docs/image/System%20Architecture%20Diagram.png)

### Architecture Highlights
- **Central Dispatcher**
  - The system's "Controller"
  - Unified user request intake
  - Coordinates all modules
- **Task Orchestrator**
  - The system's "Central Nervous System"
  - Decomposes tasks, dispatches them, collects results, and tracks status.
  - The source of all tasks for other Agents.
- **Execution Agents**
  - Storyboard / Art Director / Animation & Editing.
  - Only care about "what I need to do in this step".
  - Do not perceive the user's existence.
- **Task State Store**
  - Task lifecycle and state machine.
  - Supports interruption, failure, and retries.

## 🔄 Task Flow

The system ensures a structured lifecycle for every task, from creation to completion.

![Task State Flow](docs/image/Single%20Task%20Full%20Lifecycle%20-%20Task%20Status%20Flow.png)

## 📂 Documentation

Detailed documentation is available in the `docs` directory:

- [Development Guide](docs/Development_Guide.md): Comprehensive guide on system design and implementation.
- [System Architecture Notes](docs/System_Architecture_Notes.md): Detailed notes on the system structure.
- [State Flow Responsibility](docs/State_Flow_Responsibility.md): Breakdown of responsibilities across different task states.

## 📁 Directory Structure

```
WeiMeng/
├── backend/                # Backend source code (Python/FastAPI)
│   ├── src/
│   │   ├── agent/          # Agent core logic (dispatcher, planner, skills)
│   │   ├── core/           # System configuration, database, security
│   │   ├── captchaSend/    # Email verification service
│   │   ├── login/          # Authentication service
│   │   └── register/       # User registration service
│   ├── main.py             # Application entry point
│   └── ...                 # Config files (Dockerfile, pyproject.toml, etc.)
├── frontend/               # Frontend source code (Next.js/React)
│   ├── app/                # Application pages and components
│   ├── public/             # Static assets (images, icons)
│   └── ...                 # Config files (package.json, Dockerfile, etc.)
├── docs/                   # Documentation files
│   ├── image/              # Images and diagrams
│   └── ...                 # Design guides and architecture notes
├── 原型图/                  # HTML prototypes
│   └── pages/              # Prototype pages
└── README.md               # Project entry point
```

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

**IMPORTANT: Logo Usage Restrictions**
The project logo (`docs/image/logo.png`) is NOT covered by the standard Apache License 2.0 permissions:
1. **Non-Commercial**: You may NOT use the logo for any commercial purposes.
2. **No Modifications**: You must NOT modify, alter, or distort the logo image.
