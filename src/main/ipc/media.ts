import { ipcMain } from "electron";
import fs from "node:fs/promises";
import { IPC, MediaFile } from "../../shared/types";
import { MediaService } from "../services/media-service";
import { SSG_DEFINITIONS } from "../../shared/ssg";

const mediaService = new MediaService();

export function registerMediaHandlers() {
  ipcMain.handle(
    IPC.MEDIA_LIST,
    async (_event, projectPath: string, ssgId?: string): Promise<MediaFile[]> => {
      const ssg = ssgId ? SSG_DEFINITIONS.find((s) => s.id === ssgId) : undefined;
      return mediaService.listMedia(projectPath, ssg?.contentDirs);
    }
  );

  ipcMain.handle(
    IPC.MEDIA_UPLOAD,
    async (_event, projectPath: string, filePaths: string[]) => {
      try {
        return await mediaService.uploadFiles(projectPath, filePaths);
      } catch (err) {
        return { error: `Failed to upload: ${(err as Error).message}` };
      }
    }
  );

  ipcMain.handle(IPC.MEDIA_DELETE, async (_event, filePath: string) => {
    try {
      await fs.unlink(filePath);
      return { success: true };
    } catch (err) {
      return { error: `Failed to delete: ${(err as Error).message}` };
    }
  });

  ipcMain.handle(IPC.MEDIA_GET_PATH, async (_event, filePath: string) => {
    return `file://${filePath}`;
  });
}
