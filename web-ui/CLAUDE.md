# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vue 3 + Vite application for OneFour, an AI-assisted Axure prototyping platform. The app features a marketing site with i18n support, workspace for project management, and a studio interface for prototype design.

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

**Tech Stack**: Vue 3 (Composition API), Vue Router, Vue I18n, Vite, Tailwind CSS, FontAwesome

**Entry Point**: src/main.js initializes the app with i18n, router, and FontAwesome icons

**Routing**: src/router/index.js defines routes:
- `/` - Home (marketing page with header/footer)
- `/login` - Login page
- `/workspace` - Workspace view (project management)
- `/studio` - Studio interface (StudioAxure.vue - prototype editor)

**Layout Logic**: App.vue conditionally shows Header/Footer only on home route using computed properties based on route.name

**I18n**: src/i18n.js contains English and Chinese translations. Locale persists to localStorage ('locale' key). All UI text should use i18n keys with $t() or {{ $t('key') }}.

**Styling**: Tailwind CSS is primary styling system. Custom styles in src/assets/ (base.css, tailwind.css, main.css loaded in order)

**Icons**: FontAwesome icons registered in main.js. Use `<fa :icon="['fas', 'icon-name']" />` component. All icons must be imported and added to library in main.js before use.

**Path Alias**: `@` resolves to `src/` directory (configured in vite.config.js)

**Theme System**: Dark/light mode managed via localStorage ('theme' key) and applied to document root class ('dark' class). Each view (Workspace, Studio) implements its own theme application logic via applyTheme() function.

## Workspace View (src/views/Workspace.vue)

The workspace is the main project management interface with complex state management:

**Modal Architecture**: Uses Vue's `<teleport to="body">` for all modals to ensure proper z-index stacking:
- Settings modal (`showSettings`) - Multi-tab workspace configuration
- Account modal (`showAccount`) - User profile management with inline editing
- Password reset modal (`showReset`) - Password change flow with verification code
- Change email modal (`showChangeEmail`) - Email change with two-phase verification (current + new)
- Create project modal (`showCreateModal`) - New project creation with validation
- Duplicate project modal (`showDuplicate`) - Project duplication with custom naming
- Add member modal (`showAddMember`) - Team member invitation
- Invite link modal (`showInviteLink`) - Share invite link after adding member

**Modal Pattern**: Each modal follows this structure:
1. Boolean ref for visibility (e.g., `showSettings`)
2. Open function that closes user menu first, waits for nextTick, then shows modal
3. Close function that resets modal state and clears form data
4. Click outside backdrop to close (via `@click` on backdrop div)
5. Form validation with error refs (e.g., `nameError`, `permError`)

**State Management Patterns**:
- Search/filter: `headerSearch` ref with computed `filteredProjects`, `filteredFavoritesByHeader`, etc.
- Section navigation: `currentSection` ref ('drafts', 'favorites', 'recent', 'team', 'recycle')
- View modes: `viewMode` ref ('grid' or 'list')
- Sort: `sortOption` ref ('modified', 'name') with `sortOrder` ref ('asc', 'desc')
- Menu tracking: `openMenuId` ref for project menus, `roleMenuForId` ref for member role menus

**Global Click Handler**: Document-level click listener (`onDocClick`) closes all open menus/dropdowns. Use `@click.stop` on interactive elements inside dropdowns to prevent propagation. Handler checks for specific data attributes (e.g., `data-project-menu`, `data-project-menu-button`).

**Toast/Notification System**:
- `toastOpen` + `toastText` + `toastType` for temporary success/error messages
- `copyHintOpen` + `copyHintText` for clipboard feedback
- Auto-dismiss after 2 seconds using setTimeout

**Member Management**:
- Members list with search functionality (`searchQuery` + `filteredMembers` computed)
- Role menu system using `roleMenuForId` ref to track which member's menu is open
- Inline editing for admin and member names using window.prompt

## Studio View (src/views/StudioAxure.vue)

The studio is the prototype editor interface with layer management:

**Layer System**:
- `layersOpen` ref tracks expanded/collapsed state for layer groups
- `locks` ref tracks locked state for individual layers
- `visible` ref tracks visibility state for layers
- `layerMenuId` ref tracks which layer's context menu is open

**Sidebar Tabs**: `sidebarTab` ref switches between 'components', 'layers', etc.

**Theme**: Implements its own theme system reading from localStorage and applying 'dark' class to document root

## Key Conventions

- Use Composition API with `<script setup>`
- All user-facing text must be internationalized via i18n keys (note: current implementation has mixed Chinese/English hardcoded text that should be migrated to i18n)
- Components organized by type: layout/, sections/, icons/
- Views in src/views/ for route components
- Modal z-index: Use z-50 for modals to ensure proper stacking
- Always use `@click.stop` on interactive elements inside dropdowns to prevent menu closure
- Form validation pattern: separate error ref for each field, clear on submit, set on validation failure
- Use `nextTick()` before showing modals to ensure DOM updates complete
- Cleanup timers in component lifecycle (use onBeforeUnmount to clear intervals/timeouts)
