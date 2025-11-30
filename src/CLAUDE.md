# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeiMeng (唯梦/微梦) is an AI-assisted drama and video production platform that streamlines the entire creative workflow from script writing to final video editing. The project consists of:
- **Backend** (`src/`): FastAPI-based REST API with PostgreSQL, MinIO object storage, and LLM integration
- **Frontend** (`web-ui/`): Vue 3 SPA with Vite, Tailwind CSS, and i18n support

## Development Commands

### Prerequisites

- Python 3.9+ (tested with Python 3.13.5)
- PostgreSQL 15+
- MinIO

**Note**: This project does not include a `docker-compose.yml` file. You need to set up PostgreSQL and MinIO manually or using your own Docker containers. Refer to the official documentation for installation:
- PostgreSQL: https://www.postgresql.org/download/
- MinIO: https://min.io/docs/minio/linux/operations/installation.html

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

**Note**: PostgreSQL and MinIO must be running before starting the backend.

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

**Note**: For detailed frontend architecture and development guidelines, see `web-ui/CLAUDE.md`.

### Database Setup

The application uses PostgreSQL with async SQLAlchemy. Database tables are automatically created on startup via `init_db()` in `app/core/database.py:36`. The `init_db()` function also handles lightweight schema migrations (BIGINT conversions, adding columns) wrapped in try-except blocks.

For manual migrations using Alembic (not currently configured):
```bash
# Initialize Alembic (first time only)
alembic init alembic

# Generate migration
alembic revision --autogenerate -m "Migration message"

# Apply migration
alembic upgrade head
```

**Note**: The project currently uses automatic schema migrations via `init_db()`. Alembic is available as a dependency but not configured.

### Testing

The project does not currently have a test suite configured. To add testing:

```bash
# Install pytest and dependencies
pip install pytest pytest-asyncio httpx

# Run tests (once configured)
pytest

# Run with coverage
pytest --cov=app tests/
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

## Project Structure

```
src/
├── app/
│   ├── api/              # API endpoints organized by version
│   │   ├── v1/          # Core functionality (auth, script, scriptwriting, media)
│   │   ├── v2/          # Model configuration management
│   │   └── v3/          # Chat, image, and video generation
│   ├── core/            # Core configuration and utilities
│   │   ├── config.py    # Pydantic settings (line 5)
│   │   ├── database.py  # SQLAlchemy async setup (line 27, 36)
│   │   └── security.py  # JWT and password hashing
│   ├── models/          # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── script.py    # ScriptLibrary (line 7), ScriptFile (line 22)
│   │   ├── scriptwriting.py  # ScriptwritingProject (line 8), ScriptwritingShot (line 24)
│   │   ├── model_config.py   # ModelConfig (line 6)
│   │   └── chat.py      # ChatSession, ChatMessage, VideoTask (line 82)
│   ├── services/        # Business logic services
│   │   ├── llm_service.py    # LLM API integration
│   │   └── minio_service.py  # MinIO object storage (line 6)
│   ├── utils/           # Utility functions
│   │   ├── encryption.py     # AES-256-CBC encryption for API keys
│   │   └── prompt_loader.py  # Load prompts from markdown files (line 5)
│   └── main.py          # FastAPI application entry point (CORS at line 22)
├── prompts/             # System prompts for LLM (markdown files)
├── main.py              # Application startup script
├── requirements.txt     # Python dependencies
└── .env                 # Environment variables (not in git)
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
- Supports CRUD operations:
  - Create library (`POST /api/v1/script/libraries`)
  - List libraries (`GET /api/v1/script/libraries`)
  - Get library details (`GET /api/v1/script/libraries/{lib_id}`)
  - Update library (`PUT /api/v1/script/libraries/{lib_id}`) - supports updating name and description
  - Delete library (`DELETE /api/v1/script/libraries/{lib_id}`)
- Supports cascade deletion: deleting a library removes all associated files from both database and MinIO

**Scriptwriting Project System**: Detailed shot management for video production:
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
- Supports multiple model types: LLM, Rerank, Text Embedding, Speech2text, TTS, VIDEO_GENERATION, IMAGE_GENERATION
- API keys are encrypted using AES-256-CBC before storage (`app/utils/encryption.py`)
- Soft deletion pattern with `is_deleted` flag
- Custom ID generation using `generate_wm_id()` for unique 22-character identifiers
- Users can set default models per type (stored in `User.default_models` JSONB field)
- Script libraries can override global defaults with library-specific model configurations

**AI Media Generation System**: Async task-based generation for images and videos:
- **Image Generation** (`POST /api/v3/chat/images/generations`): Synchronous text-to-image generation
  - Requires `IMAGE_GENERATION` model type configuration
  - Supports parameters: prompt, size, quality, style, n (number of images)
  - Returns generated image URLs immediately
