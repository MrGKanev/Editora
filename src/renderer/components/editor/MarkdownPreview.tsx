import React, { useMemo, useRef, useEffect } from "react";
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

// HTML tags that should never be treated as markdown code blocks
// even when indented with 4+ spaces
const HTML_BLOCK_TAGS =
  /^(\s{4,})<(\/?(p|h[1-6]|div|section|article|header|footer|nav|main|aside|ul|ol|li|dl|dt|dd|table|thead|tbody|tfoot|tr|th|td|blockquote|figure|figcaption|details|summary|pre|hr|br|a|strong|em|code|span|img|mark|sup|sub|iframe|video|audio|source|picture)[\s>\/])/i;

/**
 * Pre-process content to fix HTML blocks that get misinterpreted by the
 * CommonMark parser. In CommonMark, 4+ spaces of indentation = code block.
 * GitHub's renderer is more lenient. We strip leading whitespace from lines
 * that clearly start with HTML tags so they're recognized as HTML blocks.
 */
function preprocessContent(content: string): string {
  const lines = content.split("\n");
  const result: string[] = [];
  let inCodeFence = false;

  for (const line of lines) {
    // Don't touch anything inside fenced code blocks
    if (/^```/.test(line.trim())) {
      inCodeFence = !inCodeFence;
      result.push(line);
      continue;
    }
    if (inCodeFence) {
      result.push(line);
      continue;
    }

    // Strip leading whitespace from HTML tag lines
    if (HTML_BLOCK_TAGS.test(line)) {
      result.push(line.replace(/^\s+/, ""));
    } else {
      result.push(line);
    }
  }

  return result.join("\n");
}

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
  const containerRef = useRef<HTMLDivElement>(null);

  const processedContent = useMemo(
    () => preprocessContent(editorContent),
    [editorContent]
  );

  // Sanitize the rendered DOM output, not the raw markdown source.
  useEffect(() => {
    if (!containerRef.current) return;
    const html = containerRef.current.innerHTML;
    const clean = DOMPurify.sanitize(html, {
      ADD_TAGS: ["iframe"],
      ADD_ATTR: ["target", "rel", "class", "style"],
    });
    if (clean !== html) {
      containerRef.current.innerHTML = clean;
    }
  });

  return (
    <div
      ref={containerRef}
      className={proseClasses}
      onClick={handleLinkClick}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
