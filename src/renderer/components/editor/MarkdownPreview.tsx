import React, { useMemo, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useEditorStore } from "../../store/editor-store";
import { isHtmlHeavy } from "../../utils/markdown";

const proseClasses = `p-6 prose prose-invert prose-sm max-w-none
  prose-headings:font-semibold
  prose-a:text-editor-accent prose-a:no-underline hover:prose-a:underline
  prose-code:text-pink-300 prose-code:bg-editor-surface prose-code:px-1 prose-code:rounded prose-code:text-xs
  prose-pre:bg-editor-bg prose-pre:border
  prose-img:rounded-lg
  prose-strong:text-editor-text
  prose-li:marker:text-editor-muted`;

function handleLinkClick(e: React.MouseEvent<HTMLElement>) {
  const target = (e.target as HTMLElement).closest("a");
  if (!target) return;

  const href = target.getAttribute("href");
  if (!href) return;

  e.preventDefault();

  // External links — open in browser (handled by main process will-navigate)
  if (href.startsWith("http://") || href.startsWith("https://")) {
    window.open(href, "_blank");
    return;
  }

  // Local relative links — could be links to other content files
  // For now just prevent navigation
}

export default function MarkdownPreview() {
  const editorContent = useEditorStore((s) => s.editorContent);

  const htmlHeavy = useMemo(() => isHtmlHeavy(editorContent), [editorContent]);

  if (htmlHeavy) {
    return (
      <div
        className={proseClasses}
        onClick={handleLinkClick}
        dangerouslySetInnerHTML={{ __html: editorContent }}
      />
    );
  }

  return (
    <div className={proseClasses} onClick={handleLinkClick}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {editorContent}
      </ReactMarkdown>
    </div>
  );
}
