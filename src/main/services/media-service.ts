import fs from "node:fs/promises";
import path from "node:path";
import { MediaFile } from "../../shared/types";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif", ".ico"];

export class MediaService {
  async listMedia(projectPath: string, contentDirs?: string[]): Promise<MediaFile[]> {
    const files: MediaFile[] = [];
    const scanned = new Set<string>();

    // Standard asset directories
    const dirs = [
      path.join(projectPath, "public"),
      path.join(projectPath, "src", "assets"),
    ];

    // Also scan content directories — images often live alongside markdown
    if (contentDirs) {
      for (const dir of contentDirs) {
        const abs = path.isAbsolute(dir) ? dir : path.join(projectPath, dir);
        dirs.push(abs);
      }
    } else {
      // Fallback: scan common content locations
      for (const dir of ["content", "src/content", "_posts", "posts", "blog", "docs", "source/_posts"]) {
        dirs.push(path.join(projectPath, dir));
      }
    }

    for (const dir of dirs) {
      const resolved = path.resolve(dir);
      if (scanned.has(resolved)) continue;
      scanned.add(resolved);
      try {
        await fs.access(resolved);
        await this.scanMediaDir(resolved, resolved, files);
      } catch {
        // Directory doesn't exist, skip
      }
    }

    return files.sort((a, b) => b.lastModified - a.lastModified);
  }

  async uploadFiles(
    projectPath: string,
    filePaths: string[]
  ): Promise<{ uploaded: string[] }> {
    const targetDir = path.join(projectPath, "public", "images");

    // Ensure target directory exists
    await fs.mkdir(targetDir, { recursive: true });

    const uploaded: string[] = [];
    for (const filePath of filePaths) {
      const fileName = path.basename(filePath);
      const destPath = path.join(targetDir, fileName);
      await fs.copyFile(filePath, destPath);
      uploaded.push(destPath);
    }

    return { uploaded };
  }

  private async scanMediaDir(
    baseDir: string,
    dir: string,
    files: MediaFile[]
  ): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.scanMediaDir(baseDir, fullPath, files);
      } else if (IMAGE_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
        const stat = await fs.stat(fullPath);
        files.push({
          name: entry.name,
          path: fullPath,
          relativePath: path.relative(baseDir, fullPath),
          size: stat.size,
          type: path.extname(entry.name).slice(1),
          lastModified: stat.mtimeMs,
        });
      }
    }
  }
}
