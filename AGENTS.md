# Repository Guidelines

## Project Structure & Module Organization
This repository is split into `backend/` (FastAPI, Python) and `frontend/` (Next.js 16, TypeScript).

- `backend/src/modules/`: domain modules (`auth`, `captcha`, `agent`) organized by `api/`, `application/`, `domain/`, `infrastructure/`.
- `backend/src/shared/`: shared middleware, security, infrastructure, and common utilities.
- `backend/tests/`: test scaffold (`unit/`, `integration/`, `fixtures/`).
- `frontend/app/`: App Router pages (`(auth)` and `(dashboard)` route groups).
- `frontend/components/`: reusable UI, layout, and feature components.
- `frontend/services/`, `frontend/stores/`, `frontend/utils/`: API clients, Zustand stores, and helpers.
- `docker/`: compose setup for API, web, PostgreSQL, and Redis.

## Build, Test, and Development Commands
- Backend setup: `cd backend && uv sync`
- Run backend (dev): `cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 5607 --reload`
- Backend tests: `cd backend && uv run pytest`
- Frontend setup: `cd frontend && npm install`
- Run frontend (dev): `cd frontend && npm run dev` (port `5678`)
- Frontend lint: `cd frontend && npm run lint`
- Frontend production build: `cd frontend && npm run build && npm run start`
- Full stack with Docker: `cd docker && docker compose up -d --build`

## Coding Style & Naming Conventions
- Python: PEP 8, 4-space indentation, `snake_case` files/functions, `PascalCase` classes.
- Keep backend layering strict: API -> application service -> domain -> infrastructure.
- TypeScript/React: `PascalCase` component files (`Button.tsx`), `camelCase` utilities/services/stores.
- Use absolute imports via `@/*` in frontend.
- Run ESLint before opening a PR; avoid unrelated formatting-only changes.

## Testing Guidelines
- Backend uses `pytest` with async fixtures in `backend/tests/conftest.py`.
- Place unit tests in `backend/tests/unit/test_<domain>/test_*.py`.
- Place API/integration tests in `backend/tests/integration/test_api/test_*.py`.
- No enforced coverage threshold yet; new features should include happy-path and failure-path tests.
- Frontend has no dedicated test runner configured; at minimum, `npm run lint` and `npm run build` must pass.

## Commit & Pull Request Guidelines
- Recent history uses short Chinese summaries (for example: `优化代码`, `前端模块化开发`).
- Prefer clearer scoped subjects: `frontend: 优化登录页交互`, `backend: 重构 auth service`.
- One logical change per commit.
- PRs should include: change summary, affected paths, env/config updates, verification commands run, and screenshots/GIFs for UI changes.

## Security & Configuration Tips
- Do not commit `.env` or credentials.
- Frontend API base URL should come from `NEXT_PUBLIC_API_URL`.
- Keep database/Redis settings in environment variables used by Docker/Backend config.
