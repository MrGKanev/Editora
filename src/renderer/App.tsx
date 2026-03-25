import React, { useEffect, useState, useCallback } from "react";
import { useProjectStore } from "./store/project-store";
import { useEditorStore } from "./store/editor-store";
import { useUIStore } from "./store/ui-store";
import { buildFileContent } from "./utils/yaml";
const ProjectSelector = React.lazy(() => import("./components/project/ProjectSelector"));
const Sidebar = React.lazy(() => import("./components/layout/Sidebar"));
const StatusBar = React.lazy(() => import("./components/layout/StatusBar"));
const EditorArea = React.lazy(() => import("./components/editor/EditorArea"));
const TerminalPanel = React.lazy(() => import("./components/layout/TerminalPanel"));
const ShortcutsPanel = React.lazy(() => import("./components/layout/ShortcutsPanel"));

function TitleBar() {
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    window.editora.getVersion().then(setVersion);
  }, []);

  return (
    <div
      className="h-9 flex-shrink-0 flex items-center bg-editor-surface border-b select-none"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {/* Spacer for macOS traffic lights */}
      <div className="w-[78px] flex-shrink-0" />
      <span className="text-xs text-editor-muted font-medium">
        Editora{version ? ` v${version}` : ""}
      </span>
    </div>
  );
}

function useMenuEvents() {
  const save = useEditorStore((s) => s.save);
  const currentFile = useEditorStore((s) => s.currentFile);
  const editorContent = useEditorStore((s) => s.editorContent);
  const frontmatter = useEditorStore((s) => s.frontmatter);
  const openProjectPath = useProjectStore((s) => s.openProjectPath);
  const togglePreview = useUIStore((s) => s.togglePreview);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleTerminal = useUIStore((s) => s.toggleTerminal);

  useEffect(() => {
    const cleanups: (() => void)[] = [];

    // Save
    cleanups.push(
      window.editora.onMenuEvent("menu:save", () => {
        save();
      })
    );

    // Save As
    cleanups.push(
      window.editora.onMenuEvent("menu:save-as", (filePath: unknown) => {
        if (typeof filePath === "string") {
          const content = buildFileContent(frontmatter, editorContent);
          window.editora.writeContent(filePath, content);
        }
      })
    );

    // Export HTML
    cleanups.push(
      window.editora.onMenuEvent("menu:export-html", (filePath: unknown) => {
        if (typeof filePath === "string") {
          // Get the rendered HTML from the preview
          const previewEl = document.querySelector(".prose");
          if (previewEl) {
            const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${currentFile?.name || "Export"}</title></head>
<body>${previewEl.innerHTML}</body>
</html>`;
            window.editora.writeContent(filePath as string, html);
          }
        }
      })
    );

    // Open project
    cleanups.push(
      window.editora.onMenuEvent("menu:open-project", (path: unknown) => {
        if (typeof path === "string") {
          openProjectPath(path);
        }
      })
    );

    // New file
    cleanups.push(
      window.editora.onMenuEvent("menu:new-file", () => {
        useEditorStore.getState().closeFile();
      })
    );

    // Reveal in Finder
    cleanups.push(
      window.editora.onMenuEvent("menu:reveal-file", () => {
        const file = useEditorStore.getState().currentFile;
        if (file) {
          window.editora.showItemInFolder(file.path);
        }
      })
    );

    // Toggle preview
    cleanups.push(
      window.editora.onMenuEvent("menu:toggle-preview", () => {
        togglePreview();
      })
    );

    // Toggle sidebar
    cleanups.push(
      window.editora.onMenuEvent("menu:toggle-sidebar", () => {
        toggleSidebar();
      })
    );

    // Toggle terminal
    cleanups.push(
      window.editora.onMenuEvent("menu:toggle-terminal", () => {
        toggleTerminal();
      })
    );

    return () => cleanups.forEach((fn) => fn());
  }, [save, currentFile, editorContent, frontmatter, openProjectPath, togglePreview, toggleSidebar, toggleTerminal]);
}

function ExitFocusButton() {
  const toggleFocusMode = useUIStore((s) => s.toggleFocusMode);
  const [visible, setVisible] = useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseMove = useCallback(() => {
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 2000);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handleMouseMove]);

  return (
    <button
      onClick={toggleFocusMode}
      className={`fixed bottom-4 right-4 z-50 px-3 py-1.5 text-xs rounded-lg
        bg-editor-surface border text-editor-muted hover:text-editor-text
        shadow-lg transition-opacity duration-300
        ${visible ? "opacity-100" : "opacity-0"}`}
    >
      Exit Focus (Ctrl+Shift+F)
    </button>
  );
}

export default function App() {
  const project = useProjectStore((s) => s.currentProject);
  const showSidebar = useUIStore((s) => s.showSidebar);
  const focusMode = useUIStore((s) => s.focusMode);
  const theme = useUIStore((s) => s.theme);
  const toggleFocusMode = useUIStore((s) => s.toggleFocusMode);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useMenuEvents();

  // Apply theme class to root element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("theme-light");
    } else {
      root.classList.remove("theme-light");
    }
  }, [theme]);

  // Keyboard shortcut: Cmd/Ctrl+Shift+F to toggle focus mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "F") {
        e.preventDefault();
        toggleFocusMode();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleFocusMode]);

  // Keyboard shortcut: Cmd/Ctrl+/ to toggle shortcuts panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setShowShortcuts((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!project) {
    return (
      <div className="flex flex-col h-screen">
        <TitleBar />
        <div className="flex-1 overflow-hidden">
          <React.Suspense fallback={null}>
            <ProjectSelector />
          </React.Suspense>
        </div>
      </div>
    );
  }

  return (
    <React.Suspense fallback={null}>
      <div className="flex flex-col h-screen">
        {!focusMode && <TitleBar />}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {showSidebar && !focusMode && <Sidebar />}
          <EditorArea />
        </div>
        {!focusMode && <TerminalPanel />}
        {!focusMode && <StatusBar />}
        {focusMode && <ExitFocusButton />}
        <ShortcutsPanel isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      </div>
    </React.Suspense>
  );
}
