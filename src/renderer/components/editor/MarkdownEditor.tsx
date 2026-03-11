import React, { useCallback, useMemo, useRef, useState } from "react";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { html } from "@codemirror/lang-html";
import { languages } from "@codemirror/language-data";
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { search, openSearchPanel, searchKeymap } from "@codemirror/search";
import { keymap } from "@codemirror/view";
import { useEditorStore } from "../../store/editor-store";
import { useProjectStore } from "../../store/project-store";
import TableEditorModal, { parseMarkdownTable } from "./TableEditorModal";
import ImageUploadDialog from "../media/ImageUploadDialog";

const editorTheme = EditorView.theme({
  "&": {
    backgroundColor: "#1e1e2e",
    color: "#cdd6f4",
  },
  ".cm-content": {
    caretColor: "#89b4fa",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: "13px",
    lineHeight: "1.7",
    padding: "16px",
  },
  ".cm-cursor": {
    borderLeftColor: "#89b4fa",
  },
  ".cm-selectionBackground": {
    backgroundColor: "rgba(137, 180, 250, 0.15) !important",
  },
  ".cm-activeLine": {
    backgroundColor: "transparent",
    borderLeft: "2px solid #89b4fa",
  },
  ".cm-gutters": {
    backgroundColor: "#1e1e2e",
    color: "#6c7086",
    border: "none",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "#89b4fa",
  },
  // Search panel styling
  ".cm-panels": {
    backgroundColor: "#242435",
    borderBottom: "1px solid #313146",
  },
  ".cm-search": {
    fontSize: "13px",
  },
  ".cm-search label": {
    color: "#cdd6f4",
  },
  ".cm-search input, .cm-search button": {
    backgroundColor: "#1e1e2e",
    color: "#cdd6f4",
    border: "1px solid #313146",
    borderRadius: "4px",
    padding: "2px 6px",
  },
  ".cm-search button": {
    cursor: "pointer",
  },
  ".cm-search button:hover": {
    backgroundColor: "#313146",
  },
  ".cm-searchMatch": {
    backgroundColor: "rgba(249, 226, 175, 0.25)",
    borderRadius: "2px",
  },
  ".cm-searchMatch-selected": {
    backgroundColor: "rgba(137, 180, 250, 0.35)",
  },
});

const highlightStyle = HighlightStyle.define([
  { tag: tags.heading1, color: "#89b4fa", fontWeight: "bold", fontSize: "1.4em" },
  { tag: tags.heading2, color: "#89b4fa", fontWeight: "bold", fontSize: "1.2em" },
  { tag: tags.heading3, color: "#89b4fa", fontWeight: "bold", fontSize: "1.1em" },
  { tag: tags.heading, color: "#89b4fa", fontWeight: "bold" },
  { tag: tags.strong, color: "#cdd6f4", fontWeight: "bold" },
  { tag: tags.emphasis, color: "#cdd6f4", fontStyle: "italic" },
  { tag: tags.link, color: "#89b4fa", textDecoration: "underline" },
  { tag: tags.url, color: "#89b4fa" },
  { tag: tags.monospace, color: "#f5c2e7" },
  { tag: tags.angleBracket, color: "#585b70" },
  { tag: tags.tagName, color: "#585b70" },
  { tag: tags.attributeName, color: "#585b70" },
  { tag: tags.attributeValue, color: "#585b70" },
  { tag: tags.comment, color: "#585b70", fontStyle: "italic" },
  { tag: tags.string, color: "#a6e3a1" },
  { tag: tags.meta, color: "#f9e2af" },
  { tag: tags.processingInstruction, color: "#6c7086" },
  { tag: tags.quote, color: "#a6adc8", fontStyle: "italic" },
]);

interface ToolbarAction {
  label: string;
  icon: string;
  wrap: [string, string];
}

// Primary actions shown directly in the floating toolbar
const primaryActions: ToolbarAction[] = [
  { label: "Bold", icon: "B", wrap: ["**", "**"] },
  { label: "Italic", icon: "I", wrap: ["*", "*"] },
  { label: "Strikethrough", icon: "S", wrap: ["~~", "~~"] },
  { label: "Code", icon: "<>", wrap: ["`", "`"] },
  { label: "Link", icon: "\u{1F517}", wrap: ["[", "](url)"] },
  { label: "Image", icon: "\u{1F5BC}", wrap: ["![", "](url)"] },
];

// Secondary actions in the "More" dropdown
const moreActions: ToolbarAction[] = [
  { label: "Heading 1", icon: "H1", wrap: ["# ", ""] },
  { label: "Heading 2", icon: "H2", wrap: ["## ", ""] },
  { label: "Heading 3", icon: "H3", wrap: ["### ", ""] },
  { label: "Bullet List", icon: "\u2022 List", wrap: ["- ", ""] },
  { label: "Numbered List", icon: "1. List", wrap: ["1. ", ""] },
  { label: "Blockquote", icon: "\u201C Quote", wrap: ["> ", ""] },
  { label: "Code Block", icon: "{ } Block", wrap: ["```\n", "\n```"] },
  { label: "Horizontal Rule", icon: "\u2014 Rule", wrap: ["\n---\n", ""] },
  { label: "Highlight", icon: "Highlight", wrap: ["<mark>", "</mark>"] },
  { label: "Superscript", icon: "x\u00B2", wrap: ["<sup>", "</sup>"] },
  { label: "Subscript", icon: "x\u2082", wrap: ["<sub>", "</sub>"] },
];

