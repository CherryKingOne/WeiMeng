# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeiMeng is an intelligent video production platform currently under active development. The project aims to build a multi-agent collaboration system powered by Large Language Models (LLMs) for automated video production workflows.

**Current Development Status:**

- **Implemented Features:**
  - User authentication (registration, login, password reset)
  - Email verification code (captcha) service
  - Frontend dashboard with project management, asset library, and workflow editor interfaces
  - DDD-based backend architecture with clean layer separation

- **Planned Features (Not Yet Implemented):**
  - Multi-agent system with 7 specialized agents (Screenwriter, Director, Storyboard, Scene Design, Character Design, Art Design, Editing)
  - LangChain/LangGraph-based agent orchestration
  - Central dispatcher and task orchestrator for agent coordination
  - LLM provider abstraction supporting multiple vendors (OpenAI, Anthropic, Azure, Google, DeepSeek, local models)

**Technology Selection:**
- Agent framework: LangChain, LangGraph, LangFuse (dependencies declared, implementation pending)
- The `backend/src/modules/agent/` directory structure is scaffolded but empty

## Development Commands

### Backend (FastAPI + Python 3.10+)

```bash
# Install dependencies (uses uv package manager)
cd backend && uv sync

# Run development server
cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 5607 --reload

# Run tests
cd backend && uv run pytest

# Run specific test
cd backend && uv run pytest tests/unit/auth/test_login.py -v

# Run tests with coverage
cd backend && uv run pytest --cov=src --cov-report=html
```

### Frontend (Next.js 16 + React 19)

```bash
# Install dependencies
cd frontend && npm install

# Run development server (port 5678)
cd frontend && npm run dev

# Build for production
cd frontend && npm run build

# Run production server
cd frontend && npm start

# Lint check
cd frontend && npm run lint
```

### Docker Deployment

```bash
# Start all services (API, frontend, PostgreSQL, Redis)
cd docker && docker compose up -d --build

# View logs
cd docker && docker compose logs -f

# Stop services
cd docker && docker compose down
```

## Architecture Overview

### Backend Architecture (DDD-based)

The backend follows Domain-Driven Design with clear layer separation:

- **API Layer** (`src/api/v1/`): FastAPI routes and endpoint definitions
- **Application Layer** (`modules/*/application/`): Use cases, DTOs, and application services
- **Domain Layer** (`modules/*/domain/`): Business entities, domain services, repository interfaces
- **Infrastructure Layer** (`modules/*/infrastructure/`): Repository implementations, ORM models, external integrations

### Module Structure Pattern

Each business module (auth, captcha, agent) follows this structure:
```
module_name/
├── api/              # HTTP endpoints and routing
├── application/      # Application services and DTOs
│   ├── dto/
│   └── services/
├── domain/           # Core business logic
│   ├── entities/
│   ├── repositories/
│   └── services/
└── infrastructure/   # External integrations
    ├── models/       # SQLAlchemy models
    ├── repositories/ # Repository implementations
    └── mappers/      # Domain-to-model mapping
```

### Shared Infrastructure

