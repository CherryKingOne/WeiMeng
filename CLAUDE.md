# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeiMeng-Agent is a multi-agent system for automated video production built with:
- **Backend**: FastAPI + Python 3.10+ with DDD architecture
- **Frontend**: Next.js 16.1 + React 19 + TypeScript + Tailwind CSS 4
- **Database**: PostgreSQL + SQLAlchemy 2.0 async
- **Cache**: Redis
- **AI Integration**: LangChain, LangGraph, LangFuse, OpenAI

## Common Commands

### Docker Development (Recommended)
```bash
# Start full stack (backend, frontend, PostgreSQL, Redis)
cd docker && cp .env.example .env && docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Backend Development
```bash
# Install dependencies (uses uv)
cd backend && uv sync

# Run development server
cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 5607 --reload

# Run tests
cd backend && uv run pytest

# Run tests with coverage
cd backend && uv run pytest --cov=src --cov-report=html

# Code formatting
cd backend && uv run black src tests

# Linting
cd backend && uv run ruff check src tests
```

### Frontend Development
```bash
# Install dependencies
cd frontend && npm install

# Run development server (port 5678)
cd frontend && npm run dev

# Build for production
cd frontend && npm run build

# Start production server
cd frontend && npm run start

# Linting
cd frontend && npm run lint
```

## Architecture Overview

### Backend Structure (DDD Architecture)
```
backend/src/
├── api/v1/                    # API routes and routers
├── modules/                   # Business modules
│   ├── auth/                  # Authentication module
│   │   ├── api/              # API layer (HTTP endpoints)
│   │   ├── application/      # Application layer (services, DTOs)
│   │   ├── domain/           # Domain layer (entities, value objects, repositories)
│   │   └── infrastructure/   # Infrastructure layer (models, mappers, repositories)
│   ├── captcha/              # Captcha module (same structure)
│   └── agent/                # Agent core module
├── shared/                   # Shared infrastructure
│   ├── domain/               # Domain base classes (BaseEntity, BaseValueObject)
│   ├── infrastructure/       # Database, Redis, Unit of Work
│   ├── security/             # JWT, password hashing
│   ├── middleware/           # Error handling, logging, request context
│   ├── extensions/           # Email service
│   └── common/               # Response utilities, dependencies
└── main.py                   # Application entry point
```

**Dependency Flow**: `API → Application → Domain → Infrastructure` (strictly single-direction)

### Frontend Structure
```
frontend/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages (login, signup, forgot-password)
│   ├── (dashboard)/         # Dashboard pages (dashboard, projects, workflows, etc.)
│   ├── workflow-editor/     # Workflow editor page
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   ├── features/            # Business components
│   ├── layout/              # Layout components
│   └── ui/                  # Reusable UI components (Card, Button, Input, etc.)
├── services/                # API service layer (auth.service.ts, workflow.service.ts, etc.)
├── stores/                  # Zustand state management (auth.store.ts, workflow.store.ts, etc.)
├── types/                   # TypeScript type definitions
├── hooks/                   # Custom React hooks
└── utils/                   # Utility functions
```

### Docker Architecture
```
docker/
├── docker-compose.yaml      # Full stack orchestration
├── .env.example             # Environment variables template
├── postgres/                # PostgreSQL initialization scripts
└── redis/                   # Redis configuration
```

## Key Development Workflows

### Adding a New Backend Module
1. Create module directory under `backend/src/modules/`
2. Follow DDD layers: `api/`, `application/`, `domain/`, `infrastructure/`
3. Register router in `backend/src/api/v1/router.py`
4. Add tests in `backend/tests/`
5. Run: `uv run pytest` to verify

### Adding a New Frontend Feature
1. Create page in `frontend/app/` (use route groups like `(dashboard)/`)
2. Create reusable components in `frontend/components/`
3. Add API service in `frontend/services/`
4. Add state management in `frontend/stores/`
5. Run: `npm run lint` to verify

### Running Tests
```bash
# Backend tests
cd backend && uv run pytest

# Run specific test file
cd backend && uv run pytest tests/unit/test_auth.py

# Run specific test function
cd backend && uv run pytest tests/unit/test_auth.py::test_login_success

# Frontend linting (no automated tests yet)
cd frontend && npm run lint
```

## Environment Configuration

### Backend (.env in docker/ or backend/)
```bash
# Application
APP_ENV=development
APP_NAME=WeiMeng
SECRET_KEY=your-secret-key

