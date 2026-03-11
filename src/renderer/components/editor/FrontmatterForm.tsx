import React, { useState } from "react";
import { useEditorStore } from "../../store/editor-store";

export default function FrontmatterForm() {
  const { frontmatter, updateFrontmatterField } = useEditorStore();
  const [isExpanded, setIsExpanded] = useState(true);

  const entries = Object.entries(frontmatter);
  if (entries.length === 0) return null;

  return (
    <div className="border-b bg-editor-surface">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium
                   text-editor-muted hover:text-editor-text transition-colors"
      >
        <span
          className={`text-xs transition-transform ${
            isExpanded ? "rotate-90" : ""
          }`}
        >
          &#9656;
        </span>
        Frontmatter
        <span className="text-xs">({entries.length} fields)</span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 grid grid-cols-2 gap-x-4 gap-y-2">
          {entries.map(([key, value]) => (
            <FrontmatterField
              key={key}
              name={key}
              value={value}
              onChange={(v) => updateFrontmatterField(key, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FrontmatterField({
  name,
  value,
  onChange,
}: {
  name: string;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (typeof value === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded border-editor-border bg-editor-bg"
        />
        <span className="text-editor-muted">{name}</span>
      </label>
    );
  }

  if (value instanceof Date || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value as string))) {
    const dateStr =
      value instanceof Date
        ? value.toISOString().split("T")[0]
        : (value as string).split("T")[0];
    return (
      <div>
        <label className="block text-xs text-editor-muted mb-1">{name}</label>
        <input
          type="date"
          value={dateStr}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 text-sm bg-editor-bg border rounded
                     focus:outline-none focus:border-editor-accent"
        />
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div>
        <label className="block text-xs text-editor-muted mb-1">{name}</label>
        <input
          type="text"
          value={(value as string[]).join(", ")}
          onChange={(e) =>
            onChange(e.target.value.split(",").map((s) => s.trim()))
          }
          placeholder="tag1, tag2, tag3"
          className="w-full px-2 py-1 text-sm bg-editor-bg border rounded
                     focus:outline-none focus:border-editor-accent"
        />
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div>
        <label className="block text-xs text-editor-muted mb-1">{name}</label>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full px-2 py-1 text-sm bg-editor-bg border rounded
                     focus:outline-none focus:border-editor-accent"
        />
      </div>
    );
  }

  // Default: text input (use textarea for long values)
  const strValue = String(value ?? "");
  const isLong = strValue.length > 100;

  return (
    <div className={isLong ? "col-span-2" : ""}>
      <label className="block text-xs text-editor-muted mb-1">{name}</label>
      {isLong ? (
        <textarea
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-2 py-1 text-sm bg-editor-bg border rounded resize-y
                     focus:outline-none focus:border-editor-accent"
        />
      ) : (
        <input
          type="text"
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 text-sm bg-editor-bg border rounded
                     focus:outline-none focus:border-editor-accent"
        />
      )}
    </div>
  );
}
