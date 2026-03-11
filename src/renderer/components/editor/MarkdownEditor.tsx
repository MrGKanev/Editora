import React, { useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { EditorView } from "@codemirror/view";
import { useEditorStore } from "../../store/editor-store";

const theme = EditorView.theme({
  "&": {
    backgroundColor: "#1e1e2e",
    color: "#cdd6f4",
  },
  ".cm-content": {
    caretColor: "#89b4fa",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: "14px",
    lineHeight: "1.6",
    padding: "16px",
  },
  ".cm-cursor": {
    borderLeftColor: "#89b4fa",
  },
  ".cm-selectionBackground": {
    backgroundColor: "#313146 !important",
  },
  ".cm-activeLine": {
    backgroundColor: "#242435",
  },
  ".cm-gutters": {
    backgroundColor: "#1e1e2e",
    color: "#6c7086",
    border: "none",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#242435",
  },
});

export default function MarkdownEditor() {
  const { editorContent, setEditorContent } = useEditorStore();

  const onChange = useCallback(
    (value: string) => {
      setEditorContent(value);
    },
    [setEditorContent]
  );

  return (
    <CodeMirror
      value={editorContent}
      onChange={onChange}
      extensions={[
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        EditorView.lineWrapping,
        theme,
      ]}
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
  );
}
