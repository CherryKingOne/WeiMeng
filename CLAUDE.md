# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeiMeng-Agent is a multi-agent system for automated video production. It bridges the gap between conceptual multi-agent designs and engineering-level system implementation. The system follows a centralized scheduling architecture where all agents coordinate through a central dispatcher, avoiding direct peer-to-peer communication.

## Core Architecture

### Backend (FastAPI + DDD)
- **Framework**: FastAPI with Python 3.10+
- **Architecture**: Domain-Driven Design (DDD) with clear separation of concerns
- **Database**: PostgreSQL with asyncpg, SQLAlchemy 2.0 async support
- **Cache**: Redis for session management and caching
- **AI Integration**: LangChain, LangGraph, LangFuse, OpenAI integration
- **Authentication**: JWT-based with python-jose and bcrypt

### Frontend (Next.js + React)
- **Framework**: Next.js 16.1.6 with React 19.2.3
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **UI Components**: Custom component library (Button, Modal, Card, Drawer, Badge, Avatar, etc.)

### Multi-Agent System
- **Central Dispatcher**: System controller, unified user request intake
- **Task Orchestrator**: Central nervous system, task decomposition and tracking
- **Execution Agents**: Storyboard, Art Director, Animation/Editing specialists
- **Task State Store**: Lifecycle management with interruption, failure, and retry support

## Common Development Commands

### Backend Development

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if using poetry)
poetry install

# Install dependencies (if using pip)
pip install -r requirements.txt

# Run development server
python main.py

# Run with uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 5607 --reload

# Run tests
pytest

# Run specific test file
pytest tests/test_auth.py

# Run with coverage
pytest --cov=src --cov-report=html

# Format code
black src tests

# Lint code
ruff check src tests

# Type check
mypy src
```

### Frontend Development

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Type check
npm run type-check

# Format code
npm run format
```

### Docker Development

```bash
# Navigate to docker directory
cd docker

# Copy environment template
cp .env.example .env

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Rebuild services
docker compose up -d --build

# Access backend API
curl http://localhost:5607/health

# Access frontend
curl http://localhost:5678
```

## Key File Locations

### Backend Structure
```
backend/
├── src/
│   ├── modules/           # Business modules (auth, captcha, agent)
│   │   ├── auth/          # Authentication module
│   │   │   ├── domain/    # Entities, value objects, services
│   │   │   ├── application/  # DTOs, application services
│   │   │   ├── infrastructure/  # Repository implementations
│   │   │   └── api/       # API routers
│   │   ├── captcha/       # Email verification module
│   │   └── agent/         # Multi-agent system module
│   ├── shared/            # Shared infrastructure
│   │   ├── domain/        # Base entities, value objects
│   │   ├── infrastructure/  # Database, Redis, unit of work
│   │   ├── security/      # JWT, password hashing
│   │   ├── middleware/    # Error handling, logging
│   │   └── common/        # Utilities, dependencies
│   └── api/v1/            # API version 1 router
├── config/                # Configuration (settings, AI, email, etc.)
├── tests/                 # Test files
├── main.py                # Application entry point
└── pyproject.toml         # Dependencies and project config
```

### Frontend Structure
```
frontend/
├── app/                   # Next.js app router
│   ├── (dashboard)/       # Dashboard layout and pages
│   ├── auth/              # Authentication pages
│   ├── workflow-editor/   # Visual workflow builder
│   └── layout.tsx         # Root layout
├── components/
│   ├── layout/            # Layout components (Sidebar, etc.)
│   ├── features/          # Feature-specific components
│   └── ui/                # Reusable UI components
├── services/              # API service layer
├── stores/                # Zustand state stores
│   ├── auth.store.ts      # Authentication state
│   ├── workflow.store.ts  # Workflow editor state
│   └── ui.store.ts        # UI state (modals, drawers)
├── constants/             # Constants and routes
├── types/                 # TypeScript type definitions
├── config/                # Configuration files
└── public/                # Static assets
```

### Docker Structure
```
docker/
├── docker-compose.yaml    # Multi-container orchestration
├── .env.example           # Environment template
├── postgres/              # PostgreSQL init scripts
├── redis/                 # Redis configuration
└── README.md              # Docker deployment guide
```