function FloatingToolbar({
  pos,
  onAction,
}: {
  pos: { x: number; y: number } | null;
  onAction: (action: ToolbarAction) => void;
}) {
  const [showMore, setShowMore] = React.useState(false);

  if (!pos) return null;

  return (
    <div
      className="fixed z-50 flex items-center gap-0.5 bg-editor-surface border rounded-lg shadow-xl px-1 py-1"
      style={{ left: pos.x, top: pos.y }}
    >
      {primaryActions.map((action) => (
        <button
          key={action.label}
          title={action.label}
          onMouseDown={(e) => {
            e.preventDefault();
            onAction(action);
          }}
          className={`px-2 py-1 text-xs rounded hover:bg-editor-accent/20 text-editor-text transition-colors
            ${action.label === "Bold" ? "font-bold" : ""}
            ${action.label === "Italic" ? "italic" : ""}
            ${action.label === "Strikethrough" ? "line-through" : ""}
            ${action.label === "Code" ? "font-mono" : ""}
          `}
        >
          {action.icon}
        </button>
      ))}

      {/* Divider */}
      <div className="w-px h-4 bg-editor-border mx-0.5" />

      {/* More button */}
      <div className="relative">
        <button
          title="More formatting"
          onMouseDown={(e) => {
            e.preventDefault();
            setShowMore(!showMore);
          }}
          className="px-2 py-1 text-xs rounded hover:bg-editor-accent/20 text-editor-muted transition-colors"
        >
          ...
        </button>

        {showMore && (
          <div className="absolute bottom-full right-0 mb-1 bg-editor-surface border rounded-lg shadow-xl py-1 min-w-[150px]">
            {moreActions.map((action) => (
              <button
                key={action.label}
                title={action.label}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setShowMore(false);
                  onAction(action);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-editor-text hover:bg-editor-accent/20 transition-colors"
              >
                {action.icon}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "svg", "webp", "avif", "ico"]);

export default function MarkdownEditor() {
  const { editorContent, setEditorContent } = useEditorStore();
  const project = useProjectStore((s) => s.currentProject);
  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableEditMarkdown, setTableEditMarkdown] = useState<string | undefined>();
  const [tableEditRange, setTableEditRange] = useState<{ from: number; to: number } | null>(null);
  const [dropUploadPaths, setDropUploadPaths] = useState<string[]>([]);
  const [showDropUpload, setShowDropUpload] = useState(false);

  // Detect if cursor is inside a markdown table
  const detectTableAtCursor = useCallback(() => {
    const view = cmRef.current?.view;
    if (!view) return null;

    const pos = view.state.selection.main.head;
    const doc = view.state.doc;
    const lineNum = doc.lineAt(pos).number;

    // Walk up and down from cursor to find table boundaries
    let startLine = lineNum;
    let endLine = lineNum;

    // Check if current line looks like a table line
    const isTableLine = (n: number) => {
      if (n < 1 || n > doc.lines) return false;
      const text = doc.line(n).text.trim();
      return text.startsWith("|") && text.endsWith("|");
    };

    if (!isTableLine(lineNum)) return null;

    while (startLine > 1 && isTableLine(startLine - 1)) startLine--;
    while (endLine < doc.lines && isTableLine(endLine + 1)) endLine++;

    const lines: string[] = [];
    for (let i = startLine; i <= endLine; i++) {
      lines.push(doc.line(i).text);
    }

    const tableMarkdown = lines.join("\n");
    if (!parseMarkdownTable(tableMarkdown)) return null;

    return {
      markdown: tableMarkdown,
      from: doc.line(startLine).from,
      to: doc.line(endLine).to,
    };
  }, []);

  const openTableEditor = useCallback(
    (existingTable?: { markdown: string; from: number; to: number }) => {
      if (existingTable) {
        setTableEditMarkdown(existingTable.markdown);
        setTableEditRange({ from: existingTable.from, to: existingTable.to });
      } else {
        setTableEditMarkdown(undefined);
        setTableEditRange(null);
      }
      setShowTableModal(true);
    },
    []
  );

  const handleTableInsert = useCallback(
    (md: string) => {
      const view = cmRef.current?.view;
      if (!view) return;

      if (tableEditRange) {
        // Replace existing table
        view.dispatch({
          changes: { from: tableEditRange.from, to: tableEditRange.to, insert: md },
        });
      } else {
        // Insert at cursor
        const pos = view.state.selection.main.head;
        view.dispatch({
          changes: { from: pos, insert: "\n" + md + "\n" },
        });
      }
      view.focus();
    },
    [tableEditRange]
  );

  const onChange = useCallback(
    (value: string) => {
      setEditorContent(value);
    },
    [setEditorContent]
  );

  // Track selection changes to show/hide toolbar
  const selectionListener = useMemo(
    () =>
      EditorView.updateListener.of((update) => {
        if (!update.selectionSet && !update.docChanged) return;

        const view = update.view;
        const { from, to } = view.state.selection.main;

        if (from === to) {
          setToolbarPos(null);
          return;
        }

        // Get coordinates of selection
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);
        if (!start || !end) {
          setToolbarPos(null);
          return;
        }

        const x = Math.min(start.left, end.left) + (Math.abs(end.left - start.left) / 2);
        const y = Math.min(start.top, end.top) - 40;

        setToolbarPos({ x: Math.max(8, x - 100), y: Math.max(4, y) });
      }),
    []
  );

  const handleToolbarAction = useCallback(
    (action: ToolbarAction) => {
      const view = cmRef.current?.view;
      if (!view) return;

      const { from, to } = view.state.selection.main;
      const selected = view.state.sliceDoc(from, to);
      const replacement = `${action.wrap[0]}${selected}${action.wrap[1]}`;

      view.dispatch({
        changes: { from, to, insert: replacement },
        selection: {
          anchor: from + action.wrap[0].length,
          head: from + action.wrap[0].length + selected.length,
        },
      });

      setToolbarPos(null);
      view.focus();
    },
    []
  );

  // Open search panel from menu event
  const openSearch = useCallback(() => {
    const view = cmRef.current?.view;
    if (view) openSearchPanel(view);
  }, []);

  // Listen for menu find events
  React.useEffect(() => {
    const cleanups = [
      window.editora.onMenuEvent("menu:find", openSearch),
      window.editora.onMenuEvent("menu:find-replace", openSearch),
    ];
    return () => cleanups.forEach((fn) => fn());
  }, [openSearch]);

  // Drag & drop media files
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (!project) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      const filePaths = files
        .map((f) => (f as File & { path: string }).path)
        .filter(Boolean);
      if (filePaths.length === 0) return;

      // Show optimization dialog
      setDropUploadPaths(filePaths);
      setShowDropUpload(true);
    },
    [project]
  );

  const handleDropUploadComplete = useCallback(
    (results: Array<{ name: string; relativePath: string }>) => {
      setShowDropUpload(false);
      const view = cmRef.current?.view;
      if (!view) return;

      const insertions = results.map((uploaded) => {
        const ext = uploaded.name.split(".").pop()?.toLowerCase() || "";
        if (IMAGE_EXTENSIONS.has(ext)) {
          return `![${uploaded.name}](${uploaded.relativePath})`;
        }
        return `[${uploaded.name}](${uploaded.relativePath})`;
      });

      if (insertions.length > 0) {
        const pos = view.state.selection.main.head;
        const text = insertions.join("\n") + "\n";
        view.dispatch({
          changes: { from: pos, insert: text },
        });
        view.focus();
      }
    },
    []
  );

  const extensions = useMemo(
    () => [
      markdown({ codeLanguages: languages, htmlTagLanguage: html() }),
      EditorView.lineWrapping,
      editorTheme,
      syntaxHighlighting(highlightStyle),
      selectionListener,
      search(),
      keymap.of(searchKeymap),
    ],
    [selectionListener]
  );

  return (
    <div
      className={`h-full relative ${isDragOver ? "ring-2 ring-inset ring-editor-accent/50" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-editor-bg/80 pointer-events-none">
          <div className="px-6 py-3 rounded-lg bg-editor-surface border text-sm text-editor-accent">
            Drop to insert media
          </div>
        </div>
      )}
      <CodeMirror
        ref={cmRef}
        value={editorContent}
        onChange={onChange}
        extensions={extensions}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          bracketMatching: true,
          closeBrackets: true,
          indentOnInput: true,
        }}
        className="h-full"
      />
      <FloatingToolbar pos={toolbarPos} onAction={handleToolbarAction} />

      {/* Table insert button (bottom-right corner) */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-30">
        <button
          onClick={() => {
            const table = detectTableAtCursor();
            openTableEditor(table || undefined);
          }}
          title={detectTableAtCursor() ? "Edit table at cursor" : "Insert table"}
          className="px-2.5 py-1.5 text-xs bg-editor-surface border rounded-lg shadow
                     text-editor-muted hover:text-editor-text hover:bg-editor-border/50
                     transition-colors"
        >
          {"\u2637"} Table
        </button>
      </div>

      <TableEditorModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        onInsert={handleTableInsert}
        initialMarkdown={tableEditMarkdown}
      />

      {project && (
        <ImageUploadDialog
          isOpen={showDropUpload}
          filePaths={dropUploadPaths}
          projectPath={project.path}
          onComplete={handleDropUploadComplete}
          onCancel={() => setShowDropUpload(false)}
        />
      )}
    </div>
  );
}
