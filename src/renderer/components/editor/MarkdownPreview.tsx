import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useEditorStore } from "../../store/editor-store";

export default function MarkdownPreview() {
  const editorContent = useEditorStore((s) => s.editorContent);

  return (
    <div className="p-6 prose prose-invert prose-sm max-w-none
                    prose-headings:font-semibold
                    prose-a:text-editor-accent prose-a:no-underline hover:prose-a:underline
                    prose-code:text-pink-300 prose-code:bg-editor-surface prose-code:px-1 prose-code:rounded prose-code:text-xs
                    prose-pre:bg-editor-bg prose-pre:border
                    prose-img:rounded-lg
                    prose-strong:text-editor-text
                    prose-li:marker:text-editor-muted">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {editorContent}
      </ReactMarkdown>
    </div>
  );
}
