# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — run ESLint
- `npm test` — run Vitest (jsdom, `@testing-library/react`)

## Architecture

This is a personal portfolio website built as a **desktop OS simulator** using Next.js 16, React 19, Redux Toolkit, and Tailwind CSS 4. The entire app is a single client-side page (`src/app/page.tsx`) that shows a boot screen, then a desktop environment with draggable/resizable windows, a taskbar, and desktop icons.

### Key layers

- **Virtual filesystem** (`src/lib/filesystem/`) — an in-memory tree of `FSFile` and `FSDirectory` nodes stored in Redux. `seed.ts` builds the initial filesystem from content data. `operations.ts` has CRUD functions, `utils.ts` has path resolution.
- **Redux store** (`src/store/`) — three slices:
  - `filesystemSlice` — virtual FS state
  - `windowsSlice` — open windows, positions, z-index, minimize/maximize state. App types: `terminal`, `file-manager`, `text-viewer`, `python-editor`
  - `sessionSlice` — terminal cwd, command history, username/hostname
- **Window manager** (`src/components/window/`) — uses `react-rnd` for drag/resize. `Desktop.tsx` maps `AppWindow` state to rendered `<Window>` components with the correct app content inside.
- **Apps** (`src/components/apps/`) — each app is a component rendered inside a Window:
  - `terminal/` — shell emulator with its own command parser (`src/lib/terminal/`). Commands operate on the virtual filesystem.
  - `file-manager/` — breadcrumb navigation, file listing, opens `.py` files in `python-editor` and all other files in `text-viewer`
  - `text-viewer/` — renders markdown (via `react-markdown` + `remark-gfm` + `rehype-highlight`) or plain text
  - `python-editor/` — editable textarea with 500ms autosave + Run button; executes code via Pyodide (see `src/lib/python/pyodide.ts`, loads from CDN on first use) and shows stdout/stderr inline
- **Python execution** (`src/lib/python/pyodide.ts`) — wraps Pyodide v0.27 (WebAssembly Python via CDN). `runPython(code)` captures stdout into a StringIO buffer and returns `{ output, error }`.
- **Content data** (`src/content/data/`) — static profile/projects/experience/education/skills/interests exported as typed objects, consumed by `seed.ts` to populate the virtual filesystem.

### Adding a new app

1. Define the app type string in `AppType` union in `windowsSlice.ts`
2. Create components under `src/components/apps/<app-name>/`
3. Add the case to the `AppContent` switch in `Desktop.tsx`
4. Optionally add a desktop icon in `Desktop.tsx`

### Path alias

`@/*` maps to `./src/*` (configured in tsconfig).
