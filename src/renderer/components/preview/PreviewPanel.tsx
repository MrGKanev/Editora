import React from "react";
import { useProjectStore } from "../../store/project-store";
import { useUIStore } from "../../store/ui-store";


export default function PreviewPanel() {
  const project = useProjectStore((s) => s.currentProject);
  const { devServer, setDevServer, addServerLog, clearServerLogs, toggleTerminal, showTerminal } =
    useUIStore();

  const handleStart = async () => {
    if (!project) return;
    clearServerLogs();
    setDevServer({ status: "starting" });

    // Set up log listener
    window.editora.onServerLog((log) => {
      addServerLog(log);
    });

    try {
      const state = await window.editora.serverStart(project.path, project.ssgId);
      setDevServer(state);
    } catch (err) {
      setDevServer({ status: "error", error: (err as Error).message });
    }
  };

  const handleStop = async () => {
    await window.editora.serverStop();
    setDevServer({ status: "stopped" });
  };

  return (
    <div className="p-3 space-y-3">
      {/* Controls */}
      <div className="flex gap-2">
        {devServer.status === "stopped" || devServer.status === "error" ? (
          <button
            onClick={handleStart}
            className="flex-1 px-3 py-1.5 text-sm bg-editor-success/10 text-editor-success
                       rounded hover:bg-editor-success/20 transition-colors"
          >
            Start Dev Server
          </button>
        ) : (
          <button
            onClick={handleStop}
            disabled={devServer.status === "starting"}
            className="flex-1 px-3 py-1.5 text-sm bg-editor-danger/10 text-editor-danger
                       rounded hover:bg-editor-danger/20 disabled:opacity-50 transition-colors"
          >
            {devServer.status === "starting" ? "Starting..." : "Stop Server"}
          </button>
        )}
      </div>

      {/* Status */}
      {devServer.status === "running" && devServer.url && (
        <div className="space-y-2">
          <p className="text-xs text-editor-success flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-editor-success animate-pulse" />
            Running at{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.open(devServer.url!, "_blank");
              }}
              className="text-editor-accent underline hover:text-editor-accent/80"
            >
              {devServer.url}
            </a>
          </p>
        </div>
      )}

      {devServer.status === "error" && (
        <p className="text-xs text-editor-danger">{devServer.error}</p>
      )}

      {/* Toggle terminal */}
      <button
        onClick={toggleTerminal}
        className="w-full px-3 py-1.5 text-sm text-editor-muted
                   rounded border hover:bg-editor-border/30 transition-colors"
      >
        {showTerminal ? "Hide Terminal" : "Show Terminal"}
      </button>
    </div>
  );
}
