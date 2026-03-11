import React, { useEffect } from "react";
import { useProjectStore } from "./store/project-store";
import { useEditorStore } from "./store/editor-store";
import { useUIStore } from "./store/ui-store";
import { buildFileContent } from "./utils/yaml";
import ProjectSelector from "./components/project/ProjectSelector";
import Sidebar from "./components/layout/Sidebar";
import StatusBar from "./components/layout/StatusBar";
import EditorArea from "./components/editor/EditorArea";
import TerminalPanel from "./components/layout/TerminalPanel";

function TitleBar() {
  return (
    <div
      className="h-9 flex-shrink-0 flex items-center bg-editor-surface border-b select-none"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {/* Spacer for macOS traffic lights */}
      <div className="w-[78px] flex-shrink-0" />
      <span className="text-xs text-editor-muted font-medium">Editora</span>
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

export default function App() {
  const project = useProjectStore((s) => s.currentProject);
  const showSidebar = useUIStore((s) => s.showSidebar);

  useMenuEvents();

  if (!project) {
    return (
      <div className="flex flex-col h-screen">
        <TitleBar />
        <div className="flex-1 overflow-hidden">
          <ProjectSelector />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden min-h-0">
        {showSidebar && <Sidebar />}
        <EditorArea />
      </div>
      <TerminalPanel />
      <StatusBar />
    </div>
  );
}
