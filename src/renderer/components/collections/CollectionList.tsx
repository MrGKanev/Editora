import React, { useState } from "react";
import { useProjectStore } from "../../store/project-store";
import { useEditorStore } from "../../store/editor-store";
import { ContentCollection } from "../../../shared/types";

export default function CollectionList() {
  const { collections } = useProjectStore();
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
        No content collections found. Make sure your Astro project has a{" "}
        <code className="bg-editor-bg px-1 rounded">src/content/</code>{" "}
        directory.
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
          activeFilePath={currentFile?.path}
        />
      ))}
    </div>
  );
}

function CollectionItem({
  collection,
  isExpanded,
  onToggle,
  onFileSelect,
  activeFilePath,
}: {
  collection: ContentCollection;
  isExpanded: boolean;
  onToggle: () => void;
  onFileSelect: (path: string) => void;
  activeFilePath?: string;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm font-medium
                   hover:bg-editor-bg/50 transition-colors"
      >
        <span
          className={`text-xs transition-transform ${
            isExpanded ? "rotate-90" : ""
          }`}
        >
          &#9656;
        </span>
        <span>{collection.name}</span>
        <span className="ml-auto text-xs text-editor-muted">
          {collection.files.length}
        </span>
      </button>

      {isExpanded && (
        <div className="ml-4">
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
