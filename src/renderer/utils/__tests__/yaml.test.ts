import { describe, it, expect } from "vitest";
import { serializeYamlValue, buildFileContent } from "../yaml";

describe("serializeYamlValue", () => {
  it("should serialize null and undefined", () => {
    expect(serializeYamlValue(null)).toBe("null");
    expect(serializeYamlValue(undefined)).toBe("null");
  });

  it("should serialize booleans", () => {
    expect(serializeYamlValue(true)).toBe("true");
    expect(serializeYamlValue(false)).toBe("false");
  });

  it("should serialize numbers", () => {
    expect(serializeYamlValue(42)).toBe("42");
    expect(serializeYamlValue(3.14)).toBe("3.14");
    expect(serializeYamlValue(0)).toBe("0");
    expect(serializeYamlValue(-1)).toBe("-1");
  });

  it("should serialize Date objects as ISO strings", () => {
    const date = new Date("2024-06-15T00:00:00.000Z");
    expect(serializeYamlValue(date)).toBe("2024-06-15T00:00:00.000Z");
  });

  it("should serialize simple strings without quotes", () => {
    expect(serializeYamlValue("hello")).toBe("hello");
    expect(serializeYamlValue("My Post Title")).toBe("My Post Title");
  });

  it("should quote strings containing colons", () => {
    expect(serializeYamlValue("key: value")).toBe('"key: value"');
  });

  it("should quote strings containing hash characters", () => {
    expect(serializeYamlValue("color #red")).toBe('"color #red"');
  });

  it("should quote strings containing newlines", () => {
    const result = serializeYamlValue("line1\nline2");
    expect(result.startsWith('"')).toBe(true);
    expect(result.endsWith('"')).toBe(true);
    expect(result).toContain("line1");
    expect(result).toContain("line2");
  });

  it("should quote strings starting with { or [", () => {
    expect(serializeYamlValue("{json}")).toBe('"{json}"');
    expect(serializeYamlValue("[array]")).toBe('"[array]"');
  });

  it("should escape backslashes and quotes in quoted strings", () => {
    expect(serializeYamlValue('say "hello"')).toBe('say "hello"');
    expect(serializeYamlValue('path: C:\\Users')).toBe('"path: C:\\\\Users"');
  });

  it("should serialize empty arrays", () => {
    expect(serializeYamlValue([])).toBe("[]");
  });

  it("should serialize arrays with items", () => {
    const result = serializeYamlValue(["a", "b", "c"]);
    expect(result).toBe("- a\n- b\n- c");
  });

  it("should serialize nested arrays with indentation", () => {
    const result = serializeYamlValue(["a", "b"], "  ");
    expect(result).toBe("  - a\n  - b");
  });

  it("should serialize objects", () => {
    const result = serializeYamlValue({ title: "Hello", draft: true });
    expect(result).toContain("title: Hello");
    expect(result).toContain("draft: true");
  });

  it("should serialize nested objects with indentation", () => {
    const result = serializeYamlValue({ meta: { author: "Alice" } });
    expect(result).toContain("meta:");
    expect(result).toContain("  author: Alice");
  });

  it("should serialize objects with array values", () => {
    const result = serializeYamlValue({ tags: ["js", "web"] });
    expect(result).toContain("tags:");
    expect(result).toContain("  - js");
    expect(result).toContain("  - web");
  });
});

describe("buildFileContent", () => {
  it("should return body only when frontmatter is empty", () => {
    expect(buildFileContent({}, "Hello world")).toBe("Hello world");
  });

  it("should wrap frontmatter in YAML fences", () => {
    const result = buildFileContent({ title: "Test" }, "Content");
    expect(result).toMatch(/^---\n/);
    expect(result).toMatch(/\n---\n/);
    expect(result).toContain("title: Test");
    expect(result).toContain("Content");
  });

  it("should build full file with complex frontmatter", () => {
    const result = buildFileContent(
      { title: "Post", draft: false, tags: ["a", "b"] },
      "Body text"
    );
    expect(result).toMatch(/^---\n/);
    expect(result).toContain("title: Post");
    expect(result).toContain("draft: false");
    expect(result).toContain("- a");
    expect(result).toContain("- b");
    expect(result).toMatch(/\n---\nBody text$/);
  });

  it("should preserve body content exactly", () => {
    const body = "Line 1\n\nLine 2\n\n# Heading\n\nParagraph";
    const result = buildFileContent({ title: "X" }, body);
    expect(result).toContain(body);
  });
});
