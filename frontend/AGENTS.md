# Repository Guidelines

## Project Structure & Module Organization
`app/[locale]` holds localized Next.js App Router pages, with route groups such as `(public-sidebar)`, `auth`, `workbench`, and `workflows`. Put shared shell pieces in `components/layout`, reusable primitives in `components/ui`, and domain-specific cards, grids, and dialogs in `components/features`. Keep API calls in `services/*.service.ts`, Zustand state in `stores/*.store.ts`, shared hooks in `hooks/`, types in `types/`, and small helpers in `utils/`. Store static assets and logos in `public/`.

## Build, Test, and Development Commands
Use `npm install` to sync dependencies. `npm run dev` starts the app on `http://localhost:5678`. `npm run lint` runs ESLint with Next.js core-web-vitals and TypeScript rules. `npm run build` creates the production build, and `npm run start` serves that build on port `5678`. For an explicit type check, run `npx tsc --noEmit`.

## Coding Style & Naming Conventions
This codebase is strict TypeScript with the `@/*` path alias enabled. Follow the existing style: 2-space indentation, single quotes, semicolons, and functional React components. Use PascalCase for component files and exports (`WorkflowCard.tsx`), camelCase for hooks and utilities (`useLocalePath.ts`, `localizeRequestError`), and `*.service.ts` / `*.store.ts` for service and Zustand modules. Keep user-facing copy locale-aware and consistent with `constants/i18n.ts`.

## Testing Guidelines
There is no dedicated unit or e2e test runner configured yet, and no coverage threshold is enforced. Until a test framework is added, treat `npm run lint`, `npx tsc --noEmit`, and `npm run build` as the minimum validation set before opening a PR. If you introduce tests, prefer `*.test.ts` or `*.test.tsx` naming and place them near the feature or under a future `tests/` directory.

## Commit & Pull Request Guidelines
Recent history favors short, imperative Chinese commit subjects focused on one outcome, for example `更新文档与docker配置` and `新增...接口`. Keep commits small and scoped to a single concern. PRs should explain the user-visible change, list affected routes or services, link the related issue when available, and include screenshots for UI work. Add the verification commands you ran, especially for locale-sensitive pages under `app/[locale]`.
