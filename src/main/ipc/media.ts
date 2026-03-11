import { ipcMain } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { IPC, MediaFile } from "../../shared/types";
import { MediaService } from "../services/media-service";
import { ImageOptimizer, OptimizeOptions } from "../services/image-optimizer";
import { SSG_DEFINITIONS } from "../../shared/ssg";

const mediaService = new MediaService();
const imageOptimizer = new ImageOptimizer();

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

  ipcMain.handle(
    IPC.MEDIA_IMAGE_INFO,
    async (_event, filePaths: string[]) => {
      try {
        const results = await Promise.all(
          filePaths.map(async (fp) => {
            const canOptimize = imageOptimizer.canOptimize(fp);
            if (!canOptimize) {
              const stat = await fs.stat(fp);
              return {
                path: fp,
                name: path.basename(fp),
                size: stat.size,
                canOptimize: false,
                width: 0,
                height: 0,
                format: path.extname(fp).slice(1),
              };
            }
            const info = await imageOptimizer.getImageInfo(fp);
            return {
              path: fp,
              name: path.basename(fp),
              canOptimize: true,
              ...info,
            };
          })
        );
        return results;
      } catch (err) {
        return { error: (err as Error).message };
      }
    }
  );

  ipcMain.handle(
    IPC.MEDIA_OPTIMIZE_UPLOAD,
    async (
      _event,
      projectPath: string,
      filePaths: string[],
      options: OptimizeOptions | null
    ) => {
      try {
        const targetDir = path.join(projectPath, "public", "images");
        await fs.mkdir(targetDir, { recursive: true });

        const uploaded: Array<{
          name: string;
          relativePath: string;
          originalSize: number;
          outputSize: number;
        }> = [];

        for (const filePath of filePaths) {
          if (options && imageOptimizer.canOptimize(filePath)) {
            const result = await imageOptimizer.optimize(filePath, targetDir, options);
            const name = path.basename(result.outputPath);
            uploaded.push({
              name,
              relativePath: `/images/${name}`,
              originalSize: result.originalSize,
              outputSize: result.outputSize,
            });
          } else {
            // Copy without optimization (SVG, GIF, ICO, or user skipped)
            const fileName = path.basename(filePath);
            const destPath = path.join(targetDir, fileName);
            await fs.copyFile(filePath, destPath);
            const stat = await fs.stat(destPath);
            uploaded.push({
              name: fileName,
              relativePath: `/images/${fileName}`,
              originalSize: stat.size,
              outputSize: stat.size,
            });
          }
        }

        return { uploaded };
      } catch (err) {
        return { error: `Failed to upload: ${(err as Error).message}` };
      }
    }
  );
}
