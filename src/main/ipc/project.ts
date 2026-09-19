import { ipcMain, dialog, BrowserWindow } from "electron";
import { IPC } from "../../shared/types";
import { ProjectManager } from "../services/project-manager";

const projectManager = new ProjectManager();

const GIT_URL_PATTERN = /^(https?:\/\/[^\s]+\.git|https?:\/\/(github|gitlab|bitbucket)\.[^\s]+|git@[^\s]+:[^\s]+\.git)$/i;

function isValidGitUrl(url: string): boolean {
  if (url.startsWith("javascript:") || url.startsWith("file://")) return false;
  if (GIT_URL_PATTERN.test(url)) return true;
  if (/^https?:\/\/(github\.com|gitlab\.com|bitbucket\.org)\/[\w\-./]+$/i.test(url)) return true;
  return false;
}

const UNSUPPORTED_MESSAGE =
  "No supported static site project detected. Editora supports Astro, Hugo, Jekyll, Eleventy, Next.js, Nuxt, Gatsby, VitePress, and other markdown-based projects.";

async function openDetectedProject(projectPath: string) {
  const isValid = await projectManager.validateProject(projectPath);
  if (!isValid) return { error: UNSUPPORTED_MESSAGE };
  return projectManager.openProject(projectPath);
}

export function registerProjectHandlers() {
  ipcMain.handle(IPC.PROJECT_OPEN, async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return null;

    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
      title: "Open Project",
    });

    if (result.canceled || !result.filePaths[0]) return null;

    return openDetectedProject(result.filePaths[0]);
  });

  ipcMain.handle(IPC.PROJECT_OPEN_PATH, async (_event, projectPath: string) => {
    if (!projectPath) return null;
    try {
      return await openDetectedProject(projectPath);
    } catch (err) {
      return { error: (err as Error).message };
    }
  });

  ipcMain.handle(
    IPC.PROJECT_CLONE,
    async (_event, url: string, dest: string) => {
      if (!isValidGitUrl(url)) {
        return { error: "Invalid Git URL. Please provide a valid HTTPS or SSH repository URL." };
      }
      try {
        const project = await projectManager.cloneProject(url, dest);
        return project;
      } catch (err) {
        return { error: (err as Error).message };
      }
    }
  );

  ipcMain.handle(IPC.PROJECT_GET_RECENT, async () => {
    return projectManager.getRecentProjects();
  });

  ipcMain.handle(IPC.PROJECT_VALIDATE, async (_event, projectPath: string) => {
    return projectManager.validateProject(projectPath);
  });
}