# Database
POSTGRESQL_HOST=localhost
POSTGRESQL_PORT=5432
POSTGRESQL_USER=weimeng
POSTGRESQL_PASSWORD=weimeng
POSTGRESQL_NAME=weimeng

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=weimeng

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=secret

# AI Services
OPENAI_API_KEY=your-openai-key
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:5607
NEXT_PUBLIC_APP_URL=http://localhost:5678
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/reset-password` - Password reset

### Captcha
- `POST /api/v1/captcha/email/send` - Send email verification code

### Health Check
- `GET /health` - Service health status

### API Documentation
- Swagger UI: http://localhost:5607/docs
- ReDoc: http://localhost:5607/redoc

## Development Guidelines

### Backend
- **Python Style**: PEP 8, 4-space indentation, `snake_case` for functions/variables, `PascalCase` for classes
- **Testing**: pytest with async fixtures, tests in `backend/tests/`
- **Code Quality**: Use `black` for formatting, `ruff` for linting
- **Architecture**: Strict DDD layering, no direct infrastructure calls from API layer

### Frontend
- **TypeScript**: Strict typing required
- **Components**: Use `PascalCase.tsx` for component files
- **State**: Zustand for global state, React hooks for local state
- **Styling**: Tailwind CSS 4 with utility-first approach
- **Imports**: Use `@/` absolute imports
- **Testing**: No automated tests yet, run `npm run lint` and manual verification

### Git & Commits
- Follow conventional commit format
- Use Chinese summary-style commits (e.g., `backend: 修复登录令牌校验`)
- Include scope in commit messages

## Important Files

### Backend
- `backend/main.py` - Application entry point
- `backend/pyproject.toml` - Python dependencies and build configuration
- `backend/src/api/v1/router.py` - Main API router
- `backend/src/shared/infrastructure/database.py` - Database configuration

### Frontend
- `frontend/package.json` - Dependencies and scripts
- `frontend/app/layout.tsx` - Root layout
- `frontend/app/(dashboard)/layout.tsx` - Dashboard layout
- `frontend/stores/index.ts` - Store exports

### Docker
- `docker/docker-compose.yaml` - Service orchestration
- `docker/.env.example` - Environment template

## Troubleshooting

### Backend Issues
- **Database connection**: Ensure PostgreSQL is running (`docker compose up -d postgres`)
- **Redis connection**: Ensure Redis is running (`docker compose up -d redis`)
- **Port conflicts**: Default ports are 5607 (backend), 5678 (frontend), 5432 (PostgreSQL), 6379 (Redis)

### Frontend Issues
- **Build errors**: Run `npm run lint` to check for TypeScript errors
- **API connection**: Ensure `NEXT_PUBLIC_API_URL` points to running backend
- **Port conflicts**: Change port in `package.json` dev script if needed

### Docker Issues
- **Build failures**: Check Dockerfile in backend/ and frontend/
- **Container not starting**: Run `docker compose logs -f` to see errors
- **Volume issues**: Remove volumes with `docker compose down -v` and restart

## Key Dependencies

### Backend
- FastAPI 0.128+ - Web framework
- SQLAlchemy 2.0+ - ORM with async support
- LangChain 1.2+ - LLM orchestration
- LangGraph 1.0+ - Agent workflows
- LangFuse 3.12+ - LLM observability
- Pydantic 2.12+ - Data validation
- Redis 7.1+ - Caching
- AsyncPG 0.31+ - PostgreSQL async driver

### Frontend
- Next.js 16.1 - React framework
- React 19 - UI library
- TypeScript 5 - Type system
- Tailwind CSS 4 - Styling
- Zustand 5 - State management
- Axios 1.13 - HTTP client
- Lucide React 0.563 - Icons

## Testing Strategy

### Backend
- Unit tests: `backend/tests/unit/`
- Integration tests: `backend/tests/integration/test_api/`
- Test files: `test_*.py`
- Fixtures: `backend/tests/conftest.py`

### Frontend
- No automated test suite currently
- Manual verification required
- Run `npm run lint` for static analysis

## Deployment

### Docker Deployment
```bash
cd docker
cp .env.example .env
# Edit .env with your configuration
docker compose up -d --build
```

### Local Development
- Backend: `uv run uvicorn main:app --host 0.0.0.0 --port 5607 --reload`
- Frontend: `npm run dev` (port 5678)
- Access: http://localhost:5678 (frontend), http://localhost:5607/docs (API docs)
