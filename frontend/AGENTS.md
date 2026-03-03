# Repository Guidelines

## Project Structure & Module Organization
This frontend uses Next.js App Router. Main routes live in `app/`, with localized pages under `app/[locale]/...` and route groups like `(auth)` and `(dashboard)`.
Shared UI and feature code is split by responsibility: `components/ui` (primitives), `components/features` (domain widgets), and `components/layout` (shell/navigation).
Business logic is organized in `services/` (API and resource calls), `stores/` (Zustand state), `hooks/`, `utils/`, `constants/`, and `types/`.
Static files are in `public/`, and app-level configuration lives in `config/`.

## Build, Test, and Development Commands
- `npm ci`: Install dependencies from `package-lock.json`.
- `npm run dev`: Start local development server on `http://localhost:5678`.
- `npm run lint`: Run ESLint with Next.js + TypeScript rules.
- `npm run build`: Create production build (also catches TypeScript issues).
- `npm run start`: Serve the built app on port `5678`.
- `docker compose up --build`: Build and run the production container locally.

## Coding Style & Naming Conventions
Use TypeScript in strict mode and import aliases via `@/*`.
Follow existing file-local style (2-space indentation, semicolons, and quote style) to keep diffs minimal and consistent.
Naming patterns used in this repo:
- Components: `PascalCase.tsx` (example: `ProjectCard.tsx`)
- Hooks: `useX.ts` (example: `useLocalePath.ts`)
- Stores: `*.store.ts` (example: `auth.store.ts`)
- Services: `*.service.ts` (example: `project.service.ts`)
- Types: `*.types.ts` (example: `project.types.ts`)

## Testing Guidelines
There is currently no dedicated test runner configured in `package.json`.
For every change, run `npm run lint` and `npm run build` before opening a PR.
Do manual smoke checks for localized auth/dashboard flows (for example `/zh/...` and `/en/...`).
If adding tests, use `*.test.ts` or `*.test.tsx` naming and place tests near the related module or in `__tests__/`.

## Commit & Pull Request Guidelines
Recent commits use short imperative summaries, commonly in Chinese (for example `add language switch`, `update README`).
Keep each commit focused on one logical change and avoid vague messages such as "update files".
PRs should include:
- What changed and why
- Key paths touched
- Validation steps (commands run)
- Screenshots for UI changes
- Linked task/issue IDs when available

## Security & Configuration Tips
Do not commit secrets. Only `NEXT_PUBLIC_*` variables intended for browser exposure should be public.
For auth-related edits, review `middleware.ts`, `services/api.ts`, and `stores/auth.store.ts` carefully to avoid token or redirect regressions.
