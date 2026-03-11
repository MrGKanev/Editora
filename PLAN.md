# Editora - Electron CMS за Astro сайтове

## Визия
Десктоп приложение (Electron + React), което позволява управление на съдържание
за Astro-базирани сайтове чрез интуитивен split-view Markdown редактор. Потребителят
свързва локална папка или Git repo и може да създава, редактира и изтрива content
collections, да управлява медийни файлове и да стартира live preview на сайта.

---

## Архитектура

```
┌─────────────────────────────────────────────┐
│              Electron Main Process          │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Project  │ │  Git     │ │ Astro Dev    │ │
│  │ Manager  │ │ Service  │ │ Server Mgr   │ │
│  └─────────┘ └──────────┘ └──────────────┘ │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ File    │ │ Collection│ │ Media        │ │
│  │ System  │ │ Discovery │ │ Manager      │ │
│  └─────────┘ └──────────┘ └──────────────┘ │
│                    │ IPC                     │
├────────────────────┼────────────────────────┤
│              Renderer (React)               │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Project  │ │ Content  │ │ Media        │ │
│  │ Selector │ │ Editor   │ │ Gallery      │ │
│  └─────────┘ └──────────┘ └──────────────┘ │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Sidebar │ │ Frontmatter│ │ Preview     │ │
│  │ Nav     │ │ Form     │ │ Panel        │ │
│  └─────────┘ └──────────┘ └──────────────┘ │
└─────────────────────────────────────────────┘
```

### Tech Stack
- **Electron** - десктоп runtime (electron-forge за build/package)
- **React 18** - UI framework (renderer process)
- **TypeScript** - навсякъде
- **CodeMirror 6** - Markdown editor (лява страна на split view)
- **react-markdown + remark/rehype** - Markdown preview (дясна страна)
- **gray-matter** - parse/stringify на frontmatter
- **simple-git** (isomorphic-git) - Git операции
- **Tailwind CSS** - стилизация
- **electron-store** - persist на настройки (recent projects и т.н.)
- **electron-builder** - build за macOS, Windows, Linux

---

## Фази на разработка

### Фаза 1: Скелет на проекта
- [ ] Инициализиране на Electron + React + TypeScript проект (electron-forge + Vite)
- [ ] Настройка на Tailwind CSS
- [ ] Основна структура на папки (main/, renderer/, shared/)
- [ ] IPC bridge между main и renderer
- [ ] Основен window management (заглавие, меню, размери)

### Фаза 2: Project Management
- [ ] "Open Folder" диалог - избиране на Astro проект
- [ ] "Clone Git Repo" - клониране на репозитори
- [ ] Валидация дали избраната папка е Astro проект (astro.config.*)
- [ ] Recent projects list (electron-store)
- [ ] Project selector начален екран

### Фаза 3: Collection Discovery
- [ ] Парсване на `src/content/config.ts` за дефинирани колекции
- [ ] Fallback: сканиране на `src/content/*/` директории
- [ ] Зареждане на списък с файлове за всяка колекция
- [ ] Парсване на frontmatter schema от config (zod schemas)
- [ ] Sidebar навигация: колекции → файлове (дървовидна структура)

### Фаза 4: Markdown Editor (Split View)
- [ ] CodeMirror 6 setup с Markdown syntax highlighting (лява страна)
- [ ] react-markdown preview (дясна страна) с live sync
- [ ] Frontmatter form: автоматично генериране от schema
  - [ ] Текстови полета, дати, тагове, boolean, select
  - [ ] Поддръжка за custom полета
- [ ] Запис на файл (Ctrl+S / Cmd+S)
- [ ] Създаване на нов файл в колекция
- [ ] Изтриване на файл (с потвърждение)
- [ ] Unsaved changes индикатор

### Фаза 5: Media Management
- [ ] Галерия с наличните изображения (public/ и src/assets/)
- [ ] Drag & drop качване на изображения
- [ ] Copy path / Insert в editor при избиране на изображение
- [ ] Preview на изображения (thumbnails)
- [ ] Изтриване на media файлове

### Фаза 6: Git Integration
- [ ] Git status индикатор (changed/staged/committed)
- [ ] Commit промени (с commit message)
- [ ] Push/Pull бутони
- [ ] Branch selector
- [ ] Diff view за промени (опционално за MVP)