## Development Patterns

### Backend DDD Layers
1. **Domain Layer**: Pure business logic, entities, value objects, domain services
2. **Application Layer**: Use cases, DTOs, application services
3. **Infrastructure Layer**: Repository implementations, external services
4. **API Layer**: HTTP endpoints, request/response handling

### Frontend State Management
- **Auth Store**: User authentication state, tokens, profile
- **Workflow Store**: Workflow editor state, nodes, connections
- **UI Store**: Global UI state (sidebar, modals, drawers)

### API Service Pattern
```typescript
// services/auth.service.ts
export const authService = {
  login: async (credentials: LoginRequest) => {
    const response = await api.post(API_ROUTES.AUTH.LOGIN, credentials);
    return response.data;
  },
  // ... other methods
};
```

### Component Structure
- **Layout Components**: Sidebar, Header, Footer
- **Feature Components**: WorkflowCard, ProjectCard, AssetCard
- **UI Components**: Button, Modal, Card, Drawer (reusable)

## Testing

### Backend Tests
```bash
# Run all tests
pytest

# Run specific test module
pytest tests/modules/auth/

# Run with verbose output
pytest -v

# Run with coverage
pytest --cov=src --cov-report=html
```

### Frontend Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- workflow.test.tsx
```

## Environment Configuration

### Backend Environment Variables
```bash
# Database
POSTGRESQL_HOST=localhost
POSTGRESQL_PORT=5432
POSTGRESQL_USER=weimeng
POSTGRESQL_PASSWORD=weimeng
POSTGRESQL_DB=weimeng

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=weimeng

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# AI Providers
OPENAI_API_KEY=your-openai-key
```

### Frontend Environment Variables
```bash
# Next.js environment variables
NEXT_PUBLIC_API_URL=http://localhost:5607
NEXT_PUBLIC_APP_URL=http://localhost:5678
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/reset-password` - Password reset
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/profile` - Get user profile

### Captcha
- `POST /api/v1/captcha/email/send` - Send email verification code

### Documentation
- `GET /docs` - Swagger UI
- `GET /redoc` - ReDoc documentation

## Important Notes

### Multi-Agent System Design
- **Unified Entry**: Users interact through a single interface
- **Centralized Scheduling**: All agents coordinate through dispatcher
- **Task-First**: Tasks are first-class citizens, agents are executors
- **Traceable State**: Task states are fully traceable, interruptible, and reversible

### Workflow Editor
- Visual node-based workflow builder
- Drag-and-drop interface for creating workflows
- Node types: media, video, text, gen, videogen, post, upscale, controlnet
- Real-time preview and execution

### Security Considerations
- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- CORS configured for development (adjust for production)
- Input validation using Pydantic models

### Performance
- Async database operations with SQLAlchemy 2.0
- Redis caching for frequently accessed data
- Connection pooling for database connections
- Next.js static generation and server-side rendering

## Common Issues and Solutions

### Backend Issues
1. **Database connection failed**: Check PostgreSQL is running and credentials in `.env`
2. **Redis connection failed**: Check Redis is running and password is correct
3. **JWT validation error**: Verify `JWT_SECRET_KEY` matches between backend and frontend

### Frontend Issues
1. **API connection failed**: Check `NEXT_PUBLIC_API_URL` is correct
2. **Build errors**: Run `npm run type-check` to find TypeScript errors
3. **Styling issues**: Ensure Tailwind CSS is properly configured

### Docker Issues
1. **Port conflicts**: Check if ports 5607, 5678, 5432, 6379 are available
2. **Volume permissions**: Ensure Docker has permission to create volumes
3. **Build failures**: Check Dockerfile syntax and dependencies

## References

- **README.md**: English project documentation
- **README_zh-CN.md**: Chinese project documentation
- **docs/Development_Guide.md**: Comprehensive development guide
- **docs/System_Architecture_Notes.md**: Detailed architecture notes
- **docs/State_Flow_Responsibility.md**: Task state responsibility breakdown
