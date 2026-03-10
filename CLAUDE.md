# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeiMeng is an intelligent multi-agent collaboration system powered by Large Language Models (LLMs), designed to automate video production workflows. Built with LangChain and LangGraph, it bridges the gap between conceptual multi-agent designs and engineering-level system implementation.

**Core Design Principles:**
- **Unified Entry**: Users interact with the system through a unified interface
- **Centralized Scheduling**: All agents coordinate through a central dispatcher, avoiding direct peer-to-peer communication
- **Task-First**: Tasks are first-class citizens; agents are executors
- **Traceable State**: Task states are fully traceable, interruptible, and reversible

## Tech Stack

### Backend
- **Framework**: FastAPI + Python 3.10+
- **Package Manager**: uv (see `backend/pyproject.toml`)
- **Architecture**: Modular DDD-style architecture with clear layer separation (API -> application -> domain -> infrastructure)
- **Database**: PostgreSQL + SQLAlchemy 2.0 async support
- **Cache**: Redis for session management and caching
- **AI Integration**: LangChain, LangGraph, LangFuse, OpenAI
- **Storage**: MinIO for object storage
- **Search**: Elasticsearch for content indexing

### Frontend
- **Framework**: Next.js 16.1 + React 19, using App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand stores in `frontend/stores/`
- **Internationalization**: Routes under `frontend/app/[locale]/`
- **Import Alias**: `@/*` maps to `frontend/*` (configured in `frontend/tsconfig.json`)
- **Build Output**: Standalone mode enabled for Docker deployment (`output: "standalone"` in `next.config.ts`)

## Project Structure

```
WeiMeng/
├── backend/                    # Backend source code
│   ├── src/
│   │   ├── modules/            # Business modules (auth, captcha, scripts)
│   │   │   ├── {module}/
│   │   │   │   ├── api/        # API routes
│   │   │   │   ├── application/  # Application layer (DTOs, services)
│   │   │   │   ├── domain/     # Domain layer (entities, repositories)
│   │   │   │   └── infrastructure/  # Infrastructure (models, mappers)
│   │   │   └── ...
│   │   ├── shared/             # Shared infrastructure
│   │   │   ├── common/         # Common utilities
│   │   │   ├── domain/         # Domain base classes
│   │   │   ├── infrastructure/ # Infrastructure (database, Redis)
│   │   │   ├── security/       # Security components (JWT, password)
│   │   │   ├── middleware/     # Middleware
│   │   │   └── extensions/     # Extensions (email, storage)
│   │   └── api/                # API routes
│   │       └── v1/             # API v1 endpoints
│   ├── config/                 # Configuration files
│   ├── tests/                  # Test code
│   │   ├── unit/               # Unit tests
│   │   └── integration/        # Integration tests
│   └── main.py                 # Application entry (port 5607)
│
├── frontend/                   # Frontend source code
│   ├── app/                    # Next.js App Router
│   │   └── [locale]/           # Internationalized routes
│   │       ├── (public-sidebar)/  # Pages with sidebar layout
│   │       ├── auth/           # Authentication pages
│   │       ├── workbench/      # Workbench tools
│   │       └── workflows/workflow-editor/
│   ├── components/
│   │   ├── features/           # Business components
│   │   ├── layout/             # Layout components
│   │   └── ui/                 # UI component library
│   ├── config/                 # App configuration
│   ├── constants/              # Constants
│   ├── hooks/                  # Custom hooks
│   ├── services/               # API service layer
│   ├── stores/                 # State management (Zustand)
│   ├── types/                  # TypeScript type definitions
│   └── utils/                  # Utility functions
│
├── docker/                     # Docker configuration
│   ├── docker-compose.yaml     # Container orchestration
│   └── .env.example            # Environment template
│
└── ...                         # Documentation and prototypes
```

## Development Commands

### Backend Development
```bash
cd backend

# Install dependencies (using uv, defined in pyproject.toml)
uv sync

# Start development server with auto-reload (port 5607)
uv run uvicorn main:app --host 0.0.0.0 --port 5607 --reload
# Alternative: uv run main.py

# Run tests
uv run pytest
# Run tests with coverage
uv run pytest --cov=src --cov-report=html

# Code formatting (if black is installed)
# black src tests

# Linting (if ruff is installed)
# ruff check src tests
```

