# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeiMeng (微梦) is an AI-powered script generation engine backend built with FastAPI. It provides APIs for generating short drama scripts, managing script libraries with MinIO object storage, and integrating with LLM services for content generation.

## Development Commands

### Running the Application

```bash
# Start the server (from src/ directory)
python main.py

# Or use uvicorn directly with auto-reload
uvicorn app.main:app --reload --port 7767
```

The server runs on port 7767 by default (configurable via `.env`).

### Installing Dependencies

```bash
pip install -r requirements.txt
```

### Database Setup

The application uses PostgreSQL with async SQLAlchemy. Database tables are automatically created on startup via `init_db()` in `app/core/database.py:36`.

For manual migrations using Alembic:
```bash
alembic init alembic
alembic revision --autogenerate -m "Migration message"
alembic upgrade head
```

## Architecture

### Core Components

**Authentication Flow**: JWT-based authentication using Bearer tokens. The `get_current_user` dependency in `app/api/deps.py:14` extracts and validates tokens, returning the authenticated User object. All protected endpoints use this dependency.

**Database Layer**: Uses SQLAlchemy async with asyncpg driver. The `get_db()` dependency in `app/core/database.py:27` provides async sessions. All models inherit from `Base` and use async query patterns with `select()` and `await db.execute()`.

**Service Layer Pattern**: Business logic is encapsulated in service classes:
- `LLMService` (`app/services/llm_service.py`): Handles LLM API calls with system prompts loaded from `prompts/*.md` files
- `MinioService` (`app/services/minio_service.py`): Manages file uploads/downloads to MinIO object storage
- Services are instantiated as global singletons (e.g., `llm_engine`, `minio_client`)

**Script Library System**: Two-level hierarchy:
- `ScriptLibrary` model: Represents a collection/folder in MinIO (maps to `minio_folder_path`)
- `ScriptFile` model: Individual files within a library (stores `minio_object_key` and `file_url`)
- Files are organized as `{library_name}/{filename}` in MinIO

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

System prompts for LLM calls are stored as markdown files in `prompts/` directory. Use `load_prompt(filename)` from `app/utils/prompt_loader.py:5` to load them. The loader automatically resolves paths relative to the project root.

## Important Implementation Details

**Async Patterns**: All database operations and external API calls use async/await. Database queries use SQLAlchemy 2.0 style with `select()` statements and `await db.execute()`.

**MinIO Integration**: MinIO doesn't have true folders - they're simulated via object key prefixes. When creating a script library, set `minio_folder_path` to the desired prefix (e.g., `"library-name/"`). Files are uploaded with keys like `{minio_folder_path}{filename}`.

**Database Migrations**: The `init_db()` function includes lightweight ALTER TABLE statements to handle BIGINT column migrations for `script_libraries` and `script_files` tables. These are wrapped in try-except to avoid errors on fresh databases.

**CORS Configuration**: Currently set to allow all origins (`allow_origins=["*"]`) in `app/main.py:22`. This should be restricted to specific origins in production.

## API Documentation

When the server is running, interactive API documentation is available at:
- Swagger UI: http://localhost:7767/docs
- ReDoc: http://localhost:7767/redoc
