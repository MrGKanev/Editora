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

export interface TextSpan {
  text: string;
  classes: string;
}

export function parseAnsi(line: string): TextSpan[] {
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

export function colorizeLog(log: string): TextSpan[] {
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
