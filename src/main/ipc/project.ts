import { ipcMain, dialog, BrowserWindow } from "electron";
import { IPC } from "../../shared/types";
import { ProjectManager } from "../services/project-manager";

const projectManager = new ProjectManager();

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
