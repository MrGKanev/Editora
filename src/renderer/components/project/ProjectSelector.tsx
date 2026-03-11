import React, { useEffect, useState } from "react";
import { useProjectStore } from "../../store/project-store";
import { Project } from "../../../shared/types";

export default function ProjectSelector() {
  const { openProject, openProjectPath, isLoading, error } = useProjectStore();
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [cloneUrl, setCloneUrl] = useState("");
  const [showClone, setShowClone] = useState(false);

  useEffect(() => {
    window.editora.getRecentProjects().then(setRecentProjects);
  }, []);

  const handleClone = async () => {
    if (!cloneUrl.trim()) return;
    const folderName = cloneUrl.split("/").pop()?.replace(".git", "") || "project";
    const dest = `${require("os").homedir()}/Projects/${folderName}`;
    const result = await window.editora.cloneProject(cloneUrl, dest);
    if (result && !("error" in result)) {
      openProjectPath(result.path);
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-[480px] space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-editor-accent">Editora</h1>
          <p className="text-editor-muted mt-2">
            Content editor for Astro websites
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-editor-danger/10 border border-editor-danger/30 text-editor-danger rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={openProject}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-editor-accent text-editor-bg rounded-lg font-medium
                       hover:bg-editor-accent/90 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Opening..." : "Open Astro Project"}
          </button>

          <button
            onClick={() => setShowClone(!showClone)}
            className="w-full px-4 py-3 bg-editor-surface border rounded-lg font-medium
                       hover:bg-editor-border/50 transition-colors"
          >
            Clone from Git
          </button>

          {showClone && (
            <div className="flex gap-2">
              <input
                type="text"
                value={cloneUrl}
                onChange={(e) => setCloneUrl(e.target.value)}
                placeholder="https://github.com/user/repo.git"
                className="flex-1 px-3 py-2 bg-editor-bg border rounded-lg text-sm
                           focus:outline-none focus:border-editor-accent"
              />
              <button
                onClick={handleClone}
                className="px-4 py-2 bg-editor-accent text-editor-bg rounded-lg text-sm
                           hover:bg-editor-accent/90"
              >
                Clone
              </button>
            </div>
          )}
        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-editor-muted mb-3">
              Recent Projects
            </h2>
            <div className="space-y-1">
              {recentProjects.map((project) => (
                <button
                  key={project.path}
                  onClick={() => openProjectPath(project.path)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-editor-surface
                             transition-colors group"
                >
                  <div className="font-medium text-sm">{project.name}</div>
                  <div className="text-xs text-editor-muted truncate">
                    {project.path}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
