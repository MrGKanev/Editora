import React, { useState } from "react";
import { useProjectStore } from "../../store/project-store";
import { useEditorStore } from "../../store/editor-store";
import { ContentCollection } from "../../../shared/types";

export default function CollectionList() {
  const { collections, loadCollections } = useProjectStore();
  const { openFile, currentFile } = useEditorStore();
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
    new Set()
  );

  const toggleCollection = (name: string) => {
    setExpandedCollections((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  if (collections.length === 0) {
    return (
      <div className="p-4 text-sm text-editor-muted">
        No content collections found. Make sure your project has a content
        directory with markdown files (e.g.{" "}
        <code className="bg-editor-bg px-1 rounded">content/</code>,{" "}
        <code className="bg-editor-bg px-1 rounded">src/content/</code>,{" "}
        <code className="bg-editor-bg px-1 rounded">_posts/</code>).
      </div>
    );
  }

  return (
    <div className="py-2">
      {collections.map((collection) => (
        <CollectionItem
          key={collection.name}
          collection={collection}
          isExpanded={expandedCollections.has(collection.name)}
          onToggle={() => toggleCollection(collection.name)}
          onFileSelect={openFile}
          onFileCreated={() => loadCollections()}
          activeFilePath={currentFile?.path}
        />
      ))}
    </div>
  );
}

function NewFileForm({
  collectionPath,
  onCreated,
  onCancel,
}: {
  collectionPath: string;
  onCreated: (filePath: string) => void;
  onCancel: () => void;
}) {
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async () => {
    let name = fileName.trim();
    if (!name) return;

    // Add .md extension if missing
    if (!name.endsWith(".md") && !name.endsWith(".mdx")) {
      name += ".md";
    }

    // Slugify: lowercase, replace spaces with hyphens
    name = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-_.]/g, "");

    const today = new Date().toISOString().split("T")[0];
    const defaultContent = `---\ntitle: "${fileName.replace(/\.(md|mdx)$/, "").trim()}"\ndate: ${today}\ndraft: true\n---\n\n`;

    try {
      const result = await window.editora.createContent(
        collectionPath,
        name,
        defaultContent
      );
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      onCreated(result.path);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="px-3 py-2 ml-4">
      <div className="flex gap-1">
        <input
          type="text"
          value={fileName}
          onChange={(e) => {
            setFileName(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
            if (e.key === "Escape") onCancel();
          }}
          placeholder="new-post-title"
          autoFocus
          className="flex-1 min-w-0 px-2 py-1 text-xs bg-editor-bg border rounded
                     focus:outline-none focus:border-editor-accent"
        />
        <button
          onClick={handleCreate}
          className="px-2 py-1 text-xs bg-editor-accent text-editor-bg rounded
                     hover:bg-editor-accent/90"
        >
          Add
        </button>
        <button
          onClick={onCancel}
          className="px-2 py-1 text-xs text-editor-muted hover:text-editor-text"
        >
          &times;
        </button>
      </div>
      {error && (
        <p className="text-xs text-editor-danger mt-1">{error}</p>
      )}
    </div>
  );
}

function CollectionItem({
  collection,
  isExpanded,
  onToggle,
  onFileSelect,
  onFileCreated,
  activeFilePath,
}: {
  collection: ContentCollection;
  isExpanded: boolean;
  onToggle: () => void;
  onFileSelect: (path: string) => void;
  onFileCreated: () => void;
  activeFilePath?: string;
}) {
  const [showNewFile, setShowNewFile] = useState(false);

  const handleCreated = (filePath: string) => {
    setShowNewFile(false);
    onFileCreated();
    onFileSelect(filePath);
  };

  return (
    <div>
      <div className="flex items-center group">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-2 px-3 py-1.5 text-sm font-medium
                     hover:bg-editor-bg/50 transition-colors min-w-0"
        >
          <span
            className={`text-xs transition-transform flex-shrink-0 ${
              isExpanded ? "rotate-90" : ""
            }`}
          >
            &#9656;
          </span>
          <span className="truncate">{collection.name}</span>
          <span className="ml-auto text-xs text-editor-muted flex-shrink-0">
            {collection.files.length}
          </span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isExpanded) onToggle();
            setShowNewFile(true);
          }}
          title={`New file in ${collection.name}`}
          className="px-2 py-1 text-editor-muted hover:text-editor-accent
                     opacity-0 group-hover:opacity-100 transition-all text-sm flex-shrink-0"
        >
          +
        </button>
      </div>

      {isExpanded && (
        <div className="ml-4">
          {showNewFile && (
            <NewFileForm
              collectionPath={collection.path}
              onCreated={handleCreated}
              onCancel={() => setShowNewFile(false)}
            />
          )}
          {collection.files.map((file) => (
            <button
              key={file.path}
              onClick={() => onFileSelect(file.path)}
              className={`w-full text-left px-3 py-1 text-sm truncate transition-colors
                ${
                  activeFilePath === file.path
                    ? "bg-editor-accent/10 text-editor-accent"
                    : "text-editor-muted hover:text-editor-text hover:bg-editor-bg/50"
                }`}
            >
              {file.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