### Frontend Development
```bash
cd frontend
npm install                      # Install dependencies
npm run dev                      # Start development server (port 5678)
npm run build                    # Create production build
npm start                        # Start production server
npm run lint                     # Run ESLint
```

### Full Stack with Docker
```bash
cd docker
docker compose up -d --build     # Boot the full stack locally
```

**Ports:**
- Frontend: http://localhost:5678
- Backend API: http://localhost:5607
- API Documentation: http://localhost:5607/docs

## Coding Standards

### Backend (Python)
- **Indentation**: 4 spaces
- **Naming**: snake_case for modules and functions
- **Architecture**: Keep changes within existing layer boundaries (api/application/domain/infrastructure)
- **Type Hints**: Use type annotations consistently
- **Formatting**: Use black for code formatting (`black src tests`)
- **Linting**: Use ruff for linting (`ruff check src tests`)

### Frontend (TypeScript/React)
- **Components**: PascalCase for React components (e.g., `components/ui/Button/Button.tsx`)
- **Hooks/Utilities**: camelCase
- **Imports**: Use `@/*` alias for absolute imports from project root
- **Styling**: Follow existing Tailwind CSS utility patterns; avoid introducing parallel styling approaches
- **Type Safety**: Maintain strict TypeScript configuration

## Testing

### Backend Tests
- **Framework**: pytest
- **Unit Tests**: `backend/tests/unit/` - name files `test_<feature>.py`
- **Integration Tests**: `backend/tests/integration/`
- **Coverage**: Run with `--cov=src` flag

### Frontend Tests
- No automated test suite configured yet
- Include manual verification notes for UI changes
- Add backend regression coverage for API, validation, and domain logic updates

## Environment Configuration

### Backend
- Use `backend/.env.example` as template for local configuration
- Key variables: Database (PostgreSQL), Redis, email (SMTP), AI services (OpenAI API key)

### Frontend
- Use `frontend/.env.example` as template
- Key variables: `NEXT_PUBLIC_API_URL=http://localhost:5607`, `NEXT_PUBLIC_APP_URL=http://localhost:5678`

### Docker
- Use `docker/.env.example` as template

**Security Note**: Never commit real secrets, internal IPs, or production data. Update related README or Docker config when changing ports, environment variables, or external service dependencies.

## Commit & Pull Request Guidelines

- **Commit Messages**: Use short, action-first Chinese summaries (e.g., `更新文档与docker配置`, `新增...接口`)
- **Scope**: Keep commits focused, small, and descriptive
- **Pull Requests**: Include:
  - Short summary
  - Affected areas (`backend`, `frontend`, `docker`, `docs`)
  - Linked issue or task
  - Screenshots for UI changes
  - Request/response examples for API changes

## Architecture Notes

### Backend DDD Layers
1. **API Layer** (`modules/*/api/`): HTTP endpoints, request/response models
2. **Application Layer** (`modules/*/application/`): Use cases, DTOs, service orchestration
3. **Domain Layer** (`modules/*/domain/`): Business entities, value objects, repository interfaces
4. **Infrastructure Layer** (`modules/*/infrastructure/`): Database models, repository implementations, external service clients

### Frontend Structure
- **App Router**: Uses Next.js App Router with `[locale]` for internationalization
- **Layout Groups**: `(public-sidebar)` denotes layout group for pages with sidebar
- **State Management**: Zustand stores in `frontend/stores/`
- **API Clients**: Service layer in `frontend/services/` handles backend communication

### Multi-Agent System
- Central dispatcher coordinates all agents
- Task orchestrator decomposes tasks, dispatches them, collects results
- Execution agents (Storyboard, Art Director, Animation & Editing) focus on specific steps
- Task state store manages lifecycle and state machine

## Troubleshooting

### Common Issues
- **Port conflicts**: Ensure ports 5607 (backend) and 5678 (frontend) are available
- **Database migrations**: Schema changes may require manual SQL migrations (see `main.py` for examples)
- **Environment variables**: Copy `.env.example` to `.env` and fill required values

### Docker Issues
- Check `docker compose logs -f` for service startup errors
- Ensure Docker has sufficient resources (memory, CPU) for AI workloads