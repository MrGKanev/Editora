import { ipcMain } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { IPC, ContentFile, ContentCollection } from "../../shared/types";
import { CollectionDiscovery } from "../services/collection-discovery";
import { SSG_DEFINITIONS } from "../../shared/ssg";
import { ensureWithinDir } from "../utils/safe-path";

const discovery = new CollectionDiscovery();

export function registerContentHandlers() {
  ipcMain.handle(
    IPC.COLLECTION_LIST,
    async (_event, projectPath: string, ssgId?: string): Promise<ContentCollection[]> => {
      const ssg = ssgId ? SSG_DEFINITIONS.find((s) => s.id === ssgId) : undefined;
      return discovery.discoverCollections(projectPath, ssg?.contentDirs);
    }
  );

  ipcMain.handle(
    IPC.COLLECTION_GET_FILES,
    async (_event, collectionPath: string): Promise<ContentFile[]> => {
      return discovery.getCollectionFiles(collectionPath);
    }
  );

  ipcMain.handle(
    IPC.CONTENT_READ,
    async (_event, filePath: string): Promise<ContentFile> => {
      try {
        const raw = await fs.readFile(filePath, "utf-8");
        const { data, content } = matter(raw);
        const stat = await fs.stat(filePath);
        return {
          name: path.basename(filePath),
          path: filePath,
          relativePath: filePath,
          frontmatter: data,
          body: content,
          lastModified: stat.mtimeMs,
        };
      } catch (err) {
        throw new Error(`Failed to read file: ${(err as Error).message}`);
      }
    }
  );

  ipcMain.handle(
    IPC.CONTENT_WRITE,
    async (_event, filePath: string, content: string) => {
      try {
        await fs.writeFile(filePath, content, "utf-8");
        return { success: true };
      } catch (err) {
        return { error: `Failed to write file: ${(err as Error).message}` };
      }
    }
  );

  ipcMain.handle(
    IPC.CONTENT_CREATE,
    async (
      _event,
      collectionPath: string,
      fileName: string,
      content: string
    ) => {
      try {
        const filePath = ensureWithinDir(collectionPath, fileName);
        const exists = await fs
          .access(filePath)
          .then(() => true)
          .catch(() => false);
        if (exists) {
          return { error: "File already exists" };
        }
        await fs.writeFile(filePath, content, "utf-8");
        return { success: true, path: filePath };
      } catch (err) {
        return { error: `Failed to create file: ${(err as Error).message}` };
      }
    }
  );

  ipcMain.handle(IPC.CONTENT_DELETE, async (_event, filePath: string) => {
    try {
      await fs.unlink(filePath);
      return { success: true };
    } catch (err) {
      return { error: `Failed to delete file: ${(err as Error).message}` };
    }
  });
}
