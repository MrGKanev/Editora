import React, { useEffect, useRef } from "react";
import { useUIStore } from "../../store/ui-store";

// ANSI color code to Tailwind class mapping
const ANSI_COLORS: Record<string, string> = {
  "30": "text-gray-500",
  "31": "text-red-400",
  "32": "text-green-400",
  "33": "text-yellow-400",
  "34": "text-blue-400",
  "35": "text-purple-400",
  "36": "text-cyan-400",
  "37": "text-gray-200",
  "90": "text-gray-500",
  "91": "text-red-300",
  "92": "text-green-300",
  "93": "text-yellow-300",
  "94": "text-blue-300",
  "95": "text-purple-300",
  "96": "text-cyan-300",
  "97": "text-white",
  "1": "font-bold",
  "2": "opacity-60",
  "3": "italic",
  "4": "underline",
};

interface TextSpan {
  text: string;
  classes: string;
}

function parseAnsi(line: string): TextSpan[] {
  const spans: TextSpan[] = [];
  const regex = /\x1b\[([0-9;]*)m/g;
  let lastIndex = 0;
  let currentClasses: string[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(line)) !== null) {
    // Add text before this escape
    if (match.index > lastIndex) {
      spans.push({
        text: line.slice(lastIndex, match.index),
        classes: currentClasses.join(" "),
      });
    }

    // Parse the codes
    const codes = match[1].split(";").filter(Boolean);
    for (const code of codes) {
      if (code === "0" || code === "") {
        currentClasses = [];
      } else if (ANSI_COLORS[code]) {
        // Replace color if it's a color code (30-37, 90-97)
        if ((parseInt(code) >= 30 && parseInt(code) <= 37) || (parseInt(code) >= 90 && parseInt(code) <= 97)) {
          currentClasses = currentClasses.filter((c) => !c.startsWith("text-"));
        }
        currentClasses.push(ANSI_COLORS[code]);
      }
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < line.length) {
    spans.push({
      text: line.slice(lastIndex),
      classes: currentClasses.join(" "),
    });
  }

  if (spans.length === 0 && line.length > 0) {
    spans.push({ text: line, classes: "" });
  }

  return spans;
}

function colorizeLog(log: string): TextSpan[] {
  // First try ANSI parsing
  const stripped = log.replace(/\x1b\[[0-9;]*m/g, "");
  const hasAnsi = stripped !== log;

  if (hasAnsi) {
    return parseAnsi(log);
  }

  // Heuristic coloring for common patterns
  const trimmed = log.trim();
  if (/^(error|ERR!|Error:)/i.test(trimmed)) {
    return [{ text: log, classes: "text-red-400" }];
  }
  if (/^(warn|warning|WARN)/i.test(trimmed)) {
    return [{ text: log, classes: "text-yellow-400" }];
  }
  if (/^(success|✓|✔|done|ready)/i.test(trimmed)) {
    return [{ text: log, classes: "text-green-400" }];
  }
  if (/^(info|INFO|➜|localhost:\d+)/i.test(trimmed) || trimmed.includes("localhost:")) {
    return [{ text: log, classes: "text-cyan-400" }];
  }
  if (/^\d{1,2}:\d{2}/.test(trimmed)) {
    // Timestamp prefix
    const tsEnd = trimmed.indexOf(" ");
    return [
      { text: log.slice(0, tsEnd + 1), classes: "text-gray-500" },
      { text: log.slice(tsEnd + 1), classes: "" },
    ];
  }

  return [{ text: log, classes: "" }];
}

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
