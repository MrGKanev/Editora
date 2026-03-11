import React, { useState, useCallback } from "react";
import { useEditorStore } from "../../store/editor-store";
import { useProjectStore } from "../../store/project-store";

interface LinkResult {
  url: string;
  type: "internal" | "external";
  status: "ok" | "broken" | "error";
  statusCode?: number;
  error?: string;
  line?: number;
}

interface LinkCheckerPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LinkCheckerPanel({ isOpen, onClose }: LinkCheckerPanelProps) {
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
      const res = await window.editora.checkLinks(
        editorContent,
        currentFile.path,
        project.path
      );
      setResults(res);
    } catch (err) {
      console.error("Link check failed:", err);
    }

    setIsChecking(false);
    setHasChecked(true);
  }, [editorContent, currentFile, project]);

  const broken = results.filter((r) => r.status === "broken" || r.status === "error");
  const ok = results.filter((r) => r.status === "ok");

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
          <h2 className="text-sm font-medium">Link Checker</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={runCheck}
              disabled={isChecking}
              className="px-2.5 py-1 text-xs bg-editor-accent text-editor-bg rounded
                         hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {isChecking ? "Checking..." : "Check Links"}
            </button>
            <button
              onClick={onClose}
              className="text-editor-muted hover:text-editor-text text-lg leading-none px-1"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isChecking && (
            <div className="flex items-center gap-2 text-sm text-editor-muted">
              <span className="animate-spin text-xs">{"\u25F3"}</span>
              Checking links...
            </div>
          )}

          {!isChecking && !hasChecked && (
            <p className="text-sm text-editor-muted">
              Click "Check Links" to validate all links in the current file.
            </p>
          )}

          {hasChecked && !isChecking && results.length === 0 && (
            <p className="text-sm text-editor-muted">No links found in this file.</p>
          )}

          {hasChecked && !isChecking && results.length > 0 && (
            <>
              {/* Summary */}
              <div className="flex items-center gap-3 text-xs">
                <span className="text-editor-text">
                  {results.length} link{results.length !== 1 ? "s" : ""}
                </span>
                {ok.length > 0 && (
                  <span className="text-editor-success">
                    {ok.length} valid
                  </span>
                )}
                {broken.length > 0 && (
                  <span className="text-editor-danger">
                    {broken.length} broken
                  </span>
                )}
              </div>

              {/* Broken links first */}
              {broken.length > 0 && (
                <div className="space-y-1">
                  <h3 className="text-xs text-editor-danger font-medium">Broken</h3>
                  {broken.map((link, i) => (
                    <LinkResultItem key={`broken-${i}`} link={link} />
                  ))}
                </div>
              )}

              {/* Valid links */}
              {ok.length > 0 && (
                <div className="space-y-1">
                  <h3 className="text-xs text-editor-success font-medium">Valid</h3>
                  {ok.map((link, i) => (
                    <LinkResultItem key={`ok-${i}`} link={link} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function LinkResultItem({ link }: { link: LinkResult }) {
  const isBroken = link.status === "broken" || link.status === "error";

  return (
    <div
      className={`p-2 rounded border text-xs ${
        isBroken
          ? "border-editor-danger/30 bg-editor-danger/5"
          : "border-editor-border/30 bg-editor-bg/50"
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-0.5 flex-shrink-0 ${isBroken ? "text-editor-danger" : "text-editor-success"}`}>
          {isBroken ? "\u2717" : "\u2713"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-editor-text break-all">{link.url}</p>
          <div className="flex items-center gap-2 mt-0.5 text-editor-muted">
            <span className="capitalize">{link.type}</span>
            {link.line && <span>Line {link.line}</span>}
            {link.statusCode && <span>HTTP {link.statusCode}</span>}
            {link.error && (
              <span className="text-editor-danger">{link.error}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
