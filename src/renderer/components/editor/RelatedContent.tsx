import React, { useMemo } from "react";
import { useEditorStore } from "../../store/editor-store";
import { useProjectStore } from "../../store/project-store";
import { ContentFile } from "../../../shared/types";

interface RelatedFile {
  file: ContentFile;
  matchingTags: string[];
}

function getFileTags(frontmatter: Record<string, unknown>): string[] {
  const raw =
    frontmatter.tags || frontmatter.keywords || frontmatter.categories;
  if (Array.isArray(raw)) return raw.map(String).map((s) => s.toLowerCase());
  if (typeof raw === "string")
    return raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  return [];
}

interface RelatedContentProps {
  onInsertLink?: (title: string, path: string) => void;
}

export default function RelatedContent({ onInsertLink }: RelatedContentProps) {
  const { currentFile, frontmatter } = useEditorStore();
  const collections = useProjectStore((s) => s.collections);

  const currentTags = useMemo(() => getFileTags(frontmatter), [frontmatter]);

  const related = useMemo<RelatedFile[]>(() => {
    if (!currentFile || currentTags.length === 0) return [];

    const results: RelatedFile[] = [];
    for (const col of collections) {
      for (const file of col.files) {
        if (file.path === currentFile.path) continue;
        const fileTags = getFileTags(file.frontmatter);
        const matching = fileTags.filter((t) => currentTags.includes(t));
        if (matching.length > 0) {
          results.push({ file, matchingTags: matching });
        }
      }
    }

    // Sort by number of matching tags (most relevant first)
    results.sort((a, b) => b.matchingTags.length - a.matchingTags.length);
    return results.slice(0, 10);
  }, [currentFile, currentTags, collections]);

  if (currentTags.length === 0) {
    return (
      <div className="space-y-2">
        <label className="block text-xs text-editor-muted">
          Related Content
        </label>
        <p className="text-xs text-editor-muted/60">
          Add tags or keywords to frontmatter to see related content
        </p>
      </div>
    );
  }

  if (related.length === 0) {
    return (
      <div className="space-y-2">
        <label className="block text-xs text-editor-muted">
          Related Content
        </label>
        <p className="text-xs text-editor-muted/60">
          No related files found with matching tags
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs text-editor-muted">
        Related Content ({related.length})
      </label>
      <div className="space-y-1.5">
        {related.map((item) => {
          const title = String(
            item.file.frontmatter.title || item.file.name.replace(/\.(md|mdx)$/, "")
          );
          return (
            <div
              key={item.file.path}
              className="p-2 rounded border border-editor-border/30 bg-editor-bg/50 space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-editor-text truncate">
                  {title}
                </span>
                {onInsertLink && (
                  <button
                    onClick={() =>
                      onInsertLink(title, item.file.relativePath)
                    }
                    className="flex-shrink-0 text-[10px] text-editor-accent hover:underline"
                    title="Insert link at cursor"
                  >
                    Insert link
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {item.matchingTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0 text-[10px] bg-editor-accent/15 text-editor-accent rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
