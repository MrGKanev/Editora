import React from "react";
import MarkdownEditor from "./MarkdownEditor";
import MarkdownPreview from "./MarkdownPreview";

interface SplitViewProps {
  showPreview: boolean;
}

export default function SplitView({ showPreview }: SplitViewProps) {
  return (
    <div className="flex-1 flex overflow-hidden bg-editor-bg">
      {/* Editor pane */}
      <div className={`${showPreview ? "w-1/2" : "w-full"} overflow-hidden`}>
        <MarkdownEditor />
      </div>

      {/* Preview pane */}
      {showPreview && (
        <>
          <div className="w-px bg-editor-border" />
          <div className="w-1/2 overflow-y-auto bg-editor-bg">
            <MarkdownPreview />
          </div>
        </>
      )}
    </div>
  );
}
