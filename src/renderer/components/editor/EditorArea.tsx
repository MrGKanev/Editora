import React, { useEffect, useState } from "react";
import { useEditorStore } from "../../store/editor-store";
import { useProjectStore } from "../../store/project-store";
import { useUIStore } from "../../store/ui-store";
import SplitView from "./SplitView";
import FrontmatterForm from "./FrontmatterForm";
import SEOPanel from "./SEOPanel";
import LinkCheckerPanel from "./LinkCheckerPanel";

function TabBar() {
  const { tabs, activeTabPath, setActiveTab, closeTab } = useEditorStore();

  if (tabs.length === 0) return null;

  return (
    <div
      className="flex items-center border-b bg-editor-surface overflow-x-auto"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      {tabs.map((tab) => {
        const isActive = tab.file.path === activeTabPath;
        return (
          <div
            key={tab.file.path}
            className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs border-r cursor-pointer
              select-none min-w-0 max-w-[180px] transition-colors
              ${isActive
                ? "bg-editor-bg text-editor-text"
                : "text-editor-muted hover:text-editor-text hover:bg-editor-bg/50"
              }`}
            onClick={() => setActiveTab(tab.file.path)}
          >
            <span className="truncate">{tab.file.name}</span>
            {tab.isDirty && (
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-editor-accent" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.file.path);
              }}
              className="flex-shrink-0 ml-auto opacity-0 group-hover:opacity-100
                         hover:text-editor-danger transition-all text-[10px] leading-none"
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function EditorArea() {
  const { currentFile, frontmatter, isDirty, save } = useEditorStore();
  const collections = useProjectStore((s) => s.collections);
  const showPreview = useUIStore((s) => s.showPreview);
  const focusMode = useUIStore((s) => s.focusMode);
  const [showFrontmatter, setShowFrontmatter] = useState(false);
  const [showSEO, setShowSEO] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Find schema for the current file's collection
  const schema = React.useMemo(() => {
    if (!currentFile) return undefined;
    for (const col of collections) {
      if (col.files.some((f) => f.path === currentFile.path)) {
        return col.schema;
      }
    }
    return undefined;
  }, [currentFile, collections]);

  // Close drawers when switching files
  useEffect(() => {
    setShowFrontmatter(false);
    setShowSEO(false);
    setShowLinks(false);
  }, [currentFile?.path]);

  const closeAllDrawers = () => {
    setShowFrontmatter(false);
    setShowSEO(false);
    setShowLinks(false);
  };

  // Keyboard shortcut: Ctrl/Cmd + S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save]);

  // Warn before closing with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  if (!currentFile) {
    return (
      <div className="flex-1 flex flex-col">
        {!focusMode && <TabBar />}
        <div className="flex-1 flex items-center justify-center text-editor-muted">
          <div className="text-center">
            <p className="text-lg">Select a file to edit</p>
            <p className="text-sm mt-1">
              Choose a content file from the sidebar
            </p>
          </div>
        </div>
      </div>
    );
  }

  const fieldCount = Object.keys(frontmatter).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Tab bar */}
      {!focusMode && <TabBar />}

      {/* Toolbar */}
      {!focusMode && <div
        className="flex items-center justify-between px-4 py-1.5 border-b bg-editor-surface text-sm"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="truncate text-editor-muted text-xs">
            {currentFile.name}
          </span>
          {isDirty && (
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-editor-accent" title="Unsaved changes" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { const next = !showLinks; closeAllDrawers(); setShowLinks(next); }}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              showLinks
                ? "bg-editor-accent text-editor-bg"
                : "text-editor-muted hover:text-editor-text hover:bg-editor-border/50"
            }`}
          >
            Links
          </button>
          <button
            onClick={() => { const next = !showSEO; closeAllDrawers(); setShowSEO(next); }}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              showSEO
                ? "bg-editor-accent text-editor-bg"
                : "text-editor-muted hover:text-editor-text hover:bg-editor-border/50"
            }`}
          >
            SEO
          </button>
          {fieldCount > 0 && (
            <button
              onClick={() => { const next = !showFrontmatter; closeAllDrawers(); setShowFrontmatter(next); }}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                showFrontmatter
                  ? "bg-editor-accent text-editor-bg"
                  : "text-editor-muted hover:text-editor-text hover:bg-editor-border/50"
              }`}
            >
              Frontmatter ({fieldCount})
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu((v) => !v)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                showExportMenu
                  ? "bg-editor-accent text-editor-bg"
                  : "text-editor-muted hover:text-editor-text hover:bg-editor-border/50"
              }`}
            >
              Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-editor-surface border rounded-lg shadow-xl py-1 min-w-[160px] z-50">
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    if (currentFile) window.editora.exportHTML(currentFile.path);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-editor-text hover:bg-editor-accent/20 transition-colors"
                >
                  Export as HTML
                </button>
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    if (currentFile) window.editora.exportPDF(currentFile.path);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-editor-text hover:bg-editor-accent/20 transition-colors"
                >
                  Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>}

      {/* Editor + Preview */}
      <SplitView showPreview={showPreview} />

      {/* Frontmatter drawer */}
      <FrontmatterForm
        isOpen={showFrontmatter}
        onClose={() => setShowFrontmatter(false)}
        schema={schema}
      />

      {/* SEO drawer */}
      <SEOPanel
        isOpen={showSEO}
        onClose={() => setShowSEO(false)}
      />

      {/* Link checker drawer */}
      <LinkCheckerPanel
        isOpen={showLinks}
        onClose={() => setShowLinks(false)}
      />
    </div>
  );
}
