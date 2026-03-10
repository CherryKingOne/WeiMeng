# Repository Guidelines

## Project Structure & Module Organization
`backend/` contains the FastAPI service. Start at `backend/main.py`; application code lives under `backend/src/` with DDD-style module folders such as `modules/*/{api,application,domain,infrastructure}` and shared code in `src/shared/`. Tests live in `backend/tests/unit` and `backend/tests/integration`.

`frontend/` contains the Next.js App Router UI. Routes live under `frontend/app/[locale]/`, shared UI in `frontend/components/`, API clients in `frontend/services/`, Zustand stores in `frontend/stores/`, and shared helpers in `frontend/types` and `frontend/utils`. Container files live in `docker/`; reference docs and HTML prototypes live in `docs/` and `原型图/`.

## Build, Test, and Development Commands
`cd backend && uv sync` installs backend dependencies from `backend/pyproject.toml`.

`cd backend && uv run main.py` starts the API on `http://localhost:5607`.

`cd backend && uv run pytest` runs the backend test suite.

`cd frontend && npm install` installs frontend dependencies.

`cd frontend && npm run dev` starts Next.js on `http://localhost:5678`.

`cd frontend && npm run build` creates the production build; `npm run lint` runs ESLint.

`cd docker && docker compose up -d --build` boots the full stack locally.

## Coding Style & Naming Conventions
Use 4-space indentation in Python, snake_case for Python modules and functions, and keep backend changes inside the existing layer boundaries. For TypeScript, keep `strict`-safe types, use PascalCase for React components such as `components/ui/Button/Button.tsx`, camelCase for hooks and utilities, and prefer the `@/*` import alias defined in `frontend/tsconfig.json`. Follow existing Tailwind utility patterns instead of introducing a parallel styling approach.

## Testing Guidelines
Backend tests use `pytest`. Add unit tests under `backend/tests/unit/` and integration tests under `backend/tests/integration/`, naming files `test_<feature>.py`. No frontend automated test suite is configured yet, so include manual verification notes for UI changes and add backend regression coverage for API, validation, and domain logic updates.

## Commit & Pull Request Guidelines
Recent commits use short, action-first Chinese summaries such as `更新文档与docker配置` and `新增...接口`. Keep commits focused, small, and descriptive. PRs should include a short summary, affected areas (`backend`, `frontend`, `docker`, `docs`), linked issue or task, screenshots for UI changes, and request or response examples when APIs change.

## Security & Configuration Tips
Use `backend/.env.example` and `docker/.env.example` as the source of truth for local configuration. Never commit real secrets, internal IPs, or copied production data. If you change ports, environment variables, or external service dependencies, update the related README or Docker config in the same PR.
