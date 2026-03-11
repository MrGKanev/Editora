import React, { useEffect, useRef } from "react";
import { useUIStore } from "../../store/ui-store";
import { colorizeLog } from "../../utils/terminal";

function LogLine({ log }: { log: string }) {
  const spans = colorizeLog(log);
  return (
    <div className="whitespace-pre-wrap break-all leading-5 hover:bg-white/[0.02]">
      {spans.map((span, i) => (
        <span key={i} className={span.classes || "text-editor-muted"}>
          {span.text}
        </span>
      ))}
    </div>
  );
}

export default function TerminalPanel() {
  const { showTerminal, toggleTerminal, serverLogs, clearServerLogs, devServer } =
    useUIStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isStuckToBottom = useRef(true);

  // Track if user scrolled away from bottom
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 30;
    isStuckToBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  // Auto-scroll to bottom on new logs, only if stuck to bottom
  useEffect(() => {
    if (isStuckToBottom.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [serverLogs]);

  // Auto-show terminal when logs start coming in
  useEffect(() => {
    if (serverLogs.length > 0 && !showTerminal) {
      toggleTerminal();
    }
  }, [serverLogs.length > 0]);

  if (!showTerminal) return null;

  return (
    <div className="flex flex-col border-t bg-editor-bg" style={{ height: 200 }}>
      {/* Terminal header */}
      <div className="flex items-center justify-between px-3 py-1 bg-editor-surface border-b flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-editor-text">Terminal</span>
          {devServer.status === "running" && (
            <span className="flex items-center gap-1 text-xs text-editor-success">
              <span className="w-1.5 h-1.5 rounded-full bg-editor-success" />
              Running
            </span>
          )}
          {devServer.status === "starting" && (
            <span className="flex items-center gap-1 text-xs text-editor-warning">
              <span className="w-1.5 h-1.5 rounded-full bg-editor-warning animate-pulse" />
              Starting...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearServerLogs}
            className="text-xs text-editor-muted hover:text-editor-text transition-colors"
          >
            Clear
          </button>
          <button
            onClick={toggleTerminal}
            className="text-xs text-editor-muted hover:text-editor-text transition-colors px-1"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Terminal content */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto font-mono text-xs p-2"
      >
        {serverLogs.length === 0 ? (
          <p className="text-editor-muted">No output yet.</p>
        ) : (
          serverLogs.map((log, i) => <LogLine key={i} log={log} />)
        )}
      </div>
    </div>
  );
}
