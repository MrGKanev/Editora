import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import DOMPurify from "dompurify";
import { useEditorStore } from "../../store/editor-store";

const proseClasses = `p-6 prose prose-invert prose-sm max-w-none bg-editor-bg
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

  if (href.startsWith("http://") || href.startsWith("https://")) {
    window.open(href, "_blank");
    return;
  }
}

export default function MarkdownPreview() {
  const editorContent = useEditorStore((s) => s.editorContent);

  // Sanitize content to prevent XSS, then let ReactMarkdown handle
  // both Markdown syntax and embedded HTML (via rehype-raw)
  const sanitized = DOMPurify.sanitize(editorContent, {
    // Allow all safe HTML tags that might appear in content
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["target", "rel"],
  });

  return (
    <div className={proseClasses} onClick={handleLinkClick}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {sanitized}
      </ReactMarkdown>
    </div>
  );
}
