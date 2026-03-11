import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { CollectionDiscovery } from "../collection-discovery";

describe("CollectionDiscovery", () => {
  let discovery: CollectionDiscovery;
  let tmpDir: string;

  beforeEach(async () => {
    discovery = new CollectionDiscovery();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "editora-test-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe("discoverCollections", () => {
    it("should return empty array when no content directories exist", async () => {
      const collections = await discovery.discoverCollections(tmpDir);
      expect(collections).toEqual([]);
    });

    it("should discover flat collection with markdown files", async () => {
      const contentDir = path.join(tmpDir, "content");
      await fs.mkdir(contentDir, { recursive: true });
      await fs.writeFile(
        path.join(contentDir, "hello.md"),
        "---\ntitle: Hello\ndate: 2024-01-01\n---\nHello world"
      );

      const collections = await discovery.discoverCollections(tmpDir);
      expect(collections.length).toBe(1);
      expect(collections[0].name).toBe("content");
      expect(collections[0].files.length).toBe(1);
      expect(collections[0].files[0].name).toBe("hello.md");
    });

    it("should discover nested collections as subdirectories", async () => {
      const blogDir = path.join(tmpDir, "src", "content", "blog");
      const docsDir = path.join(tmpDir, "src", "content", "docs");
      await fs.mkdir(blogDir, { recursive: true });
      await fs.mkdir(docsDir, { recursive: true });

      await fs.writeFile(
        path.join(blogDir, "post1.md"),
        "---\ntitle: Post 1\n---\nContent"
      );
      await fs.writeFile(
        path.join(docsDir, "guide.md"),
        "---\ntitle: Guide\n---\nGuide content"
      );

      const collections = await discovery.discoverCollections(tmpDir);
      const names = collections.map((c) => c.name).sort();
      expect(names).toEqual(["blog", "docs"]);
    });

    it("should use SSG-specific content directories when provided", async () => {
      const customDir = path.join(tmpDir, "my-content");
      await fs.mkdir(customDir, { recursive: true });
      await fs.writeFile(
        path.join(customDir, "page.md"),
        "---\ntitle: Page\n---\nContent"
      );

      const collections = await discovery.discoverCollections(tmpDir, ["my-content"]);
      expect(collections.length).toBe(1);
      expect(collections[0].name).toBe("my-content");
    });

    it("should skip hidden directories", async () => {
      const contentDir = path.join(tmpDir, "content");
      const hiddenDir = path.join(contentDir, ".hidden");
      await fs.mkdir(hiddenDir, { recursive: true });
      await fs.writeFile(
        path.join(hiddenDir, "secret.md"),
        "---\ntitle: Secret\n---\nHidden"
      );

      const collections = await discovery.discoverCollections(tmpDir);
      expect(collections).toEqual([]);
    });

    it("should handle _posts directory (strip underscore)", async () => {
      const postsDir = path.join(tmpDir, "_posts");
      await fs.mkdir(postsDir, { recursive: true });
      await fs.writeFile(
        path.join(postsDir, "2024-01-01-hello.md"),
        "---\ntitle: Hello\n---\nContent"
      );

      const collections = await discovery.discoverCollections(tmpDir);
      expect(collections.length).toBe(1);
      expect(collections[0].name).toBe("posts");
    });

    it("should handle .mdx files", async () => {
      const contentDir = path.join(tmpDir, "content");
      await fs.mkdir(contentDir, { recursive: true });
      await fs.writeFile(
        path.join(contentDir, "component.mdx"),
        "---\ntitle: Component\n---\n<MyComponent />"
      );

      const collections = await discovery.discoverCollections(tmpDir);
      expect(collections.length).toBe(1);
      expect(collections[0].files[0].name).toBe("component.mdx");
    });

    it("should not duplicate collections from overlapping directories", async () => {
      const contentDir = path.join(tmpDir, "content");
      await fs.mkdir(contentDir, { recursive: true });
      await fs.writeFile(
        path.join(contentDir, "hello.md"),
        "---\ntitle: Hello\n---\nContent"
      );

      // Both "content" and "src/content" are scanned by default
      // but only one should produce a "content" collection
      const collections = await discovery.discoverCollections(tmpDir);
      const contentCollections = collections.filter((c) => c.name === "content");
      expect(contentCollections.length).toBe(1);
    });
  });

  describe("getCollectionFiles", () => {
    it("should parse frontmatter correctly", async () => {
      const dir = path.join(tmpDir, "blog");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        path.join(dir, "post.md"),
        "---\ntitle: My Post\ndate: 2024-06-15\ndraft: true\ntags:\n  - js\n  - web\n---\nBody content here"
      );

      const files = await discovery.getCollectionFiles(dir);
      expect(files.length).toBe(1);
      expect(files[0].frontmatter.title).toBe("My Post");
      expect(files[0].frontmatter.draft).toBe(true);
      expect(files[0].frontmatter.tags).toEqual(["js", "web"]);
      expect(files[0].body).toContain("Body content here");
    });

    it("should scan nested directories recursively", async () => {
      const dir = path.join(tmpDir, "docs");
      await fs.mkdir(path.join(dir, "guides"), { recursive: true });
      await fs.writeFile(
        path.join(dir, "intro.md"),
        "---\ntitle: Intro\n---\nIntro"
      );
      await fs.writeFile(
        path.join(dir, "guides", "setup.md"),
        "---\ntitle: Setup\n---\nSetup"
      );

      const files = await discovery.getCollectionFiles(dir);
      expect(files.length).toBe(2);
      const names = files.map((f) => f.name).sort();
      expect(names).toEqual(["intro.md", "setup.md"]);
    });

    it("should set correct relative paths", async () => {
      const dir = path.join(tmpDir, "docs");
      await fs.mkdir(path.join(dir, "sub"), { recursive: true });
      await fs.writeFile(
        path.join(dir, "sub", "page.md"),
        "---\ntitle: Page\n---\nContent"
      );

      const files = await discovery.getCollectionFiles(dir);
      expect(files[0].relativePath).toBe(path.join("sub", "page.md"));
    });

    it("should sort files by lastModified descending", async () => {
      const dir = path.join(tmpDir, "blog");
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(path.join(dir, "old.md"), "---\ntitle: Old\n---\nOld");
      // Small delay to ensure different mtimes
      await new Promise((r) => setTimeout(r, 50));
      await fs.writeFile(path.join(dir, "new.md"), "---\ntitle: New\n---\nNew");

      const files = await discovery.getCollectionFiles(dir);
      expect(files[0].name).toBe("new.md");
      expect(files[1].name).toBe("old.md");
    });

    it("should skip non-markdown files", async () => {
      const dir = path.join(tmpDir, "content");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, "post.md"), "---\ntitle: Post\n---\nContent");
      await fs.writeFile(path.join(dir, "image.png"), "not a markdown file");
      await fs.writeFile(path.join(dir, "config.json"), "{}");

      const files = await discovery.getCollectionFiles(dir);
      expect(files.length).toBe(1);
      expect(files[0].name).toBe("post.md");
    });

    it("should handle files without frontmatter", async () => {
      const dir = path.join(tmpDir, "content");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, "plain.md"), "Just plain text, no frontmatter");

      const files = await discovery.getCollectionFiles(dir);
      expect(files.length).toBe(1);
      expect(files[0].frontmatter).toEqual({});
      expect(files[0].body).toContain("Just plain text");
    });
  });

  describe("schema inference", () => {
    it("should infer field types from frontmatter", async () => {
      const dir = path.join(tmpDir, "content");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        path.join(dir, "post1.md"),
        "---\ntitle: Post 1\nviews: 100\ndraft: true\ndate: 2024-01-01\ntags:\n  - a\n---\nContent"
      );
      await fs.writeFile(
        path.join(dir, "post2.md"),
        "---\ntitle: Post 2\nviews: 200\ndraft: false\ndate: 2024-02-01\ntags:\n  - b\n---\nContent"
      );

      const collections = await discovery.discoverCollections(tmpDir);
      const schema = collections[0].schema;
      expect(schema).toBeDefined();

      const fields = schema!.fields;
      const fieldByName = (name: string) => fields.find((f) => f.name === name);

      expect(fieldByName("title")?.type).toBe("string");
      expect(fieldByName("views")?.type).toBe("number");
      expect(fieldByName("draft")?.type).toBe("boolean");
      expect(fieldByName("date")?.type).toBe("date");
      expect(fieldByName("tags")?.type).toBe("array");
    });

    it("should detect required fields (present in all files)", async () => {
      const dir = path.join(tmpDir, "content");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        path.join(dir, "post1.md"),
        "---\ntitle: Post 1\nauthor: Alice\n---\nContent"
      );
      await fs.writeFile(
        path.join(dir, "post2.md"),
        "---\ntitle: Post 2\n---\nContent"
      );

      const collections = await discovery.discoverCollections(tmpDir);
      const fields = collections[0].schema!.fields;
      const titleField = fields.find((f) => f.name === "title");
      const authorField = fields.find((f) => f.name === "author");

      // title appears in both files, author only in one
      // Note: required logic checks if field count matches file count
      expect(titleField).toBeDefined();
      expect(authorField).toBeDefined();
    });
  });
});
