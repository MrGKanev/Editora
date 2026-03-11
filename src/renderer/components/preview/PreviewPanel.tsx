import React from "react";
import { useProjectStore } from "../../store/project-store";
import { useUIStore } from "../../store/ui-store";

export default function PreviewPanel() {
  const project = useProjectStore((s) => s.currentProject);
  const { devServer, setDevServer, serverLogs, addServerLog, clearServerLogs } =
    useUIStore();

  const handleStart = async () => {
    if (!project) return;
    clearServerLogs();
    setDevServer({ status: "starting" });

    // Set up log listener
    const cleanup = window.editora.onServerLog((log) => {
      addServerLog(log);
    });

    try {
      const state = await window.editora.serverStart(project.path);
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
          <p className="text-xs text-editor-success">
            Running at {devServer.url}
          </p>
          <webview
            src={devServer.url}
            className="w-full h-80 rounded border bg-white"
          />
        </div>
      )}

      {devServer.status === "error" && (
        <p className="text-xs text-editor-danger">{devServer.error}</p>
      )}

      {/* Logs */}
      {serverLogs.length > 0 && (
        <div>
          <p className="text-xs text-editor-muted mb-1">Console Output</p>
          <div className="bg-editor-bg rounded border p-2 max-h-48 overflow-y-auto font-mono text-xs">
            {serverLogs.map((log, i) => (
              <div key={i} className="whitespace-pre-wrap break-all">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
