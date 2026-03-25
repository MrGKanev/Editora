import React, { useState, useCallback, useMemo } from "react";
import { useEditorStore } from "../../store/editor-store";
import { useProjectStore } from "../../store/project-store";
import { slugify } from "../../utils/markdown";
import RelatedContent from "./RelatedContent";

type Tab = "seo" | "links";

interface ContentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: Tab;
}

// ─── SEO helpers ────────────────────────────────────────────────────────────

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
        <div
          className="absolute top-0 h-full bg-editor-success/10 rounded-full"
          style={{ left: `${goodZoneStart}%`, width: `${goodZoneEnd - goodZoneStart}%` }}
        />
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
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
        {ok ? "✓" : "–"}
      </span>
      <span className={ok ? "text-editor-text" : "text-editor-muted"}>{label}</span>
    </div>
  );
}

function SEOTab() {
  const { frontmatter, updateFrontmatterField, currentFile, editorContent } = useEditorStore();

  const title = String(frontmatter.title || "");
  const description = String(
    frontmatter.description || frontmatter.excerpt || frontmatter.summary || ""
  );
  const fileSlug = currentFile ? currentFile.name.replace(/\.(md|mdx)$/, "") : "";
  const slug = String(frontmatter.slug || fileSlug);

  const keywords = useMemo(() => {
    const tags = frontmatter.tags || frontmatter.keywords || frontmatter.categories;
    if (Array.isArray(tags)) return tags.map(String);
    if (typeof tags === "string") return tags.split(",").map((s) => s.trim());
    return [];
  }, [frontmatter.tags, frontmatter.keywords, frontmatter.categories]);

  const autoDescription = useMemo(() => {
    if (description) return null;
    if (!editorContent) return null;
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

  const descriptionKey =
    frontmatter.description !== undefined
      ? "description"
      : frontmatter.excerpt !== undefined
      ? "excerpt"
      : frontmatter.summary !== undefined
      ? "summary"
      : "description";

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="space-y-2">
        <label className="block text-xs text-editor-muted">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => updateFrontmatterField("title", e.target.value)}
          placeholder="Page title"
          className="w-full px-2 py-1.5 text-sm bg-editor-bg border rounded focus:outline-none focus:border-editor-accent"
        />
        <LengthBar current={title.length} min={30} max={60} label="Title length" />
      </div>

      {/* Meta description */}
      <div className="space-y-2">
        <label className="block text-xs text-editor-muted">Meta Description</label>
        <textarea
          value={description}
          onChange={(e) => updateFrontmatterField(descriptionKey, e.target.value)}
          placeholder={autoDescription || "Add a meta description..."}
          rows={3}
          className="w-full px-2 py-1.5 text-sm bg-editor-bg border rounded resize-y focus:outline-none focus:border-editor-accent"
        />
        <LengthBar current={description.length} min={120} max={160} label="Description length" />
        {!description && autoDescription && (
          <button
            onClick={() => updateFrontmatterField(descriptionKey, autoDescription)}
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
            onChange={(e) => updateFrontmatterField("slug", slugify(e.target.value))}
            placeholder={slugify(title) || "page-slug"}
            className="flex-1 px-2 py-1.5 text-sm bg-editor-bg border rounded focus:outline-none focus:border-editor-accent font-mono"
          />
        </div>
        {title && slug !== slugify(title) && (
          <button
            onClick={() => updateFrontmatterField("slug", slugify(title))}
            className="text-xs text-editor-accent hover:underline"
          >
            Generate from title
          </button>
        )}
      </div>

      {/* Keywords */}
      <div className="space-y-2">
        <label className="block text-xs text-editor-muted">Keywords / Tags</label>
        {keywords.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((kw, i) => (
              <span key={i} className="px-2 py-0.5 text-xs bg-editor-accent/15 text-editor-accent rounded">
                {kw}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-editor-muted/60">Add tags, keywords, or categories in frontmatter</p>
        )}
      </div>

      {/* Search preview */}
      <div className="space-y-2">
        <label className="block text-xs text-editor-muted">Search Preview</label>
        <div className="p-3 bg-editor-bg rounded border space-y-1">
          <p className="text-sm truncate" style={{ color: "#8ab4f8" }}>
            {title || "Page Title"}
          </p>
          <p className="text-xs truncate font-mono" style={{ color: "#bdc1c6" }}>
            example.com/{slug || slugify(title) || "page-slug"}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "#9aa0a6" }}>
            {description || autoDescription || "No description available."}
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        <label className="block text-xs text-editor-muted">Checklist</label>
        <div className="space-y-1.5">
          <CheckItem ok={title.length >= 30 && title.length <= 60} label="Title is 30-60 characters" />
          <CheckItem ok={description.length >= 120 && description.length <= 160} label="Description is 120-160 characters" />
          <CheckItem ok={slug.length > 0 && slug === slugify(slug)} label="Slug is URL-friendly" />
          <CheckItem ok={keywords.length > 0} label="Has tags or keywords" />
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

      {/* Related content */}
      <div className="border-t pt-5">
        <RelatedContent />
      </div>
    </div>
  );
}

// ─── Links tab ───────────────────────────────────────────────────────────────

interface LinkResult {
  url: string;
  type: "internal" | "external";
  kind: "link" | "image";
  status: "ok" | "broken" | "error";
  statusCode?: number;
  error?: string;
  line?: number;
}

function CollapsibleSection({
  title,
  count,
  brokenCount,
  defaultOpen,
  children,
}: {
  title: string;
  count: number;
  brokenCount: number;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="space-y-1.5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left text-xs font-medium text-editor-text hover:text-editor-accent transition-colors"
      >
        <span className="text-[10px]">{open ? "▼" : "▶"}</span>
        <span>{title}</span>
        <span className="text-editor-muted">({count})</span>
        {brokenCount > 0 && <span className="text-editor-danger">{brokenCount} broken</span>}
      </button>
      {open && <div className="space-y-1 pl-3">{children}</div>}
    </div>
  );
}

function LinkResultItem({ link }: { link: LinkResult }) {
  const isBroken = link.status === "broken" || link.status === "error";
  return (
    <div
      className={`p-2 rounded border text-xs ${
        isBroken ? "border-editor-danger/30 bg-editor-danger/5" : "border-editor-border/30 bg-editor-bg/50"
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-0.5 flex-shrink-0 ${isBroken ? "text-editor-danger" : "text-editor-success"}`}>
          {isBroken ? "✗" : "✓"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-editor-text break-all">{link.url}</p>
          <div className="flex items-center gap-2 mt-0.5 text-editor-muted">
            <span className="capitalize">{link.type}</span>
            {link.line && <span>Line {link.line}</span>}
            {link.statusCode && <span>HTTP {link.statusCode}</span>}
            {link.error && <span className="text-editor-danger">{link.error}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function LinksTab() {
  const { editorContent, currentFile } = useEditorStore();
  const project = useProjectStore((s) => s.currentProject);
  const [results, setResults] = useState<LinkResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const runCheck = useCallback(async () => {
    if (!currentFile || !project) return;
    setIsChecking(true);
    setResults([]);
    setHasChecked(false);
    try {
      const res = await window.editora.checkLinks(editorContent, currentFile.path, project.path);
      if (Array.isArray(res)) {
        setResults(res.map((r: LinkResult) => ({ ...r, kind: r.kind || "link" })));
      }
    } catch (err) {
      console.error("Link check failed:", err);
    }
    setIsChecking(false);
    setHasChecked(true);
  }, [editorContent, currentFile, project]);

  const linkResults = results.filter((r) => r.kind === "link");
  const imageResults = results.filter((r) => r.kind === "image");
  const brokenLinks = linkResults.filter((r) => r.status !== "ok");
  const brokenImages = imageResults.filter((r) => r.status !== "ok");
  const totalBroken = brokenLinks.length + brokenImages.length;

  return (
    <div className="space-y-4">
      <button
        onClick={runCheck}
        disabled={isChecking}
        className="w-full px-3 py-2 text-xs bg-editor-accent text-editor-bg rounded hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        {isChecking ? "Checking..." : "Check All Links & Images"}
      </button>

      {isChecking && (
        <div className="flex items-center gap-2 text-sm text-editor-muted">
          <span className="animate-spin text-xs">⏳</span>
          Checking links and images...
        </div>
      )}

      {!isChecking && !hasChecked && (
        <p className="text-sm text-editor-muted">
          Click "Check All" to validate all links and images in the current file.
        </p>
      )}

      {hasChecked && !isChecking && results.length === 0 && (
        <p className="text-sm text-editor-muted">No links or images found.</p>
      )}

      {hasChecked && !isChecking && results.length > 0 && (
        <>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-editor-text">{results.length} total</span>
            <span className="text-editor-muted">{linkResults.length} link{linkResults.length !== 1 ? "s" : ""}</span>
            <span className="text-editor-muted">{imageResults.length} image{imageResults.length !== 1 ? "s" : ""}</span>
            {totalBroken > 0 ? (
              <span className="text-editor-danger">{totalBroken} broken</span>
            ) : (
              <span className="text-editor-success">All valid</span>
            )}
          </div>

          {linkResults.length > 0 && (
            <CollapsibleSection title="Links" count={linkResults.length} brokenCount={brokenLinks.length} defaultOpen={true}>
              {brokenLinks.map((l, i) => <LinkResultItem key={`bl-${i}`} link={l} />)}
              {linkResults.filter((r) => r.status === "ok").map((l, i) => <LinkResultItem key={`ol-${i}`} link={l} />)}
            </CollapsibleSection>
          )}

          {imageResults.length > 0 && (
            <CollapsibleSection title="Images" count={imageResults.length} brokenCount={brokenImages.length} defaultOpen={true}>
              {brokenImages.map((l, i) => <LinkResultItem key={`bi-${i}`} link={l} />)}
              {imageResults.filter((r) => r.status === "ok").map((l, i) => <LinkResultItem key={`oi-${i}`} link={l} />)}
            </CollapsibleSection>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export default function ContentPanel({ isOpen, onClose, initialTab = "seo" }: ContentPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Sync tab when panel is opened with a specific tab
  React.useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  return (
    <>
      {isOpen && <div className="absolute inset-0 bg-black/30 z-10" onClick={onClose} />}

      <div
        className={`absolute top-0 right-0 h-full w-[400px] max-w-[80%] bg-editor-surface border-l
                     z-20 flex flex-col transition-transform duration-200 ease-in-out
                     ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex gap-1">
            {(["seo", "links"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-xs rounded transition-colors capitalize ${
                  activeTab === tab
                    ? "bg-editor-accent text-editor-bg"
                    : "text-editor-muted hover:text-editor-text"
                }`}
              >
                {tab === "seo" ? "SEO" : "Links"}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="text-editor-muted hover:text-editor-text text-lg leading-none px-1"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "seo" ? <SEOTab /> : <LinksTab />}
        </div>
      </div>
    </>
  );
}
