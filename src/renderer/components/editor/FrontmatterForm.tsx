import React, { useState } from "react";
import { useEditorStore } from "../../store/editor-store";

export default function FrontmatterForm({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { frontmatter, updateFrontmatterField } = useEditorStore();

  const entries = Object.entries(frontmatter);

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
          <h2 className="text-sm font-medium">
            Frontmatter
            <span className="text-editor-muted ml-2 text-xs">
              ({entries.length} fields)
            </span>
          </h2>
          <button
            onClick={onClose}
            className="text-editor-muted hover:text-editor-text text-lg leading-none px-1"
          >
            &times;
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {entries.length === 0 ? (
            <p className="text-sm text-editor-muted">No frontmatter fields</p>
          ) : (
            entries.map(([key, value]) => (
              <FrontmatterField
                key={key}
                name={key}
                value={value}
                onChange={(v) => updateFrontmatterField(key, v)}
              />
            ))
          )}
        </div>
      </div>
    </>
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
          className="w-full px-2 py-1.5 text-sm bg-editor-bg border rounded
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
          className="w-full px-2 py-1.5 text-sm bg-editor-bg border rounded
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
          className="w-full px-2 py-1.5 text-sm bg-editor-bg border rounded
                     focus:outline-none focus:border-editor-accent"
        />
      </div>
    );
  }

  // Default: text input (use textarea for long values)
  const strValue = String(value ?? "");
  const isLong = strValue.length > 80;

  return (
    <div>
      <label className="block text-xs text-editor-muted mb-1">{name}</label>
      {isLong ? (
        <textarea
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-2 py-1.5 text-sm bg-editor-bg border rounded resize-y
                     focus:outline-none focus:border-editor-accent"
        />
      ) : (
        <input
          type="text"
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1.5 text-sm bg-editor-bg border rounded
                     focus:outline-none focus:border-editor-accent"
        />
      )}
    </div>
  );
}
