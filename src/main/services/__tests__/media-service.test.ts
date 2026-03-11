import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { MediaService } from "../media-service";

describe("MediaService", () => {
  let service: MediaService;
  let tmpDir: string;

  beforeEach(async () => {
    service = new MediaService();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "editora-media-test-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe("listMedia", () => {
    it("should return empty array when no media directories exist", async () => {
      const files = await service.listMedia(tmpDir);
      expect(files).toEqual([]);
    });

    it("should find images in public/ directory", async () => {
      const publicDir = path.join(tmpDir, "public");
      await fs.mkdir(publicDir, { recursive: true });
      await fs.writeFile(path.join(publicDir, "logo.png"), "fake-png");

      const files = await service.listMedia(tmpDir);
      expect(files.length).toBe(1);
      expect(files[0].name).toBe("logo.png");
      expect(files[0].type).toBe("png");
    });

    it("should find images in src/assets/ directory", async () => {
      const assetsDir = path.join(tmpDir, "src", "assets");
      await fs.mkdir(assetsDir, { recursive: true });
      await fs.writeFile(path.join(assetsDir, "hero.jpg"), "fake-jpg");

      const files = await service.listMedia(tmpDir);
      expect(files.length).toBe(1);
      expect(files[0].name).toBe("hero.jpg");
    });

    it("should scan both public/ and src/assets/", async () => {
      await fs.mkdir(path.join(tmpDir, "public"), { recursive: true });
      await fs.mkdir(path.join(tmpDir, "src", "assets"), { recursive: true });
      await fs.writeFile(path.join(tmpDir, "public", "a.png"), "data");
      await fs.writeFile(path.join(tmpDir, "src", "assets", "b.jpg"), "data");

      const files = await service.listMedia(tmpDir);
      expect(files.length).toBe(2);
    });

    it("should scan subdirectories recursively", async () => {
      const imagesDir = path.join(tmpDir, "public", "images", "blog");
      await fs.mkdir(imagesDir, { recursive: true });
      await fs.writeFile(path.join(imagesDir, "photo.webp"), "data");

      const files = await service.listMedia(tmpDir);
      expect(files.length).toBe(1);
      expect(files[0].name).toBe("photo.webp");
      expect(files[0].relativePath).toBe(path.join("images", "blog", "photo.webp"));
    });

    it("should support all image extensions", async () => {
      const publicDir = path.join(tmpDir, "public");
      await fs.mkdir(publicDir, { recursive: true });

      const extensions = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif", ".ico"];
      for (const ext of extensions) {
        await fs.writeFile(path.join(publicDir, `image${ext}`), "data");
      }

      const files = await service.listMedia(tmpDir);
      expect(files.length).toBe(extensions.length);
    });

    it("should ignore non-image files", async () => {
      const publicDir = path.join(tmpDir, "public");
      await fs.mkdir(publicDir, { recursive: true });
      await fs.writeFile(path.join(publicDir, "script.js"), "code");
      await fs.writeFile(path.join(publicDir, "style.css"), "css");
      await fs.writeFile(path.join(publicDir, "data.json"), "{}");
      await fs.writeFile(path.join(publicDir, "logo.png"), "png");

      const files = await service.listMedia(tmpDir);
      expect(files.length).toBe(1);
      expect(files[0].name).toBe("logo.png");
    });

    it("should sort by lastModified descending", async () => {
      const publicDir = path.join(tmpDir, "public");
      await fs.mkdir(publicDir, { recursive: true });

      await fs.writeFile(path.join(publicDir, "old.png"), "old");
      await new Promise((r) => setTimeout(r, 50));
      await fs.writeFile(path.join(publicDir, "new.png"), "new");

      const files = await service.listMedia(tmpDir);
      expect(files[0].name).toBe("new.png");
      expect(files[1].name).toBe("old.png");
    });

    it("should include file size", async () => {
      const publicDir = path.join(tmpDir, "public");
      await fs.mkdir(publicDir, { recursive: true });
      const content = "x".repeat(1000);
      await fs.writeFile(path.join(publicDir, "sized.png"), content);

      const files = await service.listMedia(tmpDir);
      expect(files[0].size).toBe(1000);
    });

    it("should find images in content directories alongside markdown", async () => {
      const contentDir = path.join(tmpDir, "content", "blog");
      await fs.mkdir(contentDir, { recursive: true });
      await fs.writeFile(path.join(contentDir, "post.md"), "# Hello");
      await fs.writeFile(path.join(contentDir, "hero.jpg"), "fake-jpg");
      await fs.writeFile(path.join(contentDir, "diagram.png"), "fake-png");

      const files = await service.listMedia(tmpDir);
      const names = files.map((f) => f.name).sort();
      expect(names).toContain("diagram.png");
      expect(names).toContain("hero.jpg");
    });

    it("should find images in custom SSG content dirs", async () => {
      const customDir = path.join(tmpDir, "my-pages");
      await fs.mkdir(customDir, { recursive: true });
      await fs.writeFile(path.join(customDir, "banner.webp"), "fake-webp");

      const files = await service.listMedia(tmpDir, ["my-pages"]);
      expect(files.length).toBe(1);
      expect(files[0].name).toBe("banner.webp");
    });

    it("should not duplicate images when same dir is scanned twice", async () => {
      const publicDir = path.join(tmpDir, "public");
      await fs.mkdir(publicDir, { recursive: true });
      await fs.writeFile(path.join(publicDir, "logo.png"), "data");

      // Pass "public" as a content dir too - should not duplicate
      const files = await service.listMedia(tmpDir, ["public"]);
      expect(files.length).toBe(1);
    });

    it("should handle case-insensitive extensions", async () => {
      const publicDir = path.join(tmpDir, "public");
      await fs.mkdir(publicDir, { recursive: true });
      await fs.writeFile(path.join(publicDir, "photo.PNG"), "data");
      await fs.writeFile(path.join(publicDir, "image.Jpg"), "data");

      const files = await service.listMedia(tmpDir);
      expect(files.length).toBe(2);
    });
  });

  describe("uploadFiles", () => {
    it("should copy files to public/images/", async () => {
      // Create a source file
      const sourceFile = path.join(tmpDir, "source.png");
      await fs.writeFile(sourceFile, "image-data");

      const result = await service.uploadFiles(tmpDir, [sourceFile]);
      expect(result.uploaded.length).toBe(1);

      const destPath = path.join(tmpDir, "public", "images", "source.png");
      const exists = await fs.access(destPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      const content = await fs.readFile(destPath, "utf-8");
      expect(content).toBe("image-data");
    });

    it("should create public/images/ directory if missing", async () => {
      const sourceFile = path.join(tmpDir, "test.jpg");
      await fs.writeFile(sourceFile, "data");

      await service.uploadFiles(tmpDir, [sourceFile]);

      const dirExists = await fs.access(path.join(tmpDir, "public", "images"))
        .then(() => true).catch(() => false);
      expect(dirExists).toBe(true);
    });

    it("should upload multiple files", async () => {
      const files = ["a.png", "b.jpg", "c.gif"];
      for (const f of files) {
        await fs.writeFile(path.join(tmpDir, f), `data-${f}`);
      }

      const result = await service.uploadFiles(
        tmpDir,
        files.map((f) => path.join(tmpDir, f))
      );
      expect(result.uploaded.length).toBe(3);
    });
  });
});