### Фаза 7: Astro Dev Server Preview
- [ ] Стартиране на `astro dev` като child process
- [ ] Спиране на dev server
- [ ] Вграден browser (webview) за preview на localhost
- [ ] Status индикатор (running/stopped/error)
- [ ] Console output панел

### Фаза 8: Polish & Distribution
- [ ] Electron-builder конфигурация за macOS (.dmg), Windows (.exe/.msi), Linux (.AppImage/.deb)
- [ ] Auto-update (electron-updater)
- [ ] App icon и branding
- [ ] Keyboard shortcuts
- [ ] Error handling и notifications
- [ ] GitHub Actions CI за автоматични builds

---

## Структура на проекта

```
Editora/
├── package.json
├── electron-forge.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts             # Entry point, window creation
│   │   ├── ipc/                 # IPC handlers
│   │   │   ├── project.ts       # Open/clone project handlers
│   │   │   ├── content.ts       # Read/write content files
│   │   │   ├── media.ts         # Media file operations
│   │   │   ├── git.ts           # Git operations
│   │   │   └── server.ts        # Astro dev server management
│   │   ├── services/
│   │   │   ├── project-manager.ts
│   │   │   ├── collection-discovery.ts
│   │   │   ├── git-service.ts
│   │   │   ├── media-service.ts
│   │   │   └── dev-server.ts
│   │   └── menu.ts              # App menu
│   ├── renderer/                # React app
│   │   ├── index.html
│   │   ├── main.tsx             # React entry
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Titlebar.tsx
│   │   │   │   └── StatusBar.tsx
│   │   │   ├── project/
│   │   │   │   ├── ProjectSelector.tsx
│   │   │   │   └── RecentProjects.tsx
│   │   │   ├── editor/
│   │   │   │   ├── MarkdownEditor.tsx   # CodeMirror
│   │   │   │   ├── MarkdownPreview.tsx  # react-markdown
│   │   │   │   ├── SplitView.tsx
│   │   │   │   └── FrontmatterForm.tsx
│   │   │   ├── collections/
│   │   │   │   ├── CollectionList.tsx
│   │   │   │   └── FileTree.tsx
│   │   │   ├── media/
│   │   │   │   ├── MediaGallery.tsx
│   │   │   │   └── MediaUploader.tsx
│   │   │   ├── git/
│   │   │   │   ├── GitStatus.tsx
│   │   │   │   └── CommitPanel.tsx
│   │   │   └── preview/
│   │   │       └── SitePreview.tsx
│   │   ├── hooks/
│   │   │   ├── useProject.ts
│   │   │   ├── useCollections.ts
│   │   │   ├── useEditor.ts
│   │   │   └── useGit.ts
│   │   ├── store/               # Zustand state management
│   │   │   ├── project-store.ts
│   │   │   ├── editor-store.ts
│   │   │   └── ui-store.ts
│   │   └── styles/
│   │       └── globals.css
│   ├── shared/                  # Shared types
│   │   └── types.ts
│   └── preload/
│       └── index.ts             # Secure IPC bridge
├── resources/                   # App icons, assets
└── .github/
    └── workflows/
        └── build.yml            # CI/CD за builds
```

---

## Ключови решения

| Решение | Избор | Защо |
|---------|-------|------|
| Editor | CodeMirror 6 | По-лек от Monaco, перфектен за Markdown, добра мобилна поддръжка |
| State management | Zustand | Лек, прост, работи добре с React |
| Git | simple-git | Node.js wrapper, използва системния git |
| Build tool | electron-forge + Vite | Бърз HMR, модерен, официално поддържан |
| Styling | Tailwind CSS | Бързо развитие, consistent дизайн |
| Distribution | electron-builder | Поддържа всички платформи, auto-update |

---

## MVP Scope (v0.1)

Минималният продукт включва:
1. Отваряне на локална Astro папка
2. Автоматично откриване на content collections
3. Split-view Markdown редактор с frontmatter form
4. Създаване/редактиране/изтриване на content файлове
5. Базово media управление (галерия + upload)
6. Git commit & push
7. Вграден Astro dev server preview
8. Build за macOS, Windows, Linux

### Извън MVP обхвата (v0.2+)
- MDX поддръжка с компоненти
- Множество проекти едновременно
- Plugin система
- Collaboration features
- Drag & drop за пренареждане
- SEO инструменти
- Scheduling (планирано публикуване)
- i18n поддръжка за многоезични сайтове
