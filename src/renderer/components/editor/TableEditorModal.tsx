import React, { useState, useCallback, useEffect, useRef } from "react";

interface TableEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (markdown: string) => void;
  initialMarkdown?: string;
}

function parseMarkdownTable(md: string): { headers: string[]; rows: string[][] } | null {
  const lines = md.trim().split("\n").filter((l) => l.trim());
  if (lines.length < 2) return null;

  const parseLine = (line: string) =>
    line.split("|").map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length);

  const headers = parseLine(lines[0]);
  if (headers.length === 0) return null;

  // Line 1 should be the separator
  if (!/^[\s|:-]+$/.test(lines[1])) return null;

  const rows = lines.slice(2).map((line) => {
    const cells = parseLine(line);
    // Pad or trim to match header count
    while (cells.length < headers.length) cells.push("");
    return cells.slice(0, headers.length);
  });

  return { headers, rows };
}

function generateMarkdownTable(headers: string[], rows: string[][]): string {
  const colWidths = headers.map((h, i) => {
    const cellWidths = rows.map((r) => (r[i] || "").length);
    return Math.max(h.length, ...cellWidths, 3);
  });

  const pad = (text: string, width: number) => text.padEnd(width);
  const headerLine = "| " + headers.map((h, i) => pad(h, colWidths[i])).join(" | ") + " |";
  const separator = "| " + colWidths.map((w) => "-".repeat(w)).join(" | ") + " |";
  const dataLines = rows.map(
    (row) => "| " + row.map((cell, i) => pad(cell || "", colWidths[i])).join(" | ") + " |"
  );

  return [headerLine, separator, ...dataLines].join("\n");
}

export default function TableEditorModal({
  isOpen,
  onClose,
  onInsert,
  initialMarkdown,
}: TableEditorModalProps) {
  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(3);
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<string[][]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Initialize from markdown or defaults
  useEffect(() => {
    if (!isOpen) return;

    if (initialMarkdown) {
      const parsed = parseMarkdownTable(initialMarkdown);
      if (parsed) {
        setHeaders(parsed.headers);
        setData(parsed.rows.length > 0 ? parsed.rows : [new Array(parsed.headers.length).fill("")]);
        setCols(parsed.headers.length);
        setRows(parsed.rows.length || 1);
        setIsEditing(true);
        return;
      }
    }

    // Fresh table
    setHeaders(new Array(cols).fill("").map((_, i) => `Header ${i + 1}`));
    setData(Array.from({ length: rows }, () => new Array(cols).fill("")));
    setIsEditing(false);
  }, [isOpen, initialMarkdown]);

  const updateSize = useCallback(
    (newCols: number, newRows: number) => {
      const clampedCols = Math.max(1, Math.min(10, newCols));
      const clampedRows = Math.max(1, Math.min(50, newRows));

      setCols(clampedCols);
      setRows(clampedRows);

      setHeaders((prev) => {
        const next = [...prev];
        while (next.length < clampedCols) next.push(`Header ${next.length + 1}`);
        return next.slice(0, clampedCols);
      });

      setData((prev) => {
        const next = prev.map((row) => {
          const r = [...row];
          while (r.length < clampedCols) r.push("");
          return r.slice(0, clampedCols);
        });
        while (next.length < clampedRows) next.push(new Array(clampedCols).fill(""));
        return next.slice(0, clampedRows);
      });
    },
    []
  );

  const updateHeader = useCallback((col: number, value: string) => {
    setHeaders((prev) => {
      const next = [...prev];
      next[col] = value;
      return next;
    });
  }, []);

  const updateCell = useCallback((row: number, col: number, value: string) => {
    setData((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = value;
      return next;
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, row: number, col: number, isHeader: boolean) => {
      // Navigate with Tab/Enter/Arrow keys
      let nextRow = row;
      let nextCol = col;
      let nextIsHeader = isHeader;

      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          nextCol = col - 1;
          if (nextCol < 0) {
            nextCol = cols - 1;
            if (isHeader) return;
            nextRow = row - 1;
            if (nextRow < 0) {
              nextIsHeader = true;
              nextRow = 0;
            }
          }
        } else {
          nextCol = col + 1;
          if (nextCol >= cols) {
            nextCol = 0;
            if (isHeader) {
              nextIsHeader = false;
              nextRow = 0;
            } else {
              nextRow = row + 1;
              if (nextRow >= rows) return;
            }
          }
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (isHeader) {
          nextIsHeader = false;
          nextRow = 0;
        } else {
          nextRow = row + 1;
          if (nextRow >= rows) return;
        }
      } else {
        return;
      }

      const key = nextIsHeader ? `h-${nextCol}` : `${nextRow}-${nextCol}`;
      inputRefs.current.get(key)?.focus();
    },
    [cols, rows]
  );

  const handleInsert = useCallback(() => {
    const md = generateMarkdownTable(headers, data);
    onInsert(md);
    onClose();
  }, [headers, data, onInsert, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-editor-surface border rounded-lg shadow-2xl max-w-[90vw] max-h-[80vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-sm font-medium">
              {isEditing ? "Edit Table" : "Insert Table"}
            </h2>
            <div className="flex items-center gap-3">
              {/* Size controls */}
              <div className="flex items-center gap-2 text-xs text-editor-muted">
                <label className="flex items-center gap-1">
                  Cols
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={cols}
                    onChange={(e) => updateSize(Number(e.target.value), rows)}
                    className="w-12 px-1.5 py-0.5 bg-editor-bg border rounded text-editor-text text-center"
                  />
                </label>
                <label className="flex items-center gap-1">
                  Rows
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={rows}
                    onChange={(e) => updateSize(cols, Number(e.target.value))}
                    className="w-12 px-1.5 py-0.5 bg-editor-bg border rounded text-editor-text text-center"
                  />
                </label>
              </div>
              <button
                onClick={onClose}
                className="text-editor-muted hover:text-editor-text text-lg leading-none px-1"
              >
                &times;
              </button>
            </div>
          </div>

          {/* Table grid */}
          <div className="flex-1 overflow-auto p-4">
            <table className="border-collapse text-sm">
              <thead>
                <tr>
                  {headers.map((header, col) => (
                    <th key={col} className="p-0">
                      <input
                        ref={(el) => {
                          if (el) inputRefs.current.set(`h-${col}`, el);
                        }}
                        value={header}
                        onChange={(e) => updateHeader(col, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, 0, col, true)}
                        className="w-full min-w-[100px] px-2 py-1.5 bg-editor-accent/10 border
                                   font-medium text-editor-text
                                   focus:outline-none focus:bg-editor-accent/20"
                        placeholder={`Header ${col + 1}`}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, colIdx) => (
                      <td key={colIdx} className="p-0">
                        <input
                          ref={(el) => {
                            if (el) inputRefs.current.set(`${rowIdx}-${colIdx}`, el);
                          }}
                          value={cell}
                          onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx, false)}
                          className="w-full min-w-[100px] px-2 py-1.5 bg-editor-bg border
                                     text-editor-text
                                     focus:outline-none focus:bg-editor-border/30"
                          placeholder=""
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-editor-muted">
              Tab to navigate cells, Enter to move down
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-editor-muted hover:text-editor-text rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInsert}
                className="px-3 py-1.5 text-xs bg-editor-accent text-editor-bg rounded hover:opacity-90 transition-opacity"
              >
                {isEditing ? "Update Table" : "Insert Table"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export { parseMarkdownTable, generateMarkdownTable };
