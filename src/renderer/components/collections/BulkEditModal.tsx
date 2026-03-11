import React, { useState, useMemo } from "react";
import { ContentCollection, ContentFile } from "../../../shared/types";
import { buildFileContent } from "../../utils/yaml";

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: ContentCollection;
  onComplete: () => void;
}

type BulkOperation = "set" | "remove";

export default function BulkEditModal({
  isOpen,
  onClose,
  collection,
  onComplete,
}: BulkEditModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [fieldName, setFieldName] = useState("");
  const [fieldValue, setFieldValue] = useState("");
  const [operation, setOperation] = useState<BulkOperation>("set");
  const [isApplying, setIsApplying] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  // All unique frontmatter keys across the collection
  const allFields = useMemo(() => {
    const keys = new Set<string>();
    for (const file of collection.files) {
      for (const key of Object.keys(file.frontmatter)) {
        keys.add(key);
      }
    }
    return Array.from(keys).sort();
  }, [collection.files]);

  // Preview: what current value each selected file has for the chosen field
  const preview = useMemo(() => {
    if (!fieldName) return [];
    return collection.files
      .filter((f) => selectedFiles.has(f.path))
      .map((f) => ({
        name: f.name,
        current: f.frontmatter[fieldName],
      }));
  }, [collection.files, selectedFiles, fieldName]);

  const toggleFile = (path: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedFiles(new Set(collection.files.map((f) => f.path)));
  };

  const selectNone = () => {
    setSelectedFiles(new Set());
  };

  // Parse the value string into the appropriate type
  const parseValue = (raw: string): unknown => {
    if (raw === "true") return true;
    if (raw === "false") return false;
    if (/^\d+$/.test(raw)) return Number(raw);
    if (/^\d+\.\d+$/.test(raw)) return Number(raw);
    // Array: comma-separated if contains comma
    if (raw.includes(",")) return raw.split(",").map((s) => s.trim());
    return raw;
  };

  const handleApply = async () => {
    if (!fieldName || selectedFiles.size === 0) return;

    setIsApplying(true);
    setResult(null);
    let success = 0;
    let failed = 0;

    const filesToUpdate = collection.files.filter((f) => selectedFiles.has(f.path));

    for (const file of filesToUpdate) {
      try {
        const newFrontmatter = { ...file.frontmatter };

        if (operation === "set") {
          newFrontmatter[fieldName] = parseValue(fieldValue);
        } else {
          delete newFrontmatter[fieldName];
        }

        const content = buildFileContent(newFrontmatter, file.body);
        await window.editora.writeContent(file.path, content);
        success++;
      } catch (err) {
        console.error(`Failed to update ${file.name}:`, err);
        failed++;
      }
    }

    setResult({ success, failed });
    setIsApplying(false);

    if (failed === 0) {
      onComplete();
    }
  };

  const handleClose = () => {
    setSelectedFiles(new Set());
    setFieldName("");
    setFieldValue("");
    setOperation("set");
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-editor-surface border rounded-lg shadow-2xl w-[600px] max-w-[90vw] max-h-[80vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-sm font-medium">
              Bulk Edit &mdash; {collection.name}
            </h2>
            <button
              onClick={handleClose}
              className="text-editor-muted hover:text-editor-text text-lg leading-none px-1"
            >
              &times;
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* File selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-editor-muted">
                  Select files ({selectedFiles.size}/{collection.files.length})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAll}
                    className="text-xs text-editor-accent hover:underline"
                  >
                    All
                  </button>
                  <button
                    onClick={selectNone}
                    className="text-xs text-editor-muted hover:underline"
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="max-h-[150px] overflow-y-auto bg-editor-bg rounded border p-2 space-y-0.5">
                {collection.files.map((file) => (
                  <label
                    key={file.path}
                    className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-editor-border/30 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.path)}
                      onChange={() => toggleFile(file.path)}
                      className="rounded border-editor-border bg-editor-bg"
                    />
                    <span className="truncate text-editor-text">{file.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Operation */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-editor-muted">Operation</label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setOperation("set")}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    operation === "set"
                      ? "bg-editor-accent text-editor-bg"
                      : "text-editor-muted hover:text-editor-text bg-editor-bg border"
                  }`}
                >
                  Set value
                </button>
                <button
                  onClick={() => setOperation("remove")}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    operation === "remove"
                      ? "bg-editor-danger text-white"
                      : "text-editor-muted hover:text-editor-text bg-editor-bg border"
                  }`}
                >
                  Remove field
                </button>
              </div>
            </div>

            {/* Field name */}
            <div className="space-y-1">
              <label className="text-xs text-editor-muted">Field name</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="e.g. author, draft, category"
                  className="flex-1 px-2 py-1.5 text-sm bg-editor-bg border rounded
                             focus:outline-none focus:border-editor-accent"
                  list="field-suggestions"
                />
                <datalist id="field-suggestions">
                  {allFields.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Field value (only for "set") */}
            {operation === "set" && (
              <div className="space-y-1">
                <label className="text-xs text-editor-muted">New value</label>
                <input
                  type="text"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  placeholder="Value (true/false, number, text, or comma-separated list)"
                  className="w-full px-2 py-1.5 text-sm bg-editor-bg border rounded
                             focus:outline-none focus:border-editor-accent"
                />
                <p className="text-[11px] text-editor-muted">
                  Type detection: "true"/"false" = boolean, numbers = number, commas = array
                </p>
              </div>
            )}

            {/* Preview of changes */}
            {fieldName && preview.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs text-editor-muted">Preview</label>
                <div className="max-h-[120px] overflow-y-auto bg-editor-bg rounded border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left px-2 py-1 text-editor-muted font-normal">File</th>
                        <th className="text-left px-2 py-1 text-editor-muted font-normal">Current</th>
                        <th className="text-left px-2 py-1 text-editor-muted font-normal">
                          {operation === "set" ? "New" : "Action"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((p) => (
                        <tr key={p.name} className="border-b border-editor-border/30">
                          <td className="px-2 py-1 text-editor-text truncate max-w-[180px]">
                            {p.name}
                          </td>
                          <td className="px-2 py-1 text-editor-muted">
                            {p.current === undefined ? (
                              <span className="italic">not set</span>
                            ) : (
                              String(p.current)
                            )}
                          </td>
                          <td className="px-2 py-1">
                            {operation === "set" ? (
                              <span className="text-editor-accent">{fieldValue || '""'}</span>
                            ) : (
                              <span className="text-editor-danger">remove</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Result */}
            {result && (
              <div
                className={`p-2 rounded text-xs ${
                  result.failed > 0
                    ? "bg-editor-danger/10 text-editor-danger"
                    : "bg-editor-success/10 text-editor-success"
                }`}
              >
                Updated {result.success} file{result.success !== 1 ? "s" : ""} successfully.
                {result.failed > 0 &&
                  ` ${result.failed} file${result.failed !== 1 ? "s" : ""} failed.`}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t">
            <button
              onClick={handleClose}
              className="px-3 py-1.5 text-xs text-editor-muted hover:text-editor-text rounded transition-colors"
            >
              {result ? "Done" : "Cancel"}
            </button>
            {!result && (
              <button
                onClick={handleApply}
                disabled={isApplying || selectedFiles.size === 0 || !fieldName}
                className="px-3 py-1.5 text-xs bg-editor-accent text-editor-bg rounded
                           hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isApplying
                  ? "Applying..."
                  : operation === "set"
                  ? `Set "${fieldName}" on ${selectedFiles.size} files`
                  : `Remove "${fieldName}" from ${selectedFiles.size} files`}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
