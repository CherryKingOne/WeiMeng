# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: FastAPI service. Main code lives in `backend/src/`, grouped by domain (`modules/auth`, `modules/captcha`, `shared`, `api/v1`). App entrypoint: `backend/main.py`.
- `frontend/`: Next.js 16 + React 19 app. Routes are in `frontend/app/`, shared UI in `frontend/components/`, state in `frontend/stores/`, and API clients in `frontend/services/`.
- `backend/tests/`: Python tests, including `unit/` and `integration/test_api/`.
- `docker/`: Local full-stack orchestration (API, web, PostgreSQL, Redis).
- `docs/`, `原型图/`: supporting architecture notes and HTML prototypes.

## Build, Test, and Development Commands
- `cd docker && cp .env.example .env && docker compose up -d --build`: start full stack locally.
- `cd backend && uv sync`: install backend dependencies.
- `cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 5607 --reload`: run backend in dev mode.
- `cd backend && uv run pytest`: run backend tests.
- `cd frontend && npm install && npm run dev`: run frontend locally on `:5678`.
- `cd frontend && npm run lint`: run frontend lint checks.
- `cd frontend && npm run build && npm run start`: production build verification.

## Coding Style & Naming Conventions
- Python: 4-space indentation, `snake_case` for modules/functions, `PascalCase` for classes.
- TypeScript/React: keep existing 2-space style and functional component patterns.
- Naming: component files use `PascalCase` (for example, `Button.tsx`); Next.js routes use folder-based routing with `page.tsx`.
- Reuse project aliases (for example, `@/utils`) and keep text/code free of emoji characters.

## Testing Guidelines
- Framework: `pytest` with async fixtures from `backend/tests/conftest.py`.
- Add tests under `backend/tests/unit` and `backend/tests/integration/test_api`.
- Use `test_*.py` naming for files and test functions.
- No coverage gate is configured; add tests for every new backend behavior.
- Frontend currently has no automated suite; run `npm run lint` and manually verify key flows.

## Commit & Pull Request Guidelines
- Follow concise Chinese summary-style commits with clear scope (for example, `backend: 修复登录令牌校验`).
- PRs should include: purpose, changed modules/paths, env or config updates, validation commands, and UI screenshots when applicable.
- Link related issues/tasks and call out breaking changes explicitly.
