# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vue 3 + Vite application for WeiMeng (唯梦), an AI-assisted drama/video production platform. The app features a marketing site with i18n support, workspace for project management, and a studio interface for script writing, character management, storyboard generation, and video editing.

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

**Tech Stack**: Vue 3 (Composition API), Vue Router, Vue I18n, Vite, Tailwind CSS, FontAwesome, JSZip

**Entry Point**: src/main.js initializes the app with i18n, router, and FontAwesome icons

**Routing**: src/router/index.js defines routes with authentication guards:
- `/` - Home (marketing page with header/footer)
- `/login` - Login page
- `/workspace` - Workspace view (project management, requires auth)
- `/studio` - Studio interface (StudioDrama.vue - drama production editor, requires auth)

**Authentication**: Routes with `meta: { requiresAuth: true }` check localStorage('loggedIn') and redirect to login if not authenticated

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

## Studio View (src/views/StudioDrama.vue)

The studio is a drama production interface with four main tabs for the complete video production workflow:

**Tab System**: `activeTab` ref switches between:
- `'script'` - Script writing and upload
- `'characters'` - Character management and consistency
- `'storyboard'` - Storyboard generation with AI
- `'video'` - Video editing timeline

**Script Tab** (`activeTab === 'script'`):
- Three modes via `scriptMode` ref: 'selection', 'upload', 'write'
- Selection mode: Choose between uploading files or writing scripts
- Upload mode: Drag-and-drop or click to upload .txt, .md, .doc, .docx, .csv, .xlsx, .pdf (max 10MB)
  - `uploadedFiles` ref tracks files with `selected` state, upload progress, and completion status
  - Files automatically upload to backend via `uploadFileToBackend()` using XMLHttpRequest for progress tracking
  - `loadExistingFiles()` fetches files from backend on mount, using regex to preserve large integer IDs
  - File selection system with checkboxes: `fileListSelectAll` ref and `toggleFileSelection()` function
  - Batch delete functionality: `batchDeleteFiles()` deletes multiple selected files via API
  - Custom delete confirmation modal (`showDeleteFileConfirm`) instead of browser confirm
  - Toast notifications (`showToast`, `toastMessage`, `toastType`) for success/error feedback
- Write mode: Full-screen script editor with AI continuation dialog
  - `scriptContent` ref stores the script text
  - AI dialog (`showAiDialog`) positioned at cursor using DOM measurement
  - AI states: 'idle', 'generating', 'review' tracked by `aiState` ref
  - `scriptTextarea` ref for cursor position calculation

**Characters Tab** (`activeTab === 'characters'`):
- Grid display of character cards with avatar, name, role, description
- `characters` ref array stores character data
- Character creation modal (`showCharacterModal`) with image upload support
- Character extraction wizard (`showExtractWizard`) - 7-step process:
  1. Select script segments or uploaded files
  2. Select extracted character names
  3. Edit character appearance/details (age, address, identity, gender, relations, description)
  4. Review scene environments
  5. Review dialogue lines
  6. Choose character art style (2D/live-action)
  7. Choose scene style (2D/live-action)
- `extractedRoles` ref for wizard data, `roleDetails` reactive object for character metadata
- Character image upload with preview (`characterImagePreview`)

**Storyboard Tab** (`activeTab === 'storyboard'`):
- Two view modes via `storyboardView` ref: 'compact' (grid cards) or 'detail' (table)
- `storyboards` ref array with shot data: scene, size, shot type, duration, description, dialogue, sound, prompts, generated flags
- Batch operations: `generateAllImages()`, `generateAllVideos()` open size selection modal
- Size modal (`showSizeModal`) with aspect ratio options (1:1, 4:3, 3:4, 16:9, 9:16, 3:2, 2:3, 21:9)
- Action menu (`openActionMenuId`) for per-shot regeneration/deletion using teleported dropdown
- Export menu with three options: script CSV, images ZIP (using JSZip), videos CSV
- `ratioOptions` array defines pixel dimensions for each aspect ratio

**Video Tab** (`activeTab === 'video'`):
- Media library sidebar with drag-and-drop import
- `mediaLibrary` computed combines generated storyboard assets + `externalMedia` ref
- Preview window showing selected media (`currentPreview` ref)
- Timeline with video/audio tracks using drag-and-drop from media library
- `timelineItems` ref tracks placed clips with track, label, duration
- `getItemStyle()` calculates clip positioning (40px per second)
- Drag-and-drop handlers: `handleDragStart()`, `handleTimelineDrop()`, `handleMediaDrop()`

**Modal Architecture**: Uses `<teleport to="body">` for all modals:
- Character creation modal with image upload
- Character extraction wizard (multi-step)
- Size selection modal for image/video generation
- Action menu dropdown (positioned absolutely)

**Theme System**: `theme` ref ('light'/'dark') with `toggleTheme()` applying 'dark' class to document root

**State Management Patterns**:
- Menu tracking: `openActionMenuId` for storyboard action menus, `openExportMenu` for export dropdown
- File upload: `isDragging` for drag state, `fileInput` ref for hidden input trigger
- Media: `mediaIsDragging` for video tab drag state, `mediaFileInput` ref
- Wizard state: `extractStep` (1-7), `selectAll` for bulk selection, `roleEditing`/`roleDetailsOpen` reactive objects
- Style selection: `styleKind`/`sceneStyleKind` ('2d'/'live'), `selectedCharacterStyle`/`selectedSceneStyle`

**Key Patterns**:
- Cursor-positioned AI dialog using DOM measurement and mirror div technique
- File processing simulation with intervals and chunk counting
- CSV export with proper escaping and UTF-8 BOM
- ZIP export using JSZip for batch image downloads
- Drag-and-drop with JSON serialization via dataTransfer
- Computed properties for filtered views: `visibleSegments`, `visibleFiles`, `sceneSegments`, `dialogueSegments`

## Backend API Integration

**Base URL**: Configured via `API_BASE` constant: `import.meta.env.VITE_API_BASE || 'http://localhost:7767'`

**Authentication**: All API requests include `Authorization: Bearer ${token}` header from localStorage('accessToken')

**Key API Endpoints**:
- `GET /api/v1/script/libraries` - List script libraries
- `POST /api/v1/script/libraries` - Create script library
- `DELETE /api/v1/script/libraries/{id}` - Delete script library
- `GET /api/v1/script/libraries/{id}/files` - List files in library
- `POST /api/v1/script/libraries/{id}/files` - Upload file (multipart/form-data)
- `DELETE /api/v1/script/files/{fileId}` - Delete file

**Large Integer Handling**: Backend returns IDs as large integers (15+ digits) that exceed JavaScript's `Number.MAX_SAFE_INTEGER`. To preserve precision:
- Use regex replacement before JSON parsing: `text.replace(/"id":(\d{15,})/g, '"id":"$1"')`
- Always store IDs as strings in frontend state
- Example in `loadExistingFiles()` and `loadLibraries()` functions

**Error Handling Pattern**:
- 401 responses trigger redirect to `/login` via `router.push('/login')`
- Use custom modals instead of `window.confirm()` or `window.alert()`
- Show toast notifications for success/error feedback

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
- Use `reactive()` for objects that need deep reactivity (e.g., file upload progress tracking)
- Avoid browser default dialogs: use custom modals with `<teleport to="body">` instead
