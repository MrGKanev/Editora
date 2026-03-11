import { describe, it, expect } from "vitest";
import { isHtmlHeavy, slugify, formatFileSize } from "../markdown";

describe("isHtmlHeavy", () => {
  it("should detect content starting with HTML tag", () => {
    expect(isHtmlHeavy("<div>Hello</div>")).toBe(true);
    expect(isHtmlHeavy("<section>\n<p>Content</p>\n</section>")).toBe(true);
  });

  it("should detect content with high tag-to-line ratio", () => {
    const html = "<p>One</p>\n<p>Two</p>\n<p>Three</p>";
    // 6 tags, 3 lines → ratio 2.0 > 0.3
    expect(isHtmlHeavy(html)).toBe(true);
  });

  it("should not flag plain markdown", () => {
    expect(isHtmlHeavy("# Hello\n\nThis is **markdown**.")).toBe(false);
  });

  it("should not flag markdown with occasional inline HTML", () => {
    const content = "# Title\n\nParagraph one.\n\nParagraph two.\n\nParagraph three.\n\nParagraph four.\n\nMore text here.\n\n<br>";
    // 1 tag, 11 lines → ratio ~0.09 < 0.3
    expect(isHtmlHeavy(content)).toBe(false);
  });

  it("should handle empty content", () => {
    expect(isHtmlHeavy("")).toBe(false);
  });

  it("should handle content with only whitespace", () => {
    expect(isHtmlHeavy("   \n  \n   ")).toBe(false);
  });

  it("should detect full HTML pages", () => {
    const html = "<html>\n<head><title>Test</title></head>\n<body><h1>Hello</h1></body>\n</html>";
    expect(isHtmlHeavy(html)).toBe(true);
  });
});

describe("slugify", () => {
  it("should lowercase the input", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("should replace spaces with hyphens", () => {
    expect(slugify("my post title")).toBe("my-post-title");
  });

  it("should replace multiple spaces with single hyphen", () => {
    expect(slugify("too   many   spaces")).toBe("too-many-spaces");
  });

  it("should remove special characters", () => {
    expect(slugify("hello@world!")).toBe("helloworld");
  });

  it("should keep hyphens, dots, and underscores", () => {
    expect(slugify("my-file_name.md")).toBe("my-file_name.md");
  });

  it("should handle already slugified input", () => {
    expect(slugify("already-slug")).toBe("already-slug");
  });

  it("should remove accented characters", () => {
    expect(slugify("café résumé")).toBe("caf-rsum");
  });

  it("should handle empty string", () => {
    expect(slugify("")).toBe("");
  });
});

describe("formatFileSize", () => {
  it("should format bytes", () => {
    expect(formatFileSize(0)).toBe("0B");
    expect(formatFileSize(512)).toBe("512B");
    expect(formatFileSize(1023)).toBe("1023B");
  });

  it("should format kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1.0KB");
    expect(formatFileSize(1536)).toBe("1.5KB");
    expect(formatFileSize(10240)).toBe("10.0KB");
  });

  it("should format megabytes", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1.0MB");
    expect(formatFileSize(5.5 * 1024 * 1024)).toBe("5.5MB");
  });

  it("should handle boundary values", () => {
    expect(formatFileSize(1024 - 1)).toBe("1023B");
    expect(formatFileSize(1024)).toBe("1.0KB");
    expect(formatFileSize(1024 * 1024 - 1)).toBe("1024.0KB");
    expect(formatFileSize(1024 * 1024)).toBe("1.0MB");
  });
});
