import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { ContentCollection, ContentFile, SchemaField } from "../../shared/types";

const CONTENT_EXTENSIONS = [".md", ".mdx"];

export class CollectionDiscovery {
  async discoverCollections(projectPath: string): Promise<ContentCollection[]> {
    const contentDir = path.join(projectPath, "src", "content");

    try {
      await fs.access(contentDir);
    } catch {
      return [];
    }

    const entries = await fs.readdir(contentDir, { withFileTypes: true });
    const collections: ContentCollection[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      // Skip config files and hidden dirs
      if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;

      const collectionPath = path.join(contentDir, entry.name);
      const files = await this.getCollectionFiles(collectionPath);

      // Infer schema from first file's frontmatter
      const schema = files.length > 0 ? this.inferSchema(files) : undefined;

      collections.push({
        name: entry.name,
        path: collectionPath,
        files,
        schema,
      });
    }

    return collections;
  }

  async getCollectionFiles(collectionPath: string): Promise<ContentFile[]> {
    const files: ContentFile[] = [];

    const scanDir = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (CONTENT_EXTENSIONS.includes(path.extname(entry.name))) {
          try {
            const raw = await fs.readFile(fullPath, "utf-8");
            const { data, content } = matter(raw);
            const stat = await fs.stat(fullPath);

            files.push({
              name: entry.name,
              path: fullPath,
              relativePath: path.relative(collectionPath, fullPath),
              frontmatter: data,
              body: content,
              lastModified: stat.mtimeMs,
            });
          } catch {
            // Skip unreadable files
          }
        }
      }
    };

    await scanDir(collectionPath);
    return files.sort((a, b) => b.lastModified - a.lastModified);
  }

  private inferSchema(files: ContentFile[]): { fields: SchemaField[] } {
    const fieldMap = new Map<string, Set<string>>();

    // Collect all field names and value types from all files
    for (const file of files) {
      for (const [key, value] of Object.entries(file.frontmatter)) {
        if (!fieldMap.has(key)) {
          fieldMap.set(key, new Set());
        }
        fieldMap.get(key)!.add(this.detectFieldType(value));
      }
    }

    const fields: SchemaField[] = [];
    for (const [name, types] of fieldMap) {
      const typeArr = Array.from(types);
      const type = typeArr.length === 1 ? typeArr[0] : "string";
      fields.push({
        name,
        type: type as SchemaField["type"],
        required: fieldMap.get(name)!.size === files.length,
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
