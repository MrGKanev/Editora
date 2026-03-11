import React, { useMemo } from "react";
import { useProjectStore } from "../../store/project-store";
import { useEditorStore } from "../../store/editor-store";
import { useUIStore } from "../../store/ui-store";
import DeployButton from "./DeployButton";

function useWordStats(text: string) {
  return useMemo(() => {
    if (!text) return { words: 0, chars: 0, readingTime: "0 min" };
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const chars = text.length;
    const minutes = Math.max(1, Math.ceil(words / 250));
    return {
      words,
      chars,
      readingTime: `${minutes} min read`,
    };
  }, [text]);
}

export default function StatusBar() {
  const project = useProjectStore((s) => s.currentProject);
  const { currentFile, isDirty, isSaving, editorContent } = useEditorStore();
  const { devServer, gitStatus, toggleTerminal, showTerminal } = useUIStore();
  const setProject = useProjectStore((s) => s.setProject);
  const stats = useWordStats(editorContent);

  return (
    <div className="flex items-center justify-between px-3 py-1 border-t bg-editor-surface text-xs text-editor-muted">
      <div className="flex items-center gap-3">
        {/* Project name */}
        <button
          onClick={() => setProject(null)}
          className="hover:text-editor-text transition-colors"
          title="Change project"
        >
          {project?.name}
        </button>

        {project?.ssgName && (
          <span className="text-editor-accent/70">{project.ssgName}</span>
        )}

        {/* Git branch */}
        {gitStatus?.isRepo && (
          <span className="flex items-center gap-1">
            <span>&#9741;</span> {gitStatus.branch}
            {gitStatus.modified.length > 0 && (
              <span className="text-editor-warning">
                ({gitStatus.modified.length} modified)
              </span>
            )}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Word count + reading time */}
        {currentFile && (
          <span className="flex items-center gap-2">
            <span>{stats.words} words</span>
            <span className="text-editor-border">|</span>
            <span>{stats.chars} chars</span>
            <span className="text-editor-border">|</span>
            <span>{stats.readingTime}</span>
          </span>
        )}

        {/* Save status */}
        {currentFile && (
          <span>
            {isSaving
              ? "Saving..."
              : isDirty
              ? "Unsaved changes"
              : "Saved"}
          </span>
        )}

        {/* Deploy */}
        <DeployButton />

        {/* Terminal toggle */}
        <button
          onClick={toggleTerminal}
          className={`flex items-center gap-1 transition-colors hover:text-editor-text ${
            showTerminal ? "text-editor-accent" : ""
          }`}
          title="Toggle terminal"
        >
          &gt;_ Terminal
        </button>

        {/* Dev server status */}
        <span
          className={`flex items-center gap-1 ${
            devServer.status === "running"
              ? "text-editor-success"
              : devServer.status === "error"
              ? "text-editor-danger"
              : ""
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              devServer.status === "running"
                ? "bg-editor-success"
                : devServer.status === "starting"
                ? "bg-editor-warning animate-pulse"
                : devServer.status === "error"
                ? "bg-editor-danger"
                : "bg-editor-muted"
            }`}
          />
          {devServer.status === "running"
            ? `Server: ${devServer.url}`
            : `Server: ${devServer.status}`}
        </span>
      </div>
    </div>
  );
}
