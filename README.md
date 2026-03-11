# Editora

Desktop CMS for Astro-based websites. Open your Astro project (or clone a Git repo), edit content collections with a split-view Markdown editor, manage media, commit & push changes, and preview your site — all from one app.

## Features

- **Content Collections** — Auto-discovers all Astro content collections in `src/content/`. Browse and manage files in a sidebar tree.
- **Split-View Editor** — CodeMirror 6 Markdown editor on the left, live preview on the right. Syntax highlighting, line numbers, word wrap.
- **Frontmatter Form** — Auto-generated form fields based on your frontmatter (text, dates, tags, booleans, numbers). Edit metadata without touching raw YAML.
- **Media Management** — Gallery view of images in `public/` and `src/assets/`. Upload via drag & drop, insert into editor with one click.
- **Git Integration** — See changed files, write commit messages, push and pull — without leaving the app.
- **Dev Server Preview** — Start/stop `astro dev` from within Editora and preview your site in an embedded browser.
- **Cross-Platform** — Builds for macOS (.dmg), Windows (.exe), and Linux (.deb / .AppImage).

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

1. **Open a project** — Click "Open Astro Project" and select a folder containing an `astro.config.*` file. Or clone a Git repo directly.
2. **Browse collections** — The sidebar auto-discovers content collections. Click a file to open it.
3. **Edit content** — The editor shows Markdown on the left and a live preview on the right. Frontmatter fields appear as a form above the editor.
4. **Save** — `Ctrl+S` / `Cmd+S` saves the file.
5. **Manage media** — Switch to the Media tab to browse, upload, or insert images.
6. **Commit & push** — Switch to the Git tab, write a commit message, and push.
7. **Preview** — Switch to the Preview tab and start the Astro dev server.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop runtime | Electron |
| UI framework | React 18 |
| Language | TypeScript |
| Markdown editor | CodeMirror 6 |
| Markdown preview | react-markdown + remark-gfm |
| Frontmatter | gray-matter |
| State management | Zustand |
| Git operations | simple-git |
| Styling | Tailwind CSS |
| Build tooling | Electron Forge + Vite |
| Distribution | electron-builder (macOS, Windows, Linux) |

## Project Structure

```
src/
├── main/                  # Electron main process
│   ├── index.ts           # Window creation, app lifecycle
│   ├── menu.ts            # Application menu
│   ├── ipc/               # IPC handlers (project, content, media, git, server)
│   └── services/          # Business logic
│       ├── project-manager.ts
│       ├── collection-discovery.ts
│       ├── git-service.ts
│       ├── media-service.ts
│       └── dev-server.ts
├── renderer/              # React frontend
│   ├── components/        # UI components
│   │   ├── project/       # Project selector, recent projects
│   │   ├── layout/        # Sidebar, status bar
│   │   ├── editor/        # Split view, CodeMirror, preview, frontmatter form
│   │   ├── collections/   # Collection list, file tree
│   │   ├── media/         # Media gallery
│   │   ├── git/           # Git status, commit panel
│   │   └── preview/       # Dev server controls, embedded preview
│   └── store/             # Zustand stores (project, editor, UI)
├── preload/               # Secure IPC bridge
└── shared/                # Shared TypeScript types
```

## License

MIT
