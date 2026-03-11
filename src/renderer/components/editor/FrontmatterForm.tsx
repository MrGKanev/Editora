import React, { useMemo } from "react";
import { useEditorStore } from "../../store/editor-store";
import { CollectionSchema } from "../../../shared/types";
import { validateFrontmatter, ValidationError } from "../../utils/schema-validation";

export default function FrontmatterForm({
  isOpen,
  onClose,
  schema,
}: {
  isOpen: boolean;
  onClose: () => void;
  schema?: CollectionSchema;
}) {
  const { frontmatter, updateFrontmatterField } = useEditorStore();

  const entries = Object.entries(frontmatter);

  const errors = useMemo(() => {
    if (!schema) return [];
    return validateFrontmatter(frontmatter, schema.fields);
  }, [frontmatter, schema]);

  const errorMap = useMemo(() => {
    const map = new Map<string, ValidationError>();
    for (const err of errors) {
      if (!map.has(err.field)) map.set(err.field, err);
    }
    return map;
  }, [errors]);

  // Find schema fields that are missing from frontmatter (required but absent)
  const missingRequired = useMemo(() => {
    if (!schema) return [];
    return schema.fields.filter(
      (f) => f.required && frontmatter[f.name] === undefined
    );
  }, [schema, frontmatter]);

  const errorCount = errors.filter((e) => e.type === "error").length;
  const warningCount = errors.filter((e) => e.type === "warning").length;

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
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium">
              Frontmatter
              <span className="text-editor-muted ml-2 text-xs">
                ({entries.length} fields)
              </span>
            </h2>
            {errorCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-editor-danger/20 text-editor-danger rounded">
                {errorCount} {errorCount === 1 ? "error" : "errors"}
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-editor-warning/20 text-editor-warning rounded">
                {warningCount} {warningCount === 1 ? "warning" : "warnings"}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-editor-muted hover:text-editor-text text-lg leading-none px-1"
          >
            &times;
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {entries.length === 0 && missingRequired.length === 0 ? (
            <p className="text-sm text-editor-muted">No frontmatter fields</p>
          ) : (
            <>
              {entries.map(([key, value]) => {
                const error = errorMap.get(key);
                const schemaField = schema?.fields.find((f) => f.name === key);
                return (
                  <FrontmatterField
                    key={key}
                    name={key}
                    value={value}
                    onChange={(v) => updateFrontmatterField(key, v)}
                    error={error}
                    required={schemaField?.required}
                    enumOptions={schemaField?.type === "enum" ? schemaField.options : undefined}
                  />
                );
              })}

              {/* Missing required fields */}
              {missingRequired.map((field) => (
                <div key={field.name} className="space-y-1">
                  <label className="flex items-center gap-1 text-xs text-editor-muted">
                    {field.name}
                    <span className="text-editor-danger">*</span>
                  </label>
                  <button
                    onClick={() => {
                      const defaults: Record<string, unknown> = {
                        string: "",
                        number: 0,
                        boolean: false,
                        date: new Date().toISOString().split("T")[0],
                        array: [],
                        enum: field.options?.[0] || "",
                      };
                      updateFrontmatterField(field.name, defaults[field.type] ?? "");
                    }}
                    className="w-full px-2 py-1.5 text-xs text-editor-danger border border-dashed
                               border-editor-danger/40 rounded hover:bg-editor-danger/10 transition-colors"
                  >
                    + Add required field "{field.name}" ({field.type})
                  </button>
                </div>
              ))}
            </>
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
  error,
  required,
  enumOptions,
}: {
  name: string;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: ValidationError;
  required?: boolean;
  enumOptions?: string[];
}) {
  const errorBorder = error
    ? error.type === "error"
      ? "border-editor-danger"
      : "border-editor-warning"
    : "";

  // Enum fields get a select dropdown
  if (enumOptions && enumOptions.length > 0) {
    return (
      <div>
        <label className="flex items-center gap-1 text-xs text-editor-muted mb-1">
          {name}
          {required && <span className="text-editor-danger">*</span>}
        </label>
        <select
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-2 py-1.5 text-sm bg-editor-bg border rounded
                     focus:outline-none focus:border-editor-accent ${errorBorder}`}
        >
          <option value="">Select...</option>
          {enumOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {error && <FieldError error={error} />}
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            className="rounded border-editor-border bg-editor-bg"
          />
          <span className="text-editor-muted">
            {name}
            {required && <span className="text-editor-danger ml-0.5">*</span>}
          </span>
        </label>
        {error && <FieldError error={error} />}
      </div>
    );
  }

  if (value instanceof Date || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value as string))) {
    const dateStr =
      value instanceof Date
        ? value.toISOString().split("T")[0]
        : (value as string).split("T")[0];
    return (
      <div>
        <label className="flex items-center gap-1 text-xs text-editor-muted mb-1">
          {name}
          {required && <span className="text-editor-danger">*</span>}
        </label>
        <input
          type="date"
          value={dateStr}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-2 py-1.5 text-sm bg-editor-bg border rounded
                     focus:outline-none focus:border-editor-accent ${errorBorder}`}
        />
        {error && <FieldError error={error} />}
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div>
        <label className="flex items-center gap-1 text-xs text-editor-muted mb-1">
          {name}
          {required && <span className="text-editor-danger">*</span>}
        </label>
        <input
          type="text"
          value={(value as string[]).join(", ")}
          onChange={(e) =>
            onChange(e.target.value.split(",").map((s) => s.trim()))
          }
          placeholder="tag1, tag2, tag3"
          className={`w-full px-2 py-1.5 text-sm bg-editor-bg border rounded
                     focus:outline-none focus:border-editor-accent ${errorBorder}`}
        />
        {error && <FieldError error={error} />}
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div>
        <label className="flex items-center gap-1 text-xs text-editor-muted mb-1">
          {name}
          {required && <span className="text-editor-danger">*</span>}
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full px-2 py-1.5 text-sm bg-editor-bg border rounded
                     focus:outline-none focus:border-editor-accent ${errorBorder}`}
        />
        {error && <FieldError error={error} />}
      </div>
    );
  }

  // Default: text input (use textarea for long values)
  const strValue = String(value ?? "");
  const isLong = strValue.length > 80;

  return (
    <div>
      <label className="flex items-center gap-1 text-xs text-editor-muted mb-1">
        {name}
        {required && <span className="text-editor-danger">*</span>}
      </label>
      {isLong ? (
        <textarea
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={`w-full px-2 py-1.5 text-sm bg-editor-bg border rounded resize-y
                     focus:outline-none focus:border-editor-accent ${errorBorder}`}
        />
      ) : (
        <input
          type="text"
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-2 py-1.5 text-sm bg-editor-bg border rounded
                     focus:outline-none focus:border-editor-accent ${errorBorder}`}
        />
      )}
      {error && <FieldError error={error} />}
    </div>
  );
}

function FieldError({ error }: { error: ValidationError }) {
  return (
    <p
      className={`mt-1 text-[11px] ${
        error.type === "error" ? "text-editor-danger" : "text-editor-warning"
      }`}
    >
      {error.message}
    </p>
  );
}
