# Repository Guidelines

## Project Structure & Module Organization
The FastAPI backend lives in `backend/`. Entry points are `main.py` and `src/api/v1/router.py`. Core business code follows a DDD layout under `src/modules/<feature>/`:
- `api/` for endpoints and request/response wiring
- `application/` for use cases and DTOs
- `domain/` for entities and domain rules
- `infrastructure/` for persistence, mappers, and external integrations

Shared components (middleware, security, DB helpers, common responses) are in `src/shared/`. Runtime settings are in `config/`. Tests are split into `tests/unit/` and `tests/integration/`.

## Build, Test, and Development Commands
- `uv sync`: install dependencies from `pyproject.toml` into the local environment.
- `uv run uvicorn main:app --host 0.0.0.0 --port 5607 --reload`: run the API with hot reload.
- `uv run main.py`: run the same app via the entry script.
- `uv run pytest`: execute all tests.
- `docker compose up -d --build`: start API plus local dependencies (PostgreSQL, Redis, MinIO, Elasticsearch).

## Coding Style & Naming Conventions
Use Python 3.10+ with 4-space indentation. Keep imports absolute (for example, `from src.shared...`). Use:
- `snake_case` for files, functions, and modules
- `PascalCase` for classes

Keep changes inside existing DDD boundaries. No formatter/linter is enforced in `pyproject.toml`, so match surrounding style carefully. Do not add emoji in code or documentation.

## Testing Guidelines
Use `pytest`. Name files `test_<subject>.py` and tests `test_<behavior>`. Prefer unit tests first, then integration tests when cross-module or database behavior matters. For integration tests, note `tests/conftest.py` expects PostgreSQL at `localhost:5432/test_db`.

## Commit & Pull Request Guidelines
Use short, imperative commit titles (commonly Chinese in this repo), e.g. `新增xx接口` or `更新文档配置`. Keep each commit focused on one logical change.

PRs should include:
- scope summary (`backend`, `frontend`, `docker`, `docs`)
- verification commands run
- linked issue/task when available
- request/response examples for API changes
- notes for any `.env`, port, or dependency changes

## Security & Configuration Tips
Use `.env.example` as the baseline for local setup. Never commit real secrets or production data. If environment variables, ports, or service dependencies change, update related docs and Docker configuration in the same PR.
