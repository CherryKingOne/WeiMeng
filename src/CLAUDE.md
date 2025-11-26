# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeiMeng (唯梦/微梦) is an AI-assisted drama and video production platform that streamlines the entire creative workflow from script writing to final video editing. The project consists of:
- **Backend** (`src/`): FastAPI-based REST API with PostgreSQL, MinIO object storage, and LLM integration
- **Frontend** (`web-ui/`): Vue 3 SPA with Vite, Tailwind CSS, and i18n support

## Development Commands

### Backend (from `src/` directory)

```bash
# Install dependencies
pip install -r requirements.txt

# Start the server with auto-reload
python main.py

# Or use uvicorn directly
uvicorn app.main:app --reload --port 7767
```

Backend runs on `http://localhost:7767` (configurable via `.env`).

### Frontend (from `web-ui/` directory)

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Frontend runs on `http://localhost:5173`.

### Database Setup

The application uses PostgreSQL with async SQLAlchemy. Database tables are automatically created on startup via `init_db()` in `app/core/database.py:36`. The `init_db()` function also handles lightweight schema migrations (BIGINT conversions, adding columns) wrapped in try-except blocks.

For manual migrations using Alembic:
```bash
alembic init alembic
alembic revision --autogenerate -m "Migration message"
alembic upgrade head
```

### Environment Configuration

Create a `.env` file in the `src/` directory with required settings (see `app/core/config.py:5` for all available options):
- PostgreSQL connection (host, port, database, user, password)
- MinIO endpoint and credentials
- LLM API configuration (URL, key, model name)
- JWT secret key
- Optional: SMTP settings, external AI API keys (JIMENG_API_KEY, QINIU_ACCESS_KEY)

## Architecture

### Core Components

**Authentication Flow**: JWT-based authentication using Bearer tokens. The `get_current_user` dependency in `app/api/deps.py:14` extracts and validates tokens, returning the authenticated User object. All protected endpoints use this dependency.

**Database Layer**: Uses SQLAlchemy async with asyncpg driver. The `get_db()` dependency in `app/core/database.py:27` provides async sessions. All models inherit from `Base` and use async query patterns with `select()` and `await db.execute()`.

**Service Layer Pattern**: Business logic is encapsulated in service classes:
- `LLMService` (`app/services/llm_service.py`): Handles LLM API calls with system prompts loaded from `prompts/*.md` files
- `MinioService` (`app/services/minio_service.py`): Manages file uploads/downloads to MinIO object storage
- Services are instantiated as global singletons (e.g., `llm_engine`, `minio_client`)

**Script Library System**: Two-level hierarchy with type support:
- `ScriptLibrary` model (`app/models/script.py:7`): Represents a collection/folder in MinIO with `type` field ('novel' for drama scripts or 'ad' for advertising content)
- `ScriptFile` model (`app/models/script.py:22`): Individual files within a library (stores `minio_object_key`, `file_url`, and optional `content_summary`)
- Files are organized as `{library_name}/{filename}` in MinIO
- Supports cascade deletion: deleting a library removes all associated files from both database and MinIO

### Configuration

All settings are managed through `app/core/config.py` using Pydantic Settings. The `.env` file in the `src/` directory is automatically loaded. Key settings include:
- Database connection (PostgreSQL with asyncpg)
- MinIO endpoint and credentials
- LLM API configuration (URL, key, model name)
- JWT secret and token expiration

### API Structure

Routes are organized under `/api/v1/` with the following modules:
- `auth.py`: User registration, login, profile management
- `llm.py`: LLM chat completion endpoints
- `script.py`: Script library and file management (CRUD operations)
- `media.py`: AI media generation endpoints (placeholder for future implementation)

### Prompt System

System prompts for LLM calls are stored as markdown files in `prompts/` directory (e.g., `分镜头脚本生成提示词.md`). Use `load_prompt(filename)` from `app/utils/prompt_loader.py:5` to load them. The loader automatically resolves paths relative to the project root and handles UTF-8 encoding.

## Important Implementation Details

**Async Patterns**: All database operations and external API calls use async/await. Database queries use SQLAlchemy 2.0 style with `select()` statements and `await db.execute()`.

**MinIO Integration**: MinIO doesn't have true folders - they're simulated via object key prefixes. The `MinioService` (`app/services/minio_service.py:6`) provides:
- Automatic bucket creation on initialization
- File upload/download with content type handling
- Presigned URL generation for secure temporary access (default 1 hour expiry)
- Folder deletion via prefix-based object listing
- When creating a script library, set `minio_folder_path` to the desired prefix (e.g., `"library-name/"`)

**Error Handling**: Services use try-except blocks with console logging. LLM and MinIO errors are propagated to API endpoints for proper HTTP error responses.

**CORS Configuration**: Currently set to allow all origins (`allow_origins=["*"]`) in `app/main.py:22`. This should be restricted to specific origins in production.

**Frontend Architecture**: Vue 3 with Composition API, Vue Router for navigation, Vue I18n for internationalization (Chinese/English), Tailwind CSS for styling, and FontAwesome icons. Node.js version requirement: 20.19.0+ or 22.12.0+.

## API Documentation

When the server is running, interactive API documentation is available at:
- Swagger UI: http://localhost:7767/docs
- ReDoc: http://localhost:7767/redoc
