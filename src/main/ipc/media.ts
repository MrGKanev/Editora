import { ipcMain, dialog, BrowserWindow } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { IPC, MediaFile } from "../../shared/types";
import { MediaService } from "../services/media-service";

const mediaService = new MediaService();

export function registerMediaHandlers() {
  ipcMain.handle(
    IPC.MEDIA_LIST,
    async (_event, projectPath: string): Promise<MediaFile[]> => {
      return mediaService.listMedia(projectPath);
    }
  );

  ipcMain.handle(
    IPC.MEDIA_UPLOAD,
    async (_event, projectPath: string, filePaths: string[]) => {
      return mediaService.uploadFiles(projectPath, filePaths);
    }
  );

  ipcMain.handle(IPC.MEDIA_DELETE, async (_event, filePath: string) => {
    await fs.unlink(filePath);
    return { success: true };
  });

  ipcMain.handle(IPC.MEDIA_GET_PATH, async (_event, filePath: string) => {
    return `file://${filePath}`;
  });
}
