import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { ContentCollection, ContentFile, SchemaField } from "../../shared/types";

const CONTENT_EXTENSIONS = [".md", ".mdx"];

export class CollectionDiscovery {
  async discoverCollections(
    projectPath: string,
    ssgContentDirs?: string[]
  ): Promise<ContentCollection[]> {
    // Use SSG-specific dirs if provided, otherwise scan common locations
    const dirNames = ssgContentDirs && ssgContentDirs.length > 0
      ? ssgContentDirs
      : ["src/content", "content", "_posts", "posts", "blog", "docs", "source/_posts"];
    const contentDirs = dirNames.map((d) => path.join(projectPath, d));

    const collections: ContentCollection[] = [];

    for (const contentDir of contentDirs) {
      try {
        await fs.access(contentDir);
      } catch {
        continue;
      }

      const entries = await fs.readdir(contentDir, { withFileTypes: true });

      // Check if this directory has markdown files directly (flat collection like _posts)
      const hasDirectFiles = entries.some(
        (e) => !e.isDirectory() && CONTENT_EXTENSIONS.includes(path.extname(e.name))
      );

      if (hasDirectFiles) {
        const dirName = path.basename(contentDir).replace(/^_/, "");
        if (!collections.some((c) => c.name === dirName)) {
          const files = await this.getCollectionFiles(contentDir);
          const schema = files.length > 0 ? this.inferSchema(files) : undefined;
          collections.push({
            name: dirName,
            path: contentDir,
            files,
            schema,
          });
        }
      }

      // Check subdirectories as separate collections
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith(".")) continue;
        if (collections.some((c) => c.name === entry.name)) continue;

        const collectionPath = path.join(contentDir, entry.name);
        const files = await this.getCollectionFiles(collectionPath);
        if (files.length === 0) continue;

        const schema = this.inferSchema(files);

        collections.push({
          name: entry.name,
          path: collectionPath,
          files,
          schema,
        });
      }
    }

    return collections;
  }

  async getCollectionFiles(collectionPath: string): Promise<ContentFile[]> {
    const readFile = async (fullPath: string): Promise<ContentFile | null> => {
      try {
        const [raw, stat] = await Promise.all([
          fs.readFile(fullPath, "utf-8"),
          fs.stat(fullPath),
        ]);
        const { data, content } = matter(raw);
        return {
          name: path.basename(fullPath),
          path: fullPath,
          relativePath: path.relative(collectionPath, fullPath),
          frontmatter: data,
          body: content,
          lastModified: stat.mtimeMs,
        };
      } catch {
        // Skip unreadable files
        return null;
      }
    };

    const scanDir = async (dir: string): Promise<ContentFile[]> => {
      let entries;
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        return [];
      }

      const jobs = entries.map((entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) return scanDir(fullPath);
        if (CONTENT_EXTENSIONS.includes(path.extname(entry.name))) {
          return readFile(fullPath).then((f) => (f ? [f] : []));
        }
        return Promise.resolve([]);
      });

      return (await Promise.all(jobs)).flat();
    };

    const files = await scanDir(collectionPath);
    return files.sort((a, b) => b.lastModified - a.lastModified);
  }

  private inferSchema(files: ContentFile[]): { fields: SchemaField[] } {
    const types = new Map<string, Set<string>>();
    const occurrences = new Map<string, number>();

    // Collect field names, the value types seen, and how many files use each
    for (const file of files) {
      for (const [key, value] of Object.entries(file.frontmatter)) {
        let seenTypes = types.get(key);
        if (!seenTypes) {
          seenTypes = new Set();
          types.set(key, seenTypes);
        }
        seenTypes.add(this.detectFieldType(value));
        occurrences.set(key, (occurrences.get(key) ?? 0) + 1);
      }
    }

    const fields: SchemaField[] = [];
    for (const [name, seenTypes] of types) {
      // A field with inconsistent types across files degrades to "string"
      const type = seenTypes.size === 1 ? [...seenTypes][0] : "string";
      fields.push({
        name,
        type: type as SchemaField["type"],
        // Present in every file in the collection
        required: occurrences.get(name) === files.length,
      });
    }

    return { fields };
  }

  private detectFieldType(value: unknown): string {
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") return "number";
    if (value instanceof Date) return "date";
    if (typeof value === "string") {
      // Check if it's a date string
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return "date";
      return "string";
    }
    if (Array.isArray(value)) return "array";
    return "string";
  }
}
