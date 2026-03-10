# Repository Guidelines

## Project Structure & Module Organization
`src/` contains application code. `src/api/v1/router.py` mounts the module routers, and each feature under `src/modules/` follows the same DDD split: `api/`, `application/`, `domain/`, and `infrastructure/`. Shared middleware, security, database helpers, and common responses live in `src/shared/`. Runtime settings are under `config/`. Tests are organized in `tests/unit/` and `tests/integration/`. Root-level operational files include `README.md`, `Dockerfile`, `docker-compose.yml`, and `.env.example`.

## Build, Test, and Development Commands
Use `uv` as the source of truth for dependencies defined in `pyproject.toml`.

- `uv sync` creates or updates the local virtual environment.
- `uv run uvicorn main:app --host 0.0.0.0 --port 5607 --reload` starts the FastAPI app in reload mode.
- `uv run main.py` runs the same app through the entry script.
- `uv run pytest` executes the test suite.
- `docker compose up -d --build` starts the API plus PostgreSQL, Redis, MinIO, and Elasticsearch.

## Coding Style & Naming Conventions
Target Python 3.10+ and keep 4-space indentation. Follow the existing absolute import style (`from src... import ...`) and keep type hints explicit on public functions and service boundaries. Use `snake_case` for files, functions, and modules, `PascalCase` for classes, and keep DDD naming consistent: entities in `domain/entities`, DTOs in `application/dto`, repositories and mappers in `infrastructure/`. No formatter or linter is configured in `pyproject.toml`, so match the surrounding style carefully. Do not add emoji to code or documentation.

## Testing Guidelines
Name test files `test_<subject>.py` and test functions `test_<behavior>`. Prefer unit tests with fakes or fixtures before adding heavier integration coverage. Run `uv run pytest` before opening a PR. If you add integration tests, note that `tests/conftest.py` is wired for a PostgreSQL test database at `localhost:5432/test_db`.

## Commit & Pull Request Guidelines
Recent history uses short, imperative Chinese commit titles such as `更新文档与docker配置` and `新增目录树`. Keep commits focused on one logical change. PRs should include a short scope summary, verification commands, linked issue or task when available, and clear notes for API, schema, port, or `.env` changes. For endpoint changes, include example request and response payloads.

## Security & Configuration Tips
Copy `.env.example` to `.env` for local setup and keep secrets out of version control. When changing ports or service dependencies, update `docker-compose.yml` and `.env.example` together so local and containerized workflows stay aligned.
