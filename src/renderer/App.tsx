import React from "react";
import { useProjectStore } from "./store/project-store";
import ProjectSelector from "./components/project/ProjectSelector";
import Sidebar from "./components/layout/Sidebar";
import StatusBar from "./components/layout/StatusBar";
import EditorArea from "./components/editor/EditorArea";

export default function App() {
  const project = useProjectStore((s) => s.currentProject);

  if (!project) {
    return <ProjectSelector />;
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <EditorArea />
      </div>
      <StatusBar />
    </div>
  );
}
