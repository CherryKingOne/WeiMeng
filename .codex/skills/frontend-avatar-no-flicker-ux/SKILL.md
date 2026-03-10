---
name: frontend-avatar-no-flicker-ux
description: Eliminate refresh-time UI flicker for authenticated frontend pages by using cookie-aware auth, SSR-first initial data, cache-first hydration, silent background revalidation, and stable asset URLs. Use this skill whenever the user mentions refresh flicker, avatar/name/description jumping, fallback content flashing before real data, settings pages showing defaults first, token only stored in localStorage, blob avatar delays, or asks to reach commercial-grade no-waiting UX.
---

# Frontend Avatar No-Flicker UX

## Role
Act as the frontend no-waiting UX engineer for authenticated pages with profile, avatar, list, and settings data.

## Use When
- User says refresh causes visible jump or flicker.
- Avatar, name, description, or list content briefly show fallback text before real data.
- Settings form first renders defaults, then jumps to backend values.
- Token is stored only in `localStorage`, so SSR cannot fetch initial data.
- Avatar or media must wait for `blob` fetch before rendering.
- The user wants a commercial-grade first paint with no obvious refresh delay.

## Goals
- Avoid painting incorrect fallback content before real data is available.
- Make authenticated first paint SSR-capable when the page requires real initial data.
- Keep current panel and page state stable after refresh.
- Use cache as a secondary accelerator, not the primary truth source.
- Revalidate in background without breaking already-visible UI.

## Core Diagnosis
If a hard refresh flashes fallback UI, the root problem is usually one of these:
1. The server cannot access authenticated data because the token lives only in `localStorage`.
2. The page renders URL params or local defaults before real backend data resolves.
3. Avatar or media uses a client-only `blob -> dataURL` path as the primary render path.
4. Empty state or default form values render before loading state is resolved.

## Architecture Rule
Use this priority order for first paint:
1. Server-provided authenticated data.
2. Stable cached data that matches the same entity and version.
3. Skeleton or placeholder block.
4. Hardcoded fallback text only when the data is truly optional.

Do not use this order:
1. Hardcoded fallback
2. Client request
3. Real data overwrite

## Auth And Token Rules
- Do not rely on `localStorage` token alone for pages that need SSR-first data.
- Sync the access token into a cookie so Next server components or route handlers can read auth state on refresh.
- Keep `localStorage` only as a client convenience layer, not the only auth carrier.
- On `401`, clear both cookie and local storage token.
- If the project later moves to a server session or refresh-token model, prefer that over ad hoc client-only auth state.

## Data Loading Workflow
1. Decide whether the page needs real initial data on hard refresh.
2. If yes, fetch critical data on the server:
   - page header/profile
   - settings initial values
   - first-screen list data
3. Pass that data into the client component as initial state.
4. Hydrate on the client without replacing visible data with defaults.
5. Revalidate silently in the background and merge only successful updates.
6. Use local cache only as a fallback when the server path is unavailable.

## Avatar And Media Rules
- Do not make `blob -> dataURL` the primary first-render path for persisted avatars.
- Prefer a stable URL or a frontend proxy route such as `/api/.../avatar` so the browser can cache and paint immediately.
- Add a version key or path-based cache busting when the avatar changes.
- Keep optimistic local preview after upload, then converge back to the stable remote URL.
- Do not clear the current avatar on transient fetch errors.

## Implementation Checklist
- URL panel persistence:
  - query key: `panel`
  - values: `files`, `settings`
- Auth:
  - token stored in `localStorage`
  - token also synced to cookie
  - SSR path can read auth token
  - `401` clears both stores
- SSR initial data:
  - server component or route handler fetches critical first-screen data
  - client component receives `initialData`
  - client does silent refresh instead of full fallback reset
- Cache-first fallback:
  - key format: `scripts_library_profile_cache_v1:{library_id}`
  - safe read with type guards
  - write cache after successful fetch/save/upload
  - cache is fallback, not sole source of truth
- Avatar display:
  - stable URL or proxy route for persisted avatar
  - optimistic preview during upload
  - fallback to initials only when avatar truly does not exist
  - do not clear avatar on transient errors
- Background refresh:
  - keep UI stable while revalidating
  - apply updates only when fetch succeeds
- Settings form:
  - do not render fake defaults into inputs before profile/config loads
  - use skeleton/loading placeholders instead
- Empty state:
  - gate empty state behind resolved loading state
  - do not show "暂无数据" before first request completes

## Rules And Constraints
- Keep existing Tailwind visual language.
- Do not hardcode visible placeholder text into user-editable values.
- Do not reset panel to default during refresh if query has valid panel.
- Avoid blocking already-available cached content with full-page loading masks.
- Avoid rendering incorrect data just to avoid showing a skeleton.
- If the page is authenticated and commercially important, raise the technical bar: solve the data path, not only the symptom.

## Future Optimization Playbook
When building new pages, check these questions before coding:
1. On hard refresh, what exact data must be correct on first paint?
2. Can the server fetch it with current auth design?
3. If not, should auth move to cookie or server session?
4. Are images or files rendered through stable URLs, or through client-only blobs?
5. Does the page show skeletons before data is resolved, or fake defaults?
6. Can the page do stale-while-revalidate instead of full teardown-and-repaint?

## Review Heuristics
Flag the implementation if you see:
- `useEffect(() => fetch..., [])` followed by visible fallback content in the first render.
- Page header uses URL params while backend data arrives later.
- Avatar first paint depends on `getBlob()` or `URL.createObjectURL()` for persisted assets.
- Token exists only in `localStorage` on a page that clearly needs SSR-first data.
- Settings page fills form values with placeholders and then overwrites them.

## Output Format
Provide:
1. Files changed.
2. Auth and token strategy (`localStorage`, cookie, SSR access).
3. First-paint data strategy (SSR, cache fallback, skeletons, silent refresh).
4. Avatar/media rendering strategy.
5. Validation commands and results.
