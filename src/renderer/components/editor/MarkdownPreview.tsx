import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useEditorStore } from "../../store/editor-store";

export default function MarkdownPreview() {
  const editorContent = useEditorStore((s) => s.editorContent);

  return (
    <div className="p-6 prose prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {editorContent}
      </ReactMarkdown>
    </div>
  );
}
