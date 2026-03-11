import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CollectionDiscovery } from "../collection-discovery";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

describe("CollectionDiscovery", () => {
  let discovery: CollectionDiscovery;
  let tmpDir: string;

  beforeEach(async () => {
    discovery = new CollectionDiscovery();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "editora-discovery-test-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  async function writeMarkdown(relativePath: string, frontmatter: Record<string, unknown>, body = "") {
    const filePath = path.join(tmpDir, relativePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const yamlLines = Object.entries(frontmatter)
      .map(([k, v]) => {
        if (typeof v === "boolean") return `${k}: ${v}`;
        if (typeof v === "number") return `${k}: ${v}`;
        if (Array.isArray(v)) return `${k}:\n${v.map((i) => `  - ${i}`).join("\n")}`;
        return `${k}: "${v}"`;
      })
      .join("\n");
    const content = `---\n${yamlLines}\n---\n${body}`;
    await fs.writeFile(filePath, content, "utf-8");
  }

  describe("inferSchema via discoverCollections", () => {
    it("detects string fields", async () => {
      await writeMarkdown("content/blog/post1.md", { title: "Hello" });
      const collections = await discovery.discoverCollections(tmpDir);
      const blog = collections.find((c) => c.name === "blog");
      expect(blog).toBeDefined();
      const titleField = blog!.schema!.fields.find((f) => f.name === "title");
      expect(titleField).toBeDefined();
      expect(titleField!.type).toBe("string");
    });

    it("detects number fields", async () => {
      await writeMarkdown("content/blog/post1.md", { order: 5 });
      const collections = await discovery.discoverCollections(tmpDir);
      const blog = collections.find((c) => c.name === "blog");
      const orderField = blog!.schema!.fields.find((f) => f.name === "order");
      expect(orderField).toBeDefined();
      expect(orderField!.type).toBe("number");
    });

    it("detects boolean fields", async () => {
      await writeMarkdown("content/blog/post1.md", { draft: true });
      const collections = await discovery.discoverCollections(tmpDir);
      const blog = collections.find((c) => c.name === "blog");
      const draftField = blog!.schema!.fields.find((f) => f.name === "draft");
      expect(draftField).toBeDefined();
      expect(draftField!.type).toBe("boolean");
    });

    it("detects date fields from date strings", async () => {
      await writeMarkdown("content/blog/post1.md", { published: "2024-01-15" });
      const collections = await discovery.discoverCollections(tmpDir);
      const blog = collections.find((c) => c.name === "blog");
      const pubField = blog!.schema!.fields.find((f) => f.name === "published");
      expect(pubField).toBeDefined();
      expect(pubField!.type).toBe("date");
    });

    it("detects array fields", async () => {
      await writeMarkdown("content/blog/post1.md", { tags: ["a", "b"] });
      const collections = await discovery.discoverCollections(tmpDir);
      const blog = collections.find((c) => c.name === "blog");
      const tagsField = blog!.schema!.fields.find((f) => f.name === "tags");
      expect(tagsField).toBeDefined();
      expect(tagsField!.type).toBe("array");
    });

    it("falls back to string when field has mixed types across files", async () => {
      await writeMarkdown("content/blog/post1.md", { value: 42 });
      await writeMarkdown("content/blog/post2.md", { value: true });
      const collections = await discovery.discoverCollections(tmpDir);
      const blog = collections.find((c) => c.name === "blog");
      const valueField = blog!.schema!.fields.find((f) => f.name === "value");
      expect(valueField).toBeDefined();
      // Multiple types -> falls back to "string"
      expect(valueField!.type).toBe("string");
    });

    it("detects fields present in all files vs some files", async () => {
      await writeMarkdown("content/blog/post1.md", { title: "A", extra: "x" });
      await writeMarkdown("content/blog/post2.md", { title: "B" });
      const collections = await discovery.discoverCollections(tmpDir);
      const blog = collections.find((c) => c.name === "blog");
      const titleField = blog!.schema!.fields.find((f) => f.name === "title");
      const extraField = blog!.schema!.fields.find((f) => f.name === "extra");
      expect(titleField).toBeDefined();
      expect(extraField).toBeDefined();
    });
  });

  describe("discoverCollections structure", () => {
    it("discovers collections in content/ subdirectories", async () => {
      await writeMarkdown("content/blog/post1.md", { title: "Post 1" });
      await writeMarkdown("content/docs/guide.md", { title: "Guide" });
      const collections = await discovery.discoverCollections(tmpDir);
      const names = collections.map((c) => c.name);
      expect(names).toContain("blog");
      expect(names).toContain("docs");
    });

    it("discovers flat collections like _posts", async () => {
      await writeMarkdown("_posts/hello.md", { title: "Hello" });
      const collections = await discovery.discoverCollections(tmpDir);
      const names = collections.map((c) => c.name);
      expect(names).toContain("posts");
    });

    it("skips directories with no markdown files", async () => {
      const emptyDir = path.join(tmpDir, "content", "empty");
      await fs.mkdir(emptyDir, { recursive: true });
      await fs.writeFile(path.join(emptyDir, "readme.txt"), "text");
      const collections = await discovery.discoverCollections(tmpDir);
      expect(collections.find((c) => c.name === "empty")).toBeUndefined();
    });

    it("returns empty array when no content directories exist", async () => {
      const collections = await discovery.discoverCollections(tmpDir);
      expect(collections).toEqual([]);
    });

    it("uses custom SSG content dirs", async () => {
      await writeMarkdown("my-content/articles/post.md", { title: "Custom" });
      const collections = await discovery.discoverCollections(tmpDir, ["my-content"]);
      const names = collections.map((c) => c.name);
      expect(names).toContain("articles");
    });

    it("populates files array with parsed frontmatter", async () => {
      await writeMarkdown("content/blog/post.md", { title: "Test" }, "Body content");
      const collections = await discovery.discoverCollections(tmpDir);
      const blog = collections.find((c) => c.name === "blog");
      expect(blog!.files).toHaveLength(1);
      expect(blog!.files[0].frontmatter.title).toBe("Test");
      expect(blog!.files[0].body).toContain("Body content");
    });
  });
});
