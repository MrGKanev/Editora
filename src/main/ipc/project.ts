import { ipcMain, dialog, BrowserWindow } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { IPC, Project } from "../../shared/types";
import { ProjectManager } from "../services/project-manager";

const projectManager = new ProjectManager();

export function registerProjectHandlers() {
  ipcMain.handle(IPC.PROJECT_OPEN, async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return null;

    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
      title: "Open Astro Project",
    });

    if (result.canceled || !result.filePaths[0]) return null;

    const projectPath = result.filePaths[0];
    const isValid = await projectManager.validateAstroProject(projectPath);
    if (!isValid) {
      return { error: "Not a valid Astro project. No astro.config.* found." };
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
    return projectManager.validateAstroProject(projectPath);
  });
}
