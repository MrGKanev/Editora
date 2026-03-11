import React from "react";
import { useProjectStore } from "./store/project-store";
import ProjectSelector from "./components/project/ProjectSelector";
import Sidebar from "./components/layout/Sidebar";
import StatusBar from "./components/layout/StatusBar";
import EditorArea from "./components/editor/EditorArea";

function TitleBar() {
  return (
    <div
      className="h-9 flex-shrink-0 flex items-center bg-editor-surface border-b select-none"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {/* Spacer for macOS traffic lights */}
      <div className="w-[78px] flex-shrink-0" />
      <span className="text-xs text-editor-muted font-medium">Editora</span>
    </div>
  );
}

export default function App() {
  const project = useProjectStore((s) => s.currentProject);

  if (!project) {
    return (
      <div className="flex flex-col h-screen">
        <TitleBar />
        <div className="flex-1 overflow-hidden">
          <ProjectSelector />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <EditorArea />
      </div>
      <StatusBar />
    </div>
  );
}
