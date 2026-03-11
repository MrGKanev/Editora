import { ipcMain } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { IPC, ContentFile, ContentCollection } from "../../shared/types";
import { CollectionDiscovery } from "../services/collection-discovery";

const discovery = new CollectionDiscovery();

export function registerContentHandlers() {
  ipcMain.handle(
    IPC.COLLECTION_LIST,
    async (_event, projectPath: string): Promise<ContentCollection[]> => {
      return discovery.discoverCollections(projectPath);
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
    }
  );

  ipcMain.handle(
    IPC.CONTENT_WRITE,
    async (_event, filePath: string, content: string) => {
      await fs.writeFile(filePath, content, "utf-8");
      return { success: true };
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
      const filePath = path.join(collectionPath, fileName);
      const exists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      if (exists) {
        return { error: "File already exists" };
      }
      await fs.writeFile(filePath, content, "utf-8");
      return { success: true, path: filePath };
    }
  );

  ipcMain.handle(IPC.CONTENT_DELETE, async (_event, filePath: string) => {
    await fs.unlink(filePath);
    return { success: true };
  });
}
