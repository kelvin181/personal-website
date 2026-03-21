# Personal Website

A personal portfolio website built as a **desktop OS simulator** — visitors interact with a fully functional desktop environment complete with draggable/resizable windows, a taskbar, desktop icons, a terminal emulator, and a file manager.

## What it is

Instead of a traditional portfolio page, this site simulates a desktop operating system in the browser. You can:

- Open and arrange windows on a virtual desktop
- Use a **terminal** with a real shell-like interface (navigate directories, `cat` files, `ls`, etc.)
- Browse files with a **file manager** that shows your resume, projects, and experience as a virtual filesystem
- Read documents in a **text viewer** with markdown and syntax highlighting support

All portfolio content (projects, experience, education, skills) lives in `src/content/data/` and is seeded into an in-memory virtual filesystem at boot time.

## Tech stack

- **Next.js 16** / **React 19**
- **Redux Toolkit** — manages virtual filesystem, open windows, and terminal session state
- **Tailwind CSS 4**
- **react-rnd** — draggable and resizable windows
- **react-markdown** + **remark-gfm** + **rehype-highlight** — markdown rendering with syntax highlighting
- **JetBrains Mono** — monospace font

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Other commands

```bash
npm run build   # production build
npm run lint    # run ESLint
```

## Project structure

```
src/
  app/              # Next.js app router entry point
  components/
    apps/           # terminal, file-manager, text-viewer
    window/         # window manager (drag/resize, z-index)
    desktop/        # desktop icons, taskbar
  lib/
    filesystem/     # in-memory virtual FS (CRUD, path resolution)
    terminal/       # shell command parser
  store/            # Redux slices (filesystem, windows, session)
  content/
    data/           # static portfolio content (projects, experience, etc.)
```