- **Video Generation** (`POST /api/v3/chat/videos`): Asynchronous text-to-video and image-to-video
  - Requires `VIDEO_GENERATION` model type configuration
  - Supports text-to-video (prompt only) and image-to-video (prompt + input_reference)
  - Size constraints: only 1280x720 or 720x1280 supported
  - Returns task_id for async status tracking
  - Task info saved to `VideoTask` model (`app/models/chat.py:82`) with user_id, config_id, and status
- **Video Task Query** (`GET /api/v3/chat/videos/{task_id}`): Check video generation status
  - Retrieves config_id from database based on task_id (no need to pass config_id)
  - Automatically updates task status in database
  - Handles different URL field names (url/video_url) from various APIs
  - Task statuses: queued, in_progress, completed, failed

**User Management System**: User self-service operations:
- `GET /api/v1/user-info/me`: Get current logged-in user information
  - Returns the authenticated user's profile (id, email, account, username, timestamps)
  - No parameters required, uses JWT token from Authorization header
- `PUT /api/v1/user-info/me`: Update current logged-in user information
  - Supports updating account, username, and password
  - Account uniqueness validation (excluding current user)
  - Password is automatically hashed if provided
  - Only allows users to modify their own information
- `DELETE /api/v1/user-info/me`: Delete current logged-in user account (account deactivation)
  - Requires password confirmation in request body: `{"password": "current_password"}`
  - Validates the password before deletion (returns 401 if incorrect)
  - Permanently deletes the current user's account upon successful password verification
  - Returns 204 No Content on success
- All endpoints require authentication via `get_current_user` dependency
- Schemas defined in `app/schemas/user_info.py` (including `UserDeleteRequest` for password confirmation)

### Configuration

All settings are managed through `app/core/config.py` using Pydantic Settings. The `.env` file in the `src/` directory is automatically loaded. Key settings include:
- Database connection (PostgreSQL with asyncpg)
- MinIO endpoint and credentials
- LLM API configuration (URL, key, model name)
- JWT secret and token expiration

### API Structure

Routes are organized under `/api/v1/`, `/api/v2/`, `/api/v3/`, and `/api/v4/`:
- **v1**: Core functionality
  - `auth.py`: User registration, login, profile management
  - `user_info.py`: User management CRUD operations (admin functionality)
  - `script.py`: Script library and file management (CRUD operations)
  - `scriptwriting.py`: Scriptwriting project and shot management (detailed shot system)
  - `media.py`: AI media generation endpoints (placeholder for future implementation)
- **v2**: `model_config.py`: Model configuration management with encrypted API keys
- **v3**: `chat.py`: AI chat, image generation, and video generation endpoints
  - Chat completions with streaming support
  - Session and message management
  - Default model configuration (global and library-specific)
  - Image generation (`POST /images/generations`)
  - Video generation (`POST /videos`, `GET /videos/{task_id}`)
- **v4**: `shot.py`: Enhanced shot management endpoints

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

## Development Workflow

### Adding a New API Endpoint

1. Define the Pydantic schema in `app/schemas/` (create if needed)
2. Create the endpoint in the appropriate API version directory (`app/api/v1/`, `v2/`, or `v3/`)
3. Add authentication using `Depends(get_current_user)` if the endpoint requires authentication
4. Use `Depends(get_db)` for database access
5. Test the endpoint using the Swagger UI at `/docs`

### Adding a New Model

1. Create the SQLAlchemy model in `app/models/`
2. Import the model in `app/core/database.py` in the `init_db()` function
3. Restart the server - tables will be created automatically
4. For complex migrations, use Alembic

### Working with LLM Services

1. Add system prompts as `.md` files in the `prompts/` directory
2. Load prompts using `load_prompt(filename)` from `app/utils/prompt_loader.py:5`
3. Use the `LLMService` singleton (`llm_engine`) for API calls
4. Handle streaming responses for chat completions

### Working with MinIO

1. Files are organized by prefix (simulated folders): `{library_name}/{filename}`
2. Use the `MinioService` singleton (`minio_client`) for all operations
3. Generate presigned URLs for secure temporary access (default 1 hour)
4. Remember to delete from both database and MinIO when removing files

### Common Patterns

**Async Database Queries**:
```python
from sqlalchemy import select
result = await db.execute(select(Model).where(Model.field == value))
item = result.scalars().first()
```

**JWT Authentication**:
```python
@router.get("/protected")
async def protected_endpoint(current_user: User = Depends(get_current_user)):
    return {"user_id": current_user.id}
```

**Error Handling**:
```python
from fastapi import HTTPException, status
raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
```
