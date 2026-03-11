import React, { useEffect, useState } from "react";
import { useEditorStore } from "../../store/editor-store";
import { useUIStore } from "../../store/ui-store";
import SplitView from "./SplitView";
import FrontmatterForm from "./FrontmatterForm";

export default function EditorArea() {
  const { currentFile, frontmatter, isDirty, save } = useEditorStore();
  const showPreview = useUIStore((s) => s.showPreview);
  const [showFrontmatter, setShowFrontmatter] = useState(false);

  // Close drawer when switching files
  useEffect(() => {
    setShowFrontmatter(false);
  }, [currentFile?.path]);

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
      <div className="flex-1 flex items-center justify-center text-editor-muted">
        <div className="text-center">
          <p className="text-lg">Select a file to edit</p>
          <p className="text-sm mt-1">
            Choose a content file from the sidebar
          </p>
        </div>
      </div>
    );
  }

  const fieldCount = Object.keys(frontmatter).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Toolbar */}
      <div
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
          {fieldCount > 0 && (
            <button
              onClick={() => setShowFrontmatter(!showFrontmatter)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                showFrontmatter
                  ? "bg-editor-accent text-editor-bg"
                  : "text-editor-muted hover:text-editor-text hover:bg-editor-border/50"
              }`}
            >
              Frontmatter ({fieldCount})
            </button>
          )}
        </div>
      </div>

      {/* Editor + Preview */}
      <SplitView showPreview={showPreview} />

      {/* Frontmatter drawer */}
      <FrontmatterForm
        isOpen={showFrontmatter}
        onClose={() => setShowFrontmatter(false)}
      />
    </div>
  );
}
