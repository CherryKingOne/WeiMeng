# Repository Guidelines

## Project Structure & Module Organization
This project is a Next.js 16 + React 19 frontend. Keep route code under `app/` (including locale-aware routes such as `app/[locale]/...`), and place reusable UI in `components/`. Use `services/` for API clients, `stores/` for Zustand state, and shared logic in `hooks/`, `utils/`, `constants/`, `types/`, and `config/`. Put static files in `public/`. Keep framework/runtime config at the root (`next.config.ts`, `middleware.ts`, `eslint.config.mjs`, `tsconfig.json`).

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start local development server on `http://localhost:5678`.
- `npm run lint`: run ESLint checks (`eslint-config-next` + TypeScript rules).
- `npm run build`: create production build and catch route/runtime issues.
- `npm run start`: run the production server on port `5678` after build.

Run `npm run lint && npm run build` before opening a PR.

## Coding Style & Naming Conventions
Use TypeScript with `strict: true` and functional React components. Follow existing 2-space indentation and keep import groups consistent. Use:
- `PascalCase` for component files (for example, `LoginForm.tsx`)
- `useXxx` for hooks
- descriptive `camelCase` for utility files
- Next.js route filenames: `page.tsx`, `layout.tsx`, `loading.tsx`

Prefer the `@/*` alias over deep relative imports. Keep code and UI text free of emoji characters.

## Testing Guidelines
There is no dedicated frontend test suite yet. Required validation for every change:
- `npm run lint`
- `npm run build`

Also manually verify key flows affected by your change (for example, authentication, locale switching, and navigation).

## Commit & Pull Request Guidelines
Follow the repository's concise Chinese commit style. Examples from history include `首页更改为weimeng` and `更新路由和页面`. When useful, add scope, such as `frontend: 登录表单校验修复`.

PRs should include:
- purpose and changed paths/modules
- config or environment updates
- validation commands and results
- screenshots for UI changes
- linked issue/task and any breaking changes