Located in `backend/src/shared/`:
- **infrastructure/**: Database (SQLAlchemy 2.0 async), Redis, Unit of Work
- **security/**: JWT token handling, password hashing
- **middleware/**: Logging, error handling
- **domain/**: Base classes for entities, value objects, exceptions
- **extensions/**: Email service (aiosmtplib)

### Agent Architecture

The agent module is designed for LangChain/LangGraph integration with a planned 7-agent system. Key concepts from `目录结构.md`:

- **LLM Provider Abstraction**: Factory pattern supporting multiple providers (OpenAI, Anthropic, Azure, Google, DeepSeek, local models via Ollama)
- **Agent Base Classes**: BaseAgent with execute(), memory management, and tool integration
- **Team Coordination**: LangGraph StateGraph for workflow orchestration with conditional routing
- **Task State Management**: Traceable, interruptible, reversible task states

The agent workflow follows: Researcher → Planner → Code Generator → Reviewer (conditional) → Executor → QA (conditional) → Reporter

## Important Implementation Notes

### Database and ORM

- Uses **SQLAlchemy 2.0** with async support (`AsyncSession`, `create_async_engine`)
- Database initialization happens in `main.py` lifespan context
- Models are in `infrastructure/models/`, domain entities in `domain/entities/`
- Use mappers to convert between ORM models and domain entities
- Unit of Work pattern for transaction management

### Authentication and Security

- JWT tokens with expiration tracking
- Password hashing via bcrypt
- Token validation through FastAPI dependencies
- Session management via Redis

### Configuration

All configuration is centralized in `backend/config/`:
- `settings.py`: Application settings
- `database.py`: PostgreSQL configuration
- `redis.py`: Redis configuration
- `email.py`: SMTP configuration
- `ai.py`: LLM API keys (OpenAI, LangFuse)

Environment variables are loaded from `.env` file using pydantic-settings.

### Testing Strategy

- Test framework: pytest with async support
- Test database: Separate PostgreSQL instance (configured in `conftest.py`)
- Fixtures: `db_session` for database tests, `client` for API tests
- Test organization: `unit/` for isolated tests, `integration/test_api/` for API endpoint tests
- All test functions must be async and use `async with` for session management

### Frontend Architecture

- **App Router** structure in `frontend/app/`
- **State Management**: Zustand stores in `frontend/stores/`
- **API Layer**: HTTP clients in `frontend/services/`
- **Component Organization**:
  - `components/ui/`: Reusable UI components
  - `components/features/`: Business-specific components
  - `components/layout/`: Layout components
- **Styling**: Tailwind CSS 4 with utility classes

## Coding Conventions

### Python Style
- 4-space indentation
- snake_case for variables, functions, modules
- PascalCase for classes
- Type hints required for function signatures
- Async/await for all I/O operations

### TypeScript Style
- 2-space indentation
- Functional components preferred
- Path aliases: Use `@/` for imports (e.g., `@/components/ui/Button`)
- Prop types: Use TypeScript interfaces, not PropTypes

### No Emoji Policy
- **Never** include emoji characters in code, comments, UI text, or commit messages
- This is enforced through the `no-emoji-policy` skill

## Key Dependencies

### Backend
- **Web**: FastAPI 0.128+, Uvicorn 0.40+
- **AI/ML**: LangChain 1.2+, LangGraph 1.0+, LangSmith 0.6+, LangFuse 3.12+
- **Database**: SQLAlchemy 2.0+, asyncpg 0.31+, psycopg 3.3+
- **Cache**: redis 7.1+
- **Security**: python-jose, bcrypt 4.0+
- **LLM Integration**: openai 1.0+, langchain-openai 1.1+

### Frontend
- **Framework**: Next.js 16.1, React 19.2
- **State**: Zustand 5.0
- **HTTP**: Axios 1.13+
- **Styling**: Tailwind CSS 4
- **Icons**: lucide-react 0.563+

## Service Ports

- Frontend: `5678`
- Backend API: `5607`
- PostgreSQL: `5400` (external), `5432` (container)
- Redis: `6379`
- API Documentation: http://localhost:5607/docs

## When Adding New Features

### Backend Module
1. Create domain entities first in `domain/entities/`
2. Define repository interface in `domain/repositories/`
3. Implement application service in `application/services/`
4. Create DTOs for request/response in `application/dto/`
5. Implement repository in `infrastructure/repositories/`
6. Add API routes in `api/router.py`
7. Write unit tests for domain logic and integration tests for API

### Frontend Feature
1. Define TypeScript types in `types/`
2. Create API client in `services/`
3. Build UI components in `components/features/`
4. Add Zustand store if state management needed
5. Create route in appropriate `app/` subdirectory
6. Test manually and verify with `npm run lint`

## Multi-Agent System Guidelines

When working with the agent system:
- Each agent should be self-contained with its own tools and prompt
- Use LangGraph's StateGraph for orchestration, not direct agent-to-agent calls
- Implement conditional edges for decision points (e.g., review approval, QA pass/fail)
- Store task state in the database for traceability and resumability
- Design agents to be provider-agnostic through the LLM factory pattern
- Use LangFuse for observability and debugging of agent interactions
