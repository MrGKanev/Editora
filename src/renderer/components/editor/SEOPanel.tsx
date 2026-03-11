import React, { useMemo } from "react";
import { useEditorStore } from "../../store/editor-store";
import { slugify } from "../../utils/markdown";

interface SEOPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LengthIndicator {
  current: number;
  min: number;
  max: number;
  label: string;
}

function LengthBar({ current, min, max, label }: LengthIndicator) {
  const absMax = max * 1.5;
  const pct = Math.min((current / absMax) * 100, 100);
  const goodZoneStart = (min / absMax) * 100;
  const goodZoneEnd = (max / absMax) * 100;

  let color = "bg-editor-danger";
  let textColor = "text-editor-danger";
  if (current >= min && current <= max) {
    color = "bg-editor-success";
    textColor = "text-editor-success";
  } else if (current > 0 && current < min) {
    color = "bg-editor-warning";
    textColor = "text-editor-warning";
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-editor-muted">{label}</span>
        <span className={textColor}>
          {current} / {min}-{max}
        </span>
      </div>
      <div className="relative h-1.5 bg-editor-bg rounded-full overflow-hidden">
        {/* Ideal zone indicator */}
        <div
          className="absolute top-0 h-full bg-editor-success/10 rounded-full"
          style={{ left: `${goodZoneStart}%`, width: `${goodZoneEnd - goodZoneStart}%` }}
        />
        {/* Current value */}
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function SEOPanel({ isOpen, onClose }: SEOPanelProps) {
  const { frontmatter, updateFrontmatterField, currentFile, editorContent } =
    useEditorStore();

  const title = String(frontmatter.title || "");
  const description = String(
    frontmatter.description || frontmatter.excerpt || frontmatter.summary || ""
  );

  // Derive slug from file name or frontmatter
  const fileSlug = currentFile
    ? currentFile.name.replace(/\.(md|mdx)$/, "")
    : "";
  const slug = String(frontmatter.slug || fileSlug);

  const keywords = useMemo(() => {
    const tags = frontmatter.tags || frontmatter.keywords || frontmatter.categories;
    if (Array.isArray(tags)) return tags.map(String);
    if (typeof tags === "string") return tags.split(",").map((s) => s.trim());
    return [];
  }, [frontmatter.tags, frontmatter.keywords, frontmatter.categories]);

  // Auto-generate description from body if empty
  const autoDescription = useMemo(() => {
    if (description) return null;
    if (!editorContent) return null;
    // Strip markdown formatting and HTML tags for a plain-text snippet
    const plain = editorContent
      .replace(/^#+\s+/gm, "")
      .replace(/[*_~`]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\n+/g, " ")
      .trim();
    return plain.slice(0, 160);
  }, [description, editorContent]);

  // Detect which frontmatter key is used for description
  const descriptionKey = frontmatter.description !== undefined
    ? "description"
    : frontmatter.excerpt !== undefined
    ? "excerpt"
    : frontmatter.summary !== undefined
    ? "summary"
    : "description";

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="absolute inset-0 bg-black/30 z-10"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`absolute top-0 right-0 h-full w-[400px] max-w-[80%] bg-editor-surface border-l
                     z-20 flex flex-col transition-transform duration-200 ease-in-out
                     ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-medium">SEO</h2>
          <button
            onClick={onClose}
            className="text-editor-muted hover:text-editor-text text-lg leading-none px-1"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-xs text-editor-muted">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => updateFrontmatterField("title", e.target.value)}
              placeholder="Page title"
              className="w-full px-2 py-1.5 text-sm bg-editor-bg border rounded
                         focus:outline-none focus:border-editor-accent"
            />
            <LengthBar
              current={title.length}
              min={30}
              max={60}
              label="Title length"
            />
          </div>

          {/* Meta description */}
          <div className="space-y-2">
            <label className="block text-xs text-editor-muted">
              Meta Description
            </label>
            <textarea
              value={description}
              onChange={(e) =>
                updateFrontmatterField(descriptionKey, e.target.value)
              }
              placeholder={autoDescription || "Add a meta description..."}
              rows={3}
              className="w-full px-2 py-1.5 text-sm bg-editor-bg border rounded resize-y
                         focus:outline-none focus:border-editor-accent"
            />
            <LengthBar
              current={description.length}
              min={120}
              max={160}
              label="Description length"
            />
            {!description && autoDescription && (
              <button
                onClick={() =>
                  updateFrontmatterField(descriptionKey, autoDescription)
                }
                className="text-xs text-editor-accent hover:underline"
              >
                Use auto-generated description
              </button>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <label className="block text-xs text-editor-muted">URL Slug</label>
            <div className="flex items-center gap-1">
              <span className="text-xs text-editor-muted">/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  updateFrontmatterField("slug", slugify(e.target.value))
                }
                placeholder={slugify(title) || "page-slug"}
                className="flex-1 px-2 py-1.5 text-sm bg-editor-bg border rounded
                           focus:outline-none focus:border-editor-accent font-mono"
              />
            </div>
            {title && slug !== slugify(title) && (
              <button
                onClick={() =>
                  updateFrontmatterField("slug", slugify(title))
                }
                className="text-xs text-editor-accent hover:underline"
              >
                Generate from title
              </button>
            )}
          </div>

          {/* Keywords / Tags */}
          <div className="space-y-2">
            <label className="block text-xs text-editor-muted">
              Keywords / Tags
            </label>
            {keywords.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-xs bg-editor-accent/15 text-editor-accent rounded"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-editor-muted/60">
                Add tags, keywords, or categories in frontmatter
              </p>
            )}
          </div>

          {/* Google Preview */}
          <div className="space-y-2">
            <label className="block text-xs text-editor-muted">
              Search Preview
            </label>
            <div className="p-3 bg-editor-bg rounded border space-y-1">
              <p
                className="text-sm truncate"
                style={{ color: "#8ab4f8" }}
              >
                {title || "Page Title"}
              </p>
              <p
                className="text-xs truncate font-mono"
                style={{ color: "#bdc1c6" }}
              >
                example.com/{slug || slugify(title) || "page-slug"}
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "#9aa0a6" }}
              >
                {description || autoDescription || "No description available."}
              </p>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <label className="block text-xs text-editor-muted">
              Checklist
            </label>
            <div className="space-y-1.5">
              <CheckItem
                ok={title.length >= 30 && title.length <= 60}
                label="Title is 30-60 characters"
              />
              <CheckItem
                ok={description.length >= 120 && description.length <= 160}
                label="Description is 120-160 characters"
              />
              <CheckItem
                ok={slug.length > 0 && slug === slugify(slug)}
                label="Slug is URL-friendly"
              />
              <CheckItem
                ok={keywords.length > 0}
                label="Has tags or keywords"
              />
              <CheckItem
                ok={
                  frontmatter.image !== undefined ||
                  frontmatter.ogImage !== undefined ||
                  frontmatter.cover !== undefined ||
                  frontmatter.thumbnail !== undefined
                }
                label="Has a social/OG image"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
          ok
            ? "bg-editor-success/20 text-editor-success"
            : "bg-editor-border/30 text-editor-muted"
        }`}
      >
        {ok ? "\u2713" : "\u2013"}
      </span>
      <span className={ok ? "text-editor-text" : "text-editor-muted"}>
        {label}
      </span>
    </div>
  );
}
