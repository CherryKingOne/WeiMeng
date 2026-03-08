---
name: frontend-empty-state-ux
description: Fix list-page empty-state flashing and loading jitter by using explicit loading state gating before empty-state rendering. Use whenever users mention "刷新先看到暂无数据", "空状态闪一下", "页面抖动", "列表先空后有", loading skeleton strategy, or ask for smooth first-paint list UX.
---

# Frontend Empty-State UX

## Goal
Eliminate "empty-state flashing" on list pages and provide stable, professional loading transitions.

## Core Principle
Never render "empty state" before initial data fetching is completed.

Correct render priority:
1. `isInitialLoading === true` -> render skeleton/loading UI
2. `isInitialLoading === false && list.length === 0` -> render empty state
3. `isInitialLoading === false && list.length > 0` -> render list

## Standard State Model
Use at least these states:
- `list: T[]` (default `[]`)
- `isInitialLoading: boolean` (default `true`)
- `isRefreshing: boolean` (default `false`)
- `errorMessage: string` (default `''`)

## Required Workflow
1. On page mount, keep `isInitialLoading = true`.
2. Start fetch request.
3. On success: set list data.
4. On failure: set error state.
5. In `finally`: set `isInitialLoading = false`.
6. Only after step 5 is it allowed to evaluate empty-state UI.

## Render Rules
Apply these exact rendering rules:
- Blocking error card: only when `errorMessage` exists and `list.length === 0`.
- Non-blocking warning: when `errorMessage` exists and `list.length > 0`.
- Empty state: only when not loading, no blocking error, and filtered list is empty.

## Anti-Patterns (Do Not)
- Do not infer loading by checking `list.length === 0`.
- Do not render empty state during initial request.
- Do not clear list to `[]` before every refresh.
- Do not use full-screen blocking loading for local refresh operations.

## Minimal Example
```tsx
const [list, setList] = useState<Item[]>([]);
const [isInitialLoading, setIsInitialLoading] = useState(true);

useEffect(() => {
  const run = async () => {
    try {
      const data = await fetchList();
      setList(data);
    } finally {
      setIsInitialLoading(false);
    }
  };
  void run();
}, []);

if (isInitialLoading) return <Skeleton />;
if (list.length === 0) return <EmptyState />;
return <List data={list} />;
```

## Output Template
When this skill is triggered, respond with:
1. **Cause**: why empty-state flash occurs in current code.
2. **Fix Plan**: loading gating + state flow.
3. **Patch Scope**: exact files/components to modify.
4. **Acceptance**:
   - No empty-state flash on refresh.
   - First paint shows skeleton/loading until request settles.
   - Empty-state appears only when confirmed no data.

## Team Guideline
Use this sentence to align FE/PM/UI:
"Empty-state is a post-fetch business result, not a pre-fetch default UI."
