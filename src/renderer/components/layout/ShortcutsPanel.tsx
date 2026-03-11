import React, { useEffect } from "react";

const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
const modKey = isMac ? "\u2318" : "Ctrl";

interface Shortcut {
  keys: string;
  description: string;
}

const shortcuts: Shortcut[] = [
  { keys: `${modKey}+S`, description: "Save" },
  { keys: `${modKey}+F`, description: "Find" },
  { keys: `${modKey}+Shift+F`, description: "Focus mode" },
  { keys: `${modKey}+B`, description: "Bold (when text selected)" },
  { keys: `${modKey}+I`, description: "Italic (when text selected)" },
  { keys: `${modKey}+K`, description: "Reserved for future search" },
  { keys: `${modKey}+Shift+P`, description: "Toggle preview" },
  { keys: `${modKey}+/`, description: "Show shortcuts" },
];

interface ShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutsPanel({ isOpen, onClose }: ShortcutsPanelProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-editor-surface border border-editor-border rounded-xl shadow-2xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-editor-border">
          <h2 className="text-sm font-semibold text-editor-text">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-editor-muted hover:text-editor-text transition-colors text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {/* Shortcuts grid */}
        <div className="px-5 py-3">
          <div className="grid grid-cols-[1fr_auto] gap-y-2 gap-x-6">
            {shortcuts.map((shortcut) => (
              <React.Fragment key={shortcut.keys}>
                <span className="text-xs text-editor-text">
                  {shortcut.description}
                </span>
                <kbd className="text-xs text-editor-accent bg-editor-bg px-2 py-0.5 rounded border border-editor-border font-mono text-right whitespace-nowrap">
                  {shortcut.keys}
                </kbd>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-editor-border">
          <p className="text-[10px] text-editor-muted text-center">
            Press <kbd className="px-1 py-0.5 bg-editor-bg rounded border border-editor-border text-editor-accent font-mono">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
