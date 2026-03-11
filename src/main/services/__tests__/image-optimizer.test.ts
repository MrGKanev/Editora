import { describe, it, expect } from "vitest";
import { ImageOptimizer } from "../image-optimizer";

describe("ImageOptimizer.canOptimize", () => {
  const optimizer = new ImageOptimizer();

  describe("optimizable formats", () => {
    it.each([
      ["/images/photo.png", true],
      ["/images/photo.jpg", true],
      ["/images/photo.jpeg", true],
      ["/images/photo.webp", true],
      ["/images/photo.avif", true],
      ["/images/photo.tiff", true],
    ])("canOptimize(%s) → %s", (filePath, expected) => {
      expect(optimizer.canOptimize(filePath)).toBe(expected);
    });
  });

  describe("non-optimizable formats", () => {
    it.each([
      ["/images/icon.svg", false],
      ["/images/animation.gif", false],
      ["/images/favicon.ico", false],
      ["/images/document.pdf", false],
      ["/images/file.txt", false],
      ["/images/noext", false],
    ])("canOptimize(%s) → %s", (filePath, expected) => {
      expect(optimizer.canOptimize(filePath)).toBe(expected);
    });
  });

  describe("case insensitivity", () => {
    it("handles uppercase extensions", () => {
      expect(optimizer.canOptimize("/images/photo.PNG")).toBe(true);
      expect(optimizer.canOptimize("/images/photo.JPG")).toBe(true);
      expect(optimizer.canOptimize("/images/photo.JPEG")).toBe(true);
    });

    it("handles mixed-case extensions", () => {
      expect(optimizer.canOptimize("/images/photo.Webp")).toBe(true);
    });

    it("returns false for non-optimizable uppercase", () => {
      expect(optimizer.canOptimize("/images/icon.SVG")).toBe(false);
      expect(optimizer.canOptimize("/images/anim.GIF")).toBe(false);
    });
  });
});
