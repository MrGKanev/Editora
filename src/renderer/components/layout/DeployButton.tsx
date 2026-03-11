import React, { useState, useEffect, useCallback, useRef } from "react";
import { useProjectStore } from "../../store/project-store";
import { useUIStore } from "../../store/ui-store";

type Platform = "vercel" | "netlify" | "cloudflare" | "github" | "unknown";
type DeployStatus = "idle" | "deploying" | "success" | "error";

interface PlatformInfo {
  name: string;
  dashboardUrl: string | null;
}

function detectPlatform(remoteUrl: string): Platform {
  const url = remoteUrl.toLowerCase();
  // Can't detect Vercel/Netlify/CF from git remote alone,
  // but we can identify GitHub/GitLab for dashboard links
  if (url.includes("github.com")) return "github";
  return "unknown";
}

function getRepoDashboard(remoteUrl: string, platform: Platform): PlatformInfo {
  // Extract owner/repo from git remote URL
  const match = remoteUrl.match(/(?:github\.com)[/:]([^/]+)\/([^/.]+)/);
  const owner = match?.[1];
  const repo = match?.[2];

  switch (platform) {
    case "github":
      return {
        name: "GitHub",
        dashboardUrl: owner && repo ? `https://github.com/${owner}/${repo}` : null,
      };
    default:
      return { name: "Git", dashboardUrl: null };
  }
}

export default function DeployButton() {
  const project = useProjectStore((s) => s.currentProject);
  const gitStatus = useUIStore((s) => s.gitStatus);
  const setGitStatus = useUIStore((s) => s.setGitStatus);
  const [status, setStatus] = useState<DeployStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch remote URL
  useEffect(() => {
    if (!project || !gitStatus?.isRepo) {
      setRemoteUrl(null);
      return;
    }
    window.editora.gitRemoteUrl(project.path).then(setRemoteUrl);
  }, [project, gitStatus?.isRepo]);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const platform = remoteUrl ? detectPlatform(remoteUrl) : "unknown";
  const platformInfo = remoteUrl
    ? getRepoDashboard(remoteUrl, platform)
    : { name: "Git", dashboardUrl: null };

  const hasChanges =
    gitStatus &&
    (gitStatus.modified.length > 0 ||
      gitStatus.untracked.length > 0 ||
      gitStatus.staged.length > 0);

  const deploy = useCallback(async () => {
    if (!project || !gitStatus?.isRepo) return;

    setStatus("deploying");
    setError(null);
    setShowMenu(false);

    try {
      // Stage + commit if there are changes
      if (hasChanges) {
        await window.editora.gitCommit(
          project.path,
          `Content update ${new Date().toISOString().split("T")[0]}`
        );
      }

      // Push
      await window.editora.gitPush(project.path);

      // Refresh git status
      const newStatus = await window.editora.gitStatus(project.path);
      setGitStatus(newStatus);

      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    }
  }, [project, gitStatus, hasChanges, setGitStatus]);

  // Don't show if not a git repo or no remote
  if (!gitStatus?.isRepo || !remoteUrl) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={status === "deploying"}
        className={`flex items-center gap-1.5 transition-colors ${
          status === "deploying"
            ? "text-editor-warning animate-pulse"
            : status === "success"
            ? "text-editor-success"
            : status === "error"
            ? "text-editor-danger"
            : "text-editor-muted hover:text-editor-text"
        }`}
      >
        <span className="text-[10px]">
          {status === "deploying" ? "\u25F3" : status === "success" ? "\u2713" : "\u2191"}
        </span>
        {status === "deploying"
          ? "Deploying..."
          : status === "success"
          ? "Deployed"
          : status === "error"
          ? "Failed"
          : "Deploy"}
      </button>

      {showMenu && (
        <div className="absolute bottom-full right-0 mb-1 bg-editor-surface border rounded-lg shadow-xl py-1 min-w-[200px] z-50">
          {/* Deploy action */}
          <button
            onClick={deploy}
            className="w-full text-left px-3 py-1.5 text-xs text-editor-text hover:bg-editor-accent/20 transition-colors"
          >
            <span className="font-medium">
              {hasChanges ? "Commit & Push" : "Push to remote"}
            </span>
            <span className="block text-editor-muted mt-0.5">
              {hasChanges
                ? `${gitStatus.modified.length + gitStatus.untracked.length} changed files`
                : "Already committed, just push"}
            </span>
          </button>

          {/* Separator */}
          <div className="h-px bg-editor-border my-1" />

          {/* Dashboard link */}
          {platformInfo.dashboardUrl && (
            <button
              onClick={() => {
                window.open(platformInfo.dashboardUrl!, "_blank");
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-editor-text hover:bg-editor-accent/20 transition-colors"
            >
              Open {platformInfo.name} dashboard
            </button>
          )}

          {/* Info */}
          <div className="px-3 py-1.5 text-[11px] text-editor-muted">
            Branch: {gitStatus.branch}
            {gitStatus.ahead > 0 && ` (${gitStatus.ahead} ahead)`}
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-1.5 text-[11px] text-editor-danger">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
