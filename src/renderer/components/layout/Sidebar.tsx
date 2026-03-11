import React from "react";
import { useUIStore } from "../../store/ui-store";
import CollectionList from "../collections/CollectionList";
import MediaGallery from "../media/MediaGallery";
import GitPanel from "../git/GitPanel";
import PreviewPanel from "../preview/PreviewPanel";

const tabs = [
  { id: "collections" as const, label: "Content" },
  { id: "media" as const, label: "Media" },
  { id: "git" as const, label: "Git" },
  { id: "preview" as const, label: "Preview" },
];

export default function Sidebar() {
  const { activePanel, setActivePanel, sidebarWidth } = useUIStore();

  return (
    <div
      className="flex flex-col border-r bg-editor-surface"
      style={{ width: sidebarWidth }}
    >
      {/* Panel tabs */}
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePanel(tab.id)}
            className={`flex-1 px-2 py-2 text-xs font-medium transition-colors
              ${
                activePanel === tab.id
                  ? "text-editor-accent border-b-2 border-editor-accent"
                  : "text-editor-muted hover:text-editor-text"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto">
        {activePanel === "collections" && <CollectionList />}
        {activePanel === "media" && <MediaGallery />}
        {activePanel === "git" && <GitPanel />}
        {activePanel === "preview" && <PreviewPanel />}
      </div>
    </div>
  );
}
