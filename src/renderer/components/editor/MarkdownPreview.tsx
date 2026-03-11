import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useEditorStore } from "../../store/editor-store";

const proseClasses = `p-6 prose prose-invert prose-sm max-w-none
  prose-headings:font-semibold
  prose-a:text-editor-accent prose-a:no-underline hover:prose-a:underline
  prose-code:text-pink-300 prose-code:bg-editor-surface prose-code:px-1 prose-code:rounded prose-code:text-xs
  prose-pre:bg-editor-bg prose-pre:border
  prose-img:rounded-lg
  prose-strong:text-editor-text
  prose-li:marker:text-editor-muted`;

function isHtmlHeavy(content: string): boolean {
  const trimmed = content.trim();
  // If content starts with an HTML tag or has many HTML tags, treat as HTML
  if (/^<[a-z][\s\S]*>/i.test(trimmed)) return true;
  const tagCount = (trimmed.match(/<\/?[a-z][^>]*>/gi) || []).length;
  const lineCount = trimmed.split("\n").length;
  return tagCount > lineCount * 0.3;
}

export default function MarkdownPreview() {
  const editorContent = useEditorStore((s) => s.editorContent);

  const htmlHeavy = useMemo(() => isHtmlHeavy(editorContent), [editorContent]);

  if (htmlHeavy) {
    return (
      <div
        className={proseClasses}
        dangerouslySetInnerHTML={{ __html: editorContent }}
      />
    );
  }

  return (
    <div className={proseClasses}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {editorContent}
      </ReactMarkdown>
    </div>
  );
}
