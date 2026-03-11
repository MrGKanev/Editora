import { describe, it, expect } from "vitest";
import { SSG_DEFINITIONS } from "../ssg";

describe("SSG Definitions", () => {
  it("should define all expected SSGs", () => {
    const ids = SSG_DEFINITIONS.map((s) => s.id);
    expect(ids).toContain("astro");
    expect(ids).toContain("hugo");
    expect(ids).toContain("eleventy");
    expect(ids).toContain("jekyll");
    expect(ids).toContain("nextjs");
    expect(ids).toContain("nuxt");
    expect(ids).toContain("gatsby");
    expect(ids).toContain("vitepress");
    expect(ids).toContain("gridsome");
    expect(ids).toContain("hexo");
  });

  it("should have unique IDs", () => {
    const ids = SSG_DEFINITIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have non-empty names", () => {
    for (const ssg of SSG_DEFINITIONS) {
      expect(ssg.name.length).toBeGreaterThan(0);
    }
  });

  it("should have at least one content directory each", () => {
    for (const ssg of SSG_DEFINITIONS) {
      expect(ssg.contentDirs.length).toBeGreaterThan(0);
    }
  });

  it("should have dev commands for each SSG", () => {
    for (const ssg of SSG_DEFINITIONS) {
      expect(ssg.devCommand.length).toBeGreaterThan(0);
    }
  });

  it("should have a URL pattern regex for each SSG", () => {
    for (const ssg of SSG_DEFINITIONS) {
      expect(ssg.urlPattern).toBeInstanceOf(RegExp);
    }
  });

  it("URL patterns should match localhost URLs", () => {
    for (const ssg of SSG_DEFINITIONS) {
      // Jekyll has a special pattern
      if (ssg.id === "jekyll") {
        const match = "Server address: http://127.0.0.1:4000".match(ssg.urlPattern);
        expect(match).not.toBeNull();
        expect(match![1]).toBe("4000");
      } else {
        const match = "http://localhost:4321".match(ssg.urlPattern);
        expect(match).not.toBeNull();
        expect(match![1]).toBe("4321");
      }
    }
  });

  it("npm-based SSGs should have package identifiers", () => {
    const npmBased = ["astro", "eleventy", "nextjs", "nuxt", "gatsby", "vitepress", "gridsome", "hexo"];
    for (const id of npmBased) {
      const ssg = SSG_DEFINITIONS.find((s) => s.id === id);
      expect(ssg?.packages.length).toBeGreaterThan(0);
    }
  });

  it("non-npm SSGs (Hugo, Jekyll) should have empty packages", () => {
    const nonNpm = ["hugo", "jekyll"];
    for (const id of nonNpm) {
      const ssg = SSG_DEFINITIONS.find((s) => s.id === id);
      expect(ssg?.packages).toEqual([]);
    }
  });

  it("should have config files for detection", () => {
    for (const ssg of SSG_DEFINITIONS) {
      expect(ssg.configFiles.length).toBeGreaterThan(0);
    }
  });
});
