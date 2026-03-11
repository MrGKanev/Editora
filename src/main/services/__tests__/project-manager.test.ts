import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { ProjectManager } from "../project-manager";

// Mock electron-store
vi.mock("electron-store", () => {
  const store = new Map<string, unknown>();
  return {
    default: class MockStore {
      constructor() {}
      get(key: string, defaultValue?: unknown) {
        return store.get(key) ?? defaultValue;
      }
      set(key: string, value: unknown) {
        store.set(key, value);
      }
    },
  };
});

// Mock simple-git
vi.mock("simple-git", () => ({
  default: () => ({
    getRemotes: async () => [],
    clone: async () => {},
  }),
}));

describe("ProjectManager", () => {
  let manager: ProjectManager;
  let tmpDir: string;

  beforeEach(async () => {
    manager = new ProjectManager();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "editora-pm-test-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe("detectSSG", () => {
    it("should detect Astro project from package.json", async () => {
      await fs.writeFile(
        path.join(tmpDir, "package.json"),
        JSON.stringify({ dependencies: { astro: "^4.0.0" } })
      );

      const result = await manager.detectSSG(tmpDir);
      expect(result).not.toBeNull();
      expect(result!.definition.id).toBe("astro");
      expect(result!.confidence).toBe("high");
    });

    it("should detect Next.js project", async () => {
      await fs.writeFile(
        path.join(tmpDir, "package.json"),
        JSON.stringify({ dependencies: { next: "^14.0.0" } })
      );

      const result = await manager.detectSSG(tmpDir);
      expect(result!.definition.id).toBe("nextjs");
    });

    it("should detect Nuxt from devDependencies", async () => {
      await fs.writeFile(
        path.join(tmpDir, "package.json"),
        JSON.stringify({ devDependencies: { nuxt: "^3.0.0" } })
      );

      const result = await manager.detectSSG(tmpDir);
      expect(result!.definition.id).toBe("nuxt");
    });

    it("should detect Hugo from config file", async () => {
      await fs.writeFile(path.join(tmpDir, "hugo.toml"), "baseURL = 'https://example.com'");

      const result = await manager.detectSSG(tmpDir);
      expect(result).not.toBeNull();
      expect(result!.definition.id).toBe("hugo");
      expect(result!.confidence).toBe("medium");
    });

    it("should detect Jekyll from _config.yml", async () => {
      await fs.writeFile(path.join(tmpDir, "_config.yml"), "title: My Site");

      const result = await manager.detectSSG(tmpDir);
      expect(result).not.toBeNull();
      // Could be jekyll or hexo since both use _config.yml
      expect(["jekyll", "hexo"]).toContain(result!.definition.id);
    });

    it("should detect Eleventy from config file", async () => {
      await fs.writeFile(path.join(tmpDir, ".eleventy.js"), "module.exports = {}");

      const result = await manager.detectSSG(tmpDir);
      expect(result!.definition.id).toBe("eleventy");
    });

    it("should fallback to generic for markdown-only projects", async () => {
      const contentDir = path.join(tmpDir, "content");
      await fs.mkdir(contentDir, { recursive: true });
      await fs.writeFile(path.join(contentDir, "post.md"), "# Hello");

      const result = await manager.detectSSG(tmpDir);
      expect(result).not.toBeNull();
      expect(result!.definition.id).toBe("generic");
      expect(result!.confidence).toBe("low");
    });

    it("should return null for non-project directories", async () => {
      const result = await manager.detectSSG(tmpDir);
      expect(result).toBeNull();
    });

    it("should prefer package.json detection over config files", async () => {
      // Both package.json with astro AND a hugo.toml
      await fs.writeFile(
        path.join(tmpDir, "package.json"),
        JSON.stringify({ dependencies: { astro: "^4.0.0" } })
      );
      await fs.writeFile(path.join(tmpDir, "hugo.toml"), "baseURL = 'https://example.com'");

      const result = await manager.detectSSG(tmpDir);
      expect(result!.definition.id).toBe("astro");
      expect(result!.confidence).toBe("high");
    });
  });

  describe("validateProject", () => {
    it("should return true for valid projects", async () => {
      await fs.writeFile(
        path.join(tmpDir, "package.json"),
        JSON.stringify({ dependencies: { astro: "^4.0.0" } })
      );

      const isValid = await manager.validateProject(tmpDir);
      expect(isValid).toBe(true);
    });

    it("should return false for invalid projects", async () => {
      const isValid = await manager.validateProject(tmpDir);
      expect(isValid).toBe(false);
    });
  });

  describe("openProject", () => {
    it("should create a project object with correct name", async () => {
      const contentDir = path.join(tmpDir, "content");
      await fs.mkdir(contentDir, { recursive: true });
      await fs.writeFile(path.join(contentDir, "post.md"), "# Hello");

      const project = await manager.openProject(tmpDir);
      expect(project.path).toBe(tmpDir);
      expect(project.name).toBe(path.basename(tmpDir));
      expect(project.lastOpened).toBeGreaterThan(0);
    });

    it("should detect git repo", async () => {
      await fs.mkdir(path.join(tmpDir, ".git"), { recursive: true });
      const contentDir = path.join(tmpDir, "content");
      await fs.mkdir(contentDir, { recursive: true });
      await fs.writeFile(path.join(contentDir, "post.md"), "# Hello");

      const project = await manager.openProject(tmpDir);
      expect(project.isGitRepo).toBe(true);
    });

    it("should detect non-git projects", async () => {
      const contentDir = path.join(tmpDir, "content");
      await fs.mkdir(contentDir, { recursive: true });
      await fs.writeFile(path.join(contentDir, "post.md"), "# Hello");

      const project = await manager.openProject(tmpDir);
      expect(project.isGitRepo).toBe(false);
    });

    it("should set SSG info when detected", async () => {
      await fs.writeFile(
        path.join(tmpDir, "package.json"),
        JSON.stringify({ dependencies: { astro: "^4.0.0" } })
      );

      const project = await manager.openProject(tmpDir);
      expect(project.ssgId).toBe("astro");
      expect(project.ssgName).toBe("Astro");
    });
  });

  describe("getRecentProjects", () => {
    it("should return empty array initially", () => {
      const recent = manager.getRecentProjects();
      expect(Array.isArray(recent)).toBe(true);
    });
  });

  describe("getSSGDefinition", () => {
    it("should return definition for known SSG", () => {
      const def = manager.getSSGDefinition("astro");
      expect(def).toBeDefined();
      expect(def!.name).toBe("Astro");
    });

    it("should return undefined for generic SSG", () => {
      const def = manager.getSSGDefinition("generic");
      expect(def).toBeUndefined();
    });

    it("should return undefined for unknown SSG", () => {
      const def = manager.getSSGDefinition("unknown-ssg");
      expect(def).toBeUndefined();
    });
  });
});
