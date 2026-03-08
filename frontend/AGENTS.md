# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages and layouts. Locale-aware routes live under `app/[locale]/...`, and `app/page.tsx` handles root redirects.
- `components/`: Reusable UI components.
- `services/`: API request clients and service-layer calls.
- `stores/`: Zustand state stores.
- `hooks/`, `utils/`, `constants/`, `types/`, `config/`: shared logic, helpers, constants, type definitions, and runtime config.
- `public/`: static assets served directly.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start local dev server on `http://localhost:5678`.
- `npm run lint`: run ESLint (`eslint-config-next` + TypeScript rules).
- `npm run build`: create production build and catch compile/runtime route issues.
- `npm run start`: run production build on port `5678` after `npm run build`.

## Coding Style & Naming Conventions
- Language: TypeScript (`strict: true` in `tsconfig.json`); use functional React components.
- Indentation: follow existing 2-space style and keep imports grouped/ordered consistently.
- Naming: components use `PascalCase` (for example, `LoginForm.tsx`); hooks use `useXxx`; utility files use descriptive `camelCase` names.
- Routing files must follow Next.js conventions (`page.tsx`, `layout.tsx`, `loading.tsx`).
- Use the path alias `@/*` instead of deep relative paths where practical.
- Keep repository text/code free of emoji characters.

## Testing Guidelines
- No dedicated frontend automated test suite is configured yet.
- Required checks before PR: `npm run lint` and `npm run build`.
- Manually verify core flows you changed (for example, login, locale switching, and related page navigation).

## Commit & Pull Request Guidelines
- Commit style in history is concise Chinese summaries (for example, `原型图优化`, `剧本页面更新`). Prefer adding scope when useful, such as `frontend: 登录表单校验修复`.
- PRs should include: purpose, changed paths/modules, validation commands, screenshots for UI changes, and linked issue/task.
- Explicitly note environment/config updates and any breaking behavior.
