import React, { useEffect, useState, useCallback, useRef } from "react";
import { useProjectStore } from "../../store/project-store";
import { useUIStore } from "../../store/ui-store";

export default function GitPanel() {
  const project = useProjectStore((s) => s.currentProject);
  const { gitStatus, setGitStatus } = useUIStore();
  const [commitMessage, setCommitMessage] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const projectPathRef = useRef(project?.path);
  projectPathRef.current = project?.path;

  const refreshStatus = useCallback(async () => {
    const currentPath = projectPathRef.current;
    if (!currentPath) return;
    try {
      const status = await window.editora.gitStatus(currentPath);
      setGitStatus(status);
    } catch {
      setGitStatus(null);
    }
  }, [setGitStatus]);

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 10000);
    return () => clearInterval(interval);
  }, [project?.path, refreshStatus]);

  if (!gitStatus?.isRepo) {
    return (
      <div className="p-4 text-sm text-editor-muted">
        This project is not a Git repository.
      </div>
    );
  }

  const handleCommit = async () => {
    if (!project || !commitMessage.trim()) return;
    setIsWorking(true);
    setError(null);
    try {
      await window.editora.gitCommit(project.path, commitMessage);
      setCommitMessage("");
      refreshStatus();
    } catch (err) {
      setError(`Commit failed: ${(err as Error).message}`);
    } finally {
      setIsWorking(false);
    }
  };

  const handlePush = async () => {
    if (!project) return;
    setIsWorking(true);
    setError(null);
    try {
      await window.editora.gitPush(project.path);
      refreshStatus();
    } catch (err) {
      setError(`Push failed: ${(err as Error).message}`);
    } finally {
      setIsWorking(false);
    }
  };

  const handlePull = async () => {
    if (!project) return;
    setIsWorking(true);
    setError(null);
    try {
      await window.editora.gitPull(project.path);
      refreshStatus();
    } catch (err) {
      setError(`Pull failed: ${(err as Error).message}`);
    } finally {
      setIsWorking(false);
    }
  };

  const changedFiles = [
    ...gitStatus.modified.map((f) => ({ file: f, type: "M" as const })),
    ...gitStatus.untracked.map((f) => ({ file: f, type: "?" as const })),
    ...gitStatus.staged.map((f) => ({ file: f, type: "S" as const })),
  ];

  return (
    <div className="p-3 space-y-3">
      {/* Error banner */}
      {error && (
        <div className="px-2 py-1.5 text-xs bg-editor-danger/10 text-editor-danger rounded border border-editor-danger/20">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 opacity-60 hover:opacity-100"
          >
            &times;
          </button>
        </div>
      )}

      {/* Branch info */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{gitStatus.branch}</span>
        <div className="flex gap-1 text-xs text-editor-muted">
          {gitStatus.ahead > 0 && <span>&uarr;{gitStatus.ahead}</span>}
          {gitStatus.behind > 0 && <span>&darr;{gitStatus.behind}</span>}
        </div>
      </div>

      {/* Push / Pull */}
      <div className="flex gap-2">
        <button
          onClick={handlePull}
          disabled={isWorking}
          className="flex-1 px-2 py-1.5 text-xs bg-editor-bg border rounded
                     hover:bg-editor-border/50 disabled:opacity-50 transition-colors"
        >
          Pull
        </button>
        <button
          onClick={handlePush}
          disabled={isWorking}
          className="flex-1 px-2 py-1.5 text-xs bg-editor-bg border rounded
                     hover:bg-editor-border/50 disabled:opacity-50 transition-colors"
        >
          Push
        </button>
      </div>

      {/* Changed files */}
      {changedFiles.length > 0 && (
        <div>
          <p className="text-xs text-editor-muted mb-1">
            Changes ({changedFiles.length})
          </p>
          <div className="max-h-40 overflow-y-auto space-y-0.5">
            {changedFiles.map(({ file, type }) => (
              <div
                key={file}
                className="flex items-center gap-2 px-2 py-0.5 text-xs rounded
                           hover:bg-editor-bg/50"
              >
                <span
                  className={
                    type === "M"
                      ? "text-editor-warning"
                      : type === "?"
                      ? "text-editor-success"
                      : "text-editor-accent"
                  }
                >
                  {type}
                </span>
                <span className="truncate">{file}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commit */}
      <div className="space-y-2">
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Commit message..."
          rows={3}
          className="w-full px-2 py-1.5 text-sm bg-editor-bg border rounded resize-none
                     focus:outline-none focus:border-editor-accent"
        />
        <button
          onClick={handleCommit}
          disabled={isWorking || !commitMessage.trim() || changedFiles.length === 0}
          className="w-full px-3 py-1.5 text-sm bg-editor-accent text-editor-bg rounded
                     hover:bg-editor-accent/90 disabled:opacity-50 transition-colors"
        >
          {isWorking ? "Working..." : "Commit All"}
        </button>
      </div>
    </div>
  );
}
