# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeiMeng (唯梦/微梦) is an AI-assisted drama and video production platform that streamlines the entire creative workflow from script writing to final video editing. The project consists of:
- **Backend** (`src/`): FastAPI-based REST API with PostgreSQL, MinIO object storage, and LLM integration
- **Frontend** (`web-ui/`): Vue 3 SPA with Vite, Tailwind CSS, and i18n support

## Development Commands

### Prerequisites

- Python 3.9+
- PostgreSQL 15+ (or use Docker Compose)
- MinIO (or use Docker Compose)

To start PostgreSQL and MinIO using Docker:
```bash
docker-compose up -d
```
This starts PostgreSQL on port 5432 and MinIO on port 9000 (admin UI on 9001).

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

**Note**: PostgreSQL and MinIO must be running before starting the backend. Set up these services manually or via Docker containers as needed.

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

```ini
# Application
PROJECT_NAME=AI_Script_Engine
API_PORT=7767
SECRET_KEY=your-secret-key-here

# PostgreSQL
POSTGRESQL_DB=weimeng
POSTGRESQL_USER=postgres
POSTGRESQL_PASSWORD=your_password
POSTGRESQL_HOST=localhost
POSTGRESQL_PORT=5432

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=weimeng
MINIO_SECRET_KEY=weimeng.
MINIO_BUCKET_NAME=script-libraries

# LLM API
LLM_API_URL=https://api.openai.com/v1
LLM_API_KEY=your-llm-api-key
LLM_MODEL_NAME=gpt-4

# Optional: SMTP, external AI APIs
# JIMENG_API_KEY=...
# QINIU_ACCESS_KEY=...
```

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

**Scriptwriting Project System**: Detailed storyboard management for video production:
- `ScriptwritingProject` model (`app/models/scriptwriting.py:8`): Represents a complete script project with metadata (file_id, visual_style, word count, generation time)
- `ScriptwritingShot` model (`app/models/scriptwriting.py:24`): Individual shots/scenes with comprehensive details:
  - Character information (name, gender, appearance)
  - Visual content (scene description, shot size, camera movement, image URLs)
  - Audio information (dialogue, voice-over, emotion, sound effects)
  - AI generation prompts stored in JSONB field (`text_to_image_prompt`, `image_to_video_prompt`)
  - Context summary for maintaining narrative continuity
- Supports pagination, search by character/type/visual style, and individual shot updates
- Cascade deletion: deleting a project removes all associated shots

**Model Configuration System**: Multi-tenant model management with security:
- `ModelConfig` model (`app/models/model_config.py:6`): Stores LLM and AI model configurations per tenant
- Supports multiple model types: LLM, Rerank, Text Embedding, Speech2text, TTS, Video, Image
- API keys are encrypted using AES-256-CBC before storage (`app/utils/encryption.py`)
- Soft deletion pattern with `is_deleted` flag
- Custom ID generation using `generate_wm_id()` for unique 22-character identifiers

### Configuration

All settings are managed through `app/core/config.py` using Pydantic Settings. The `.env` file in the `src/` directory is automatically loaded. Key settings include:
- Database connection (PostgreSQL with asyncpg)
- MinIO endpoint and credentials
- LLM API configuration (URL, key, model name)
- JWT secret and token expiration

### API Structure

Routes are organized under `/api/v1/` and `/api/v2/` with the following modules:
- `auth.py`: User registration, login, profile management
- `script.py`: Script library and file management (CRUD operations)
- `scriptwriting.py`: Scriptwriting project and shot management (detailed storyboard system)
- `media.py`: AI media generation endpoints (placeholder for future implementation)
- `model_config.py` (v2): Model configuration management with encrypted API keys

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

**Security Patterns**:
- JWT tokens with Bearer authentication (configurable expiration, default 30 days)
- Password hashing using bcrypt via passlib
- API key encryption using AES-256-CBC with PKCS7 padding (`app/utils/encryption.py`)
- All protected endpoints require `get_current_user` dependency which validates JWT and checks user active status

## API Documentation

When the server is running, interactive API documentation is available at:
- Swagger UI: http://localhost:7767/docs
- ReDoc: http://localhost:7767/redoc
