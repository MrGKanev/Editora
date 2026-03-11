import { describe, it, expect } from "vitest";
import { slugify, isHtmlHeavy, formatFileSize } from "../markdown";

describe("slugify", () => {
  it("lowercases the input", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("my blog post")).toBe("my-blog-post");
  });

  it("replaces multiple spaces with single hyphen", () => {
    expect(slugify("too   many  spaces")).toBe("too-many-spaces");
  });

  it("removes special characters", () => {
    expect(slugify("Hello, World! @2024")).toBe("hello-world-2024");
  });

  it("preserves hyphens, dots, and underscores", () => {
    expect(slugify("my-file_name.txt")).toBe("my-file_name.txt");
  });

  it("strips unicode/accented characters", () => {
    expect(slugify("cafe resume")).toBe("cafe-resume");
  });

  it("returns already-slugified strings unchanged", () => {
    expect(slugify("already-slug")).toBe("already-slug");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles numbers", () => {
    expect(slugify("post 123")).toBe("post-123");
  });

  it("removes leading/trailing special chars", () => {
    expect(slugify("!hello!")).toBe("hello");
  });
});

describe("isHtmlHeavy", () => {
  it("returns true when content starts with HTML tag", () => {
    expect(isHtmlHeavy("<div>content</div>")).toBe(true);
  });

  it("returns true when content starts with html tag (case-insensitive)", () => {
    expect(isHtmlHeavy("<DIV>content</DIV>")).toBe(true);
  });

  it("returns false for pure markdown", () => {
    expect(isHtmlHeavy("# Heading\n\nSome paragraph text.\n\n- item 1\n- item 2")).toBe(false);
  });

  it("returns false for markdown with few HTML tags", () => {
    // 1 tag in 5 lines = 0.2 ratio, below 0.3 threshold
    expect(isHtmlHeavy("line1\nline2\nline3\nline4\n<br>")).toBe(false);
  });

  it("returns true when tag ratio exceeds threshold", () => {
    // 3 tags in 3 lines = 1.0 ratio
    const content = "<p>one</p>\n<p>two</p>\n<p>three</p>";
    expect(isHtmlHeavy(content)).toBe(true);
  });

  it("returns true for content starting with self-closing tag", () => {
    expect(isHtmlHeavy("<img src='test.png' />")).toBe(true);
  });

  it("handles mixed markdown and HTML below threshold", () => {
    const content = "# Title\n\nSome text\n\nMore text\n\nEven more\n\n<em>emphasis</em>";
    expect(isHtmlHeavy(content)).toBe(false);
  });

  it("handles empty string", () => {
    expect(isHtmlHeavy("")).toBe(false);
  });

  it("trims whitespace before checking", () => {
    expect(isHtmlHeavy("   <div>test</div>   ")).toBe(true);
  });
});

describe("formatFileSize", () => {
  it("formats bytes (< 1024)", () => {
    expect(formatFileSize(0)).toBe("0B");
    expect(formatFileSize(1)).toBe("1B");
    expect(formatFileSize(512)).toBe("512B");
    expect(formatFileSize(1023)).toBe("1023B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1.0KB");
    expect(formatFileSize(1536)).toBe("1.5KB");
    expect(formatFileSize(10240)).toBe("10.0KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1.0MB");
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.5MB");
    expect(formatFileSize(10 * 1024 * 1024)).toBe("10.0MB");
  });

  it("boundary: exactly 1024 is KB, not bytes", () => {
    expect(formatFileSize(1024)).toBe("1.0KB");
  });

  it("boundary: exactly 1MB", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1.0MB");
  });
});
