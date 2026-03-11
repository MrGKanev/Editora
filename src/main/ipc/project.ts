import { ipcMain, dialog, BrowserWindow } from "electron";
import { IPC } from "../../shared/types";
import { ProjectManager } from "../services/project-manager";

const projectManager = new ProjectManager();

const GIT_URL_PATTERN = /^(https?:\/\/[^\s]+\.git|https?:\/\/(github|gitlab|bitbucket)\.[^\s]+|git@[^\s]+:[^\s]+\.git)$/i;

function isValidGitUrl(url: string): boolean {
  // Allow common git URL formats
  if (GIT_URL_PATTERN.test(url)) return true;
  // Also allow simple https URLs to known hosts without .git suffix
  if (/^https?:\/\/(github\.com|gitlab\.com|bitbucket\.org)\/[\w\-./]+$/i.test(url)) return true;
  return false;
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

    const projectPath = result.filePaths[0];
    const isValid = await projectManager.validateProject(projectPath);
    if (!isValid) {
      return { error: "No supported static site project detected. Editora supports Astro, Hugo, Jekyll, Eleventy, Next.js, Nuxt, Gatsby, VitePress, and other markdown-based projects." };
    }

    const project = await projectManager.openProject(projectPath);
    return project;
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
