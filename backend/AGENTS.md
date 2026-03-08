# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: FastAPI service. Entry point is `backend/main.py`; core code is in `backend/src/` and split by domain (`modules/auth`, `modules/captcha`, `shared`, `api/v1`).
- `backend/tests/`: backend test suite, including `unit/` and `integration/test_api/` with shared fixtures in `backend/tests/conftest.py`.
- `frontend/`: Next.js 16 + React 19 app (`app/` routes, `components/` UI, `stores/` state, `services/` API clients).
- `docker/`: local orchestration for API, web, PostgreSQL, and Redis.
- `docs/` and `原型图/`: architecture notes and prototype assets.

## Build, Test, and Development Commands
- `cd docker && cp .env.example .env && docker compose up -d --build`: start the full local stack.
- `cd backend && uv sync`: install backend dependencies.
- `cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 5607 --reload`: run backend in dev mode.
- `cd backend && uv run pytest`: execute backend unit and integration tests.
- `cd frontend && npm install && npm run dev`: run frontend locally on `:5678`.
- `cd frontend && npm run lint`: run frontend lint checks.
- `cd frontend && npm run build && npm run start`: verify production frontend build.

## Coding Style & Naming Conventions
- Python uses 4-space indentation, `snake_case` for modules/functions, and `PascalCase` for classes.
- TypeScript/React follows the existing 2-space style and functional component patterns.
- Component files use `PascalCase` (for example, `Button.tsx`); Next.js routes use folder routing with `page.tsx`.
- Reuse project aliases such as `@/utils`, and keep repository text/code free of emoji characters.

## Testing Guidelines
- Framework: `pytest` with async fixtures from `backend/tests/conftest.py`.
- Place tests under `backend/tests/unit` or `backend/tests/integration/test_api`.
- Use `test_*.py` file names and `test_*` function names.
- Add tests for every new backend behavior.
- Frontend currently has no automated test suite; run `npm run lint` and manually verify key flows.

## Commit & Pull Request Guidelines
- Use concise Chinese summary-style commit messages with clear scope (for example, `backend: 修复登录令牌校验`).
- PRs should include purpose, changed modules/paths, environment or config updates, and validation commands.
- Include UI screenshots when applicable.
- Link related issues/tasks and clearly call out breaking changes.
