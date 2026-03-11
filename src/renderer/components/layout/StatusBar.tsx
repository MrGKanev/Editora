import React, { useMemo, useState, useRef, useEffect } from "react";
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

function WordGoalPopover({
  currentGoal,
  onSetGoal,
  onClose,
}: {
  currentGoal: number | undefined;
  onSetGoal: (goal: number | null) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(currentGoal ? String(currentGoal) : "");
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(value, 10);
    if (num > 0) {
      onSetGoal(num);
    }
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-full mb-2 right-0 bg-editor-surface border rounded-lg shadow-xl p-3 z-50 min-w-[200px]"
    >
      <form onSubmit={handleSubmit} className="space-y-2">
        <label className="block text-xs text-editor-muted">Word Goal</label>
        <input
          ref={inputRef}
          type="number"
          min="1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Set word goal"
          className="w-full px-2 py-1 text-xs bg-editor-bg border rounded
                     focus:outline-none focus:border-editor-accent"
        />
        <div className="flex items-center gap-1.5">
          <button
            type="submit"
            className="px-2 py-0.5 text-xs bg-editor-accent text-editor-bg rounded hover:opacity-90"
          >
            Set
          </button>
          {currentGoal && (
            <button
              type="button"
              onClick={() => {
                onSetGoal(null);
                onClose();
              }}
              className="px-2 py-0.5 text-xs text-editor-danger hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default function StatusBar() {
  const project = useProjectStore((s) => s.currentProject);
  const { currentFile, isDirty, isSaving, editorContent, wordGoals, setWordGoal } = useEditorStore();
  const { devServer, gitStatus, toggleTerminal, showTerminal, theme, toggleTheme } = useUIStore();
  const setProject = useProjectStore((s) => s.setProject);
  const stats = useWordStats(editorContent);
  const [showGoalPopover, setShowGoalPopover] = useState(false);

  const currentGoal = currentFile ? wordGoals[currentFile.path] : undefined;
  const goalPct = currentGoal ? Math.min(100, Math.round((stats.words / currentGoal) * 100)) : 0;

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
        {/* Word count + reading time + goal */}
        {currentFile && (
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => setShowGoalPopover(!showGoalPopover)}
              className="flex items-center gap-2 hover:text-editor-text transition-colors"
              title="Click to set word goal"
            >
              <span>{stats.words} words</span>
              {currentGoal && (
                <>
                  <span className="text-editor-border">|</span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={
                        goalPct >= 100
                          ? "text-editor-success"
                          : goalPct >= 50
                          ? "text-editor-warning"
                          : "text-editor-muted"
                      }
                    >
                      {stats.words}/{currentGoal} ({goalPct}%)
                    </span>
                    <span className="inline-block w-16 h-1.5 bg-editor-bg rounded-full overflow-hidden">
                      <span
                        className={`block h-full rounded-full transition-all ${
                          goalPct >= 100
                            ? "bg-editor-success"
                            : goalPct >= 50
                            ? "bg-editor-warning"
                            : "bg-editor-accent"
                        }`}
                        style={{ width: `${goalPct}%` }}
                      />
                    </span>
                  </span>
                </>
              )}
            </button>
            <span className="text-editor-border">|</span>
            <span>{stats.chars} chars</span>
            <span className="text-editor-border">|</span>
            <span>{stats.readingTime}</span>

            {showGoalPopover && currentFile && (
              <WordGoalPopover
                currentGoal={currentGoal}
                onSetGoal={(goal) => setWordGoal(currentFile.path, goal)}
                onClose={() => setShowGoalPopover(false)}
              />
            )}
          </div>
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

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1 transition-colors hover:text-editor-text"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? "\u2600" : "\u263D"} {theme === "dark" ? "Light" : "Dark"}
        </button>

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
