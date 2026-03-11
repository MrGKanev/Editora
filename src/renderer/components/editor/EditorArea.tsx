import React, { useEffect } from "react";
import { useEditorStore } from "../../store/editor-store";
import { useUIStore } from "../../store/ui-store";
import SplitView from "./SplitView";
import FrontmatterForm from "./FrontmatterForm";

export default function EditorArea() {
  const { currentFile, save } = useEditorStore();
  const showPreview = useUIStore((s) => s.showPreview);

  // Keyboard shortcut: Ctrl/Cmd + S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save]);

  if (!currentFile) {
    return (
      <div className="flex-1 flex items-center justify-center text-editor-muted">
        <div className="text-center">
          <p className="text-lg">Select a file to edit</p>
          <p className="text-sm mt-1">
            Choose a content file from the sidebar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Frontmatter */}
      <FrontmatterForm />

      {/* Editor + Preview */}
      <SplitView showPreview={showPreview} />
    </div>
  );
}
