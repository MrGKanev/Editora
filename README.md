<p align="center">
  <img src="assets/logos/logo.svg" width="128" height="128" alt="Editora logo">
</p>

<h1 align="center">Editora</h1>

<p align="center">
  A desktop CMS for static site generators.<br>
  Edit Markdown, manage frontmatter, preview content - all in one place.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-blue?style=flat-square" alt="Platforms">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/version-0.1.0-orange?style=flat-square" alt="Version">
</p>

---

## What is Editora?

Editora is a desktop content editor built for teams and individuals who use static site generators. Instead of editing raw files in a code editor, Editora provides a focused writing environment with live preview, frontmatter management, media handling, and built-in Git support.

Open your project (or clone a Git repo), edit content collections with a split-view Markdown editor, manage media, commit & push changes, and preview your site - all from one app.

### Supported Static Site Generators

| SSG | Status |
|-----|--------|
| Astro | Supported |
| Hugo | Supported |
| Eleventy (11ty) | Supported |
| Jekyll | Supported |
| Next.js | Supported |
| Nuxt Content | Supported |
| Gatsby | Supported |
| VitePress | Supported |
| Gridsome | Supported |
| Hexo | Supported |

## Features

- **Split Editor + Preview** - Write Markdown on the left, see rendered output on the right
- **Frontmatter Editor** - Visual form for editing YAML frontmatter fields (text, dates, tags, booleans, numbers)
- **Media Gallery** - Browse, upload, and manage images within your project. Insert into editor with one click
- **Built-in Git** - Stage, commit, push, and pull without leaving the editor
- **Dev Server** - Start your SSG dev server and see terminal output in-app
- **Auto-detection** - Detects your SSG and content directories automatically
- **Keyboard Shortcuts** - Standard shortcuts for save, find, preview toggle, and more
- **Cross-platform** - Builds for macOS (.dmg), Windows (.exe), and Linux (.deb)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Git](https://git-scm.com/) (for Git features)

### Install & Run

```bash
git clone https://github.com/MrGKanev/Editora.git
cd Editora
npm install
npm start
```

This launches the Electron app in development mode with hot reload.

### Build for Production

```bash
# Package the app (without installers)
npm run package

# Create platform-specific installers
npm run make
```

Installers are output to the `out/make/` directory.

## Usage

1. **Open a project** - Click "Open Project" and select a folder, or clone a Git repo directly
2. **Browse collections** - The sidebar auto-discovers content collections. Click a file to open it
3. **Edit content** - Markdown on the left, live preview on the right. Use the floating toolbar for formatting
4. **Frontmatter** - Click the "Frontmatter" button to edit metadata fields visually
5. **Save** - `Cmd+S` / `Ctrl+S` saves the file. Use `Save As` to export to a new location
6. **Manage media** - Switch to the Media tab to browse, upload, or insert images
7. **Commit & push** - Switch to the Git tab, write a commit message, and push
8. **Preview** - Switch to the Preview tab and start the dev server

## Keyboard Shortcuts

| Action | macOS | Windows / Linux |
|--------|-------|-----------------|
| Save | `Cmd+S` | `Ctrl+S` |
| Save As | `Cmd+Shift+S` | `Ctrl+Shift+S` |
| New File | `Cmd+N` | `Ctrl+N` |
| Open Project | `Cmd+O` | `Ctrl+O` |
| Toggle Preview | `Cmd+P` | `Ctrl+P` |
| Toggle Sidebar | `Cmd+B` | `Ctrl+B` |
| Toggle Terminal | `` Cmd+` `` | `` Ctrl+` `` |
| Reveal in Finder | `Cmd+Shift+R` | `Ctrl+Shift+R` |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop runtime | Electron |
| UI framework | React 19 |
| Language | TypeScript |
| Markdown editor | CodeMirror 6 |
| Markdown preview | react-markdown + remark-gfm |
| Frontmatter | gray-matter |
| State management | Zustand |
| Git operations | simple-git |
| Styling | Tailwind CSS 4 (Catppuccin Mocha theme) |
| Build tooling | Electron Forge + Vite |

## Project Structure

```
src/
  main/              # Electron main process
    ipc/             # IPC handlers (project, content, media, git, server)
    services/        # Business logic (dev server, media, collections)
    utils/           # Path safety, file helpers
  preload/           # Secure IPC bridge
  renderer/          # React frontend
    components/      # UI components
      editor/        # Split view, CodeMirror, preview, frontmatter form
      layout/        # Sidebar, status bar, terminal panel
      collections/   # Collection list, file tree
      media/         # Media gallery
      git/           # Git status, commit panel
      preview/       # Dev server controls
    store/           # Zustand stores (editor, project, UI)
    styles/          # Global CSS + Tailwind config
    utils/           # YAML serialization, helpers
  shared/            # Shared TypeScript types & constants
```

## License

MIT
