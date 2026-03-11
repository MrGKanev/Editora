import { describe, it, expect } from "vitest";
import { serializeYamlValue, buildFileContent } from "../yaml";

describe("serializeYamlValue", () => {
  describe("primitives", () => {
    it("serializes null", () => {
      expect(serializeYamlValue(null)).toBe("null");
    });

    it("serializes undefined", () => {
      expect(serializeYamlValue(undefined)).toBe("null");
    });

    it("serializes booleans", () => {
      expect(serializeYamlValue(true)).toBe("true");
      expect(serializeYamlValue(false)).toBe("false");
    });

    it("serializes numbers", () => {
      expect(serializeYamlValue(42)).toBe("42");
      expect(serializeYamlValue(3.14)).toBe("3.14");
      expect(serializeYamlValue(0)).toBe("0");
      expect(serializeYamlValue(-1)).toBe("-1");
    });

    it("serializes plain strings", () => {
      expect(serializeYamlValue("hello")).toBe("hello");
      expect(serializeYamlValue("simple text")).toBe("simple text");
    });
  });

  describe("dates", () => {
    it("serializes Date objects to ISO string", () => {
      const d = new Date("2024-01-15T00:00:00.000Z");
      expect(serializeYamlValue(d)).toBe("2024-01-15T00:00:00.000Z");
    });
  });

  describe("strings with special characters", () => {
    it("quotes strings with colons followed by spaces", () => {
      const result = serializeYamlValue("key: value");
      expect(result).toBe('"key: value"');
    });

    it("quotes strings with hash characters", () => {
      const result = serializeYamlValue("color #fff");
      expect(result).toBe('"color #fff"');
    });

    it("quotes strings with newlines", () => {
      const result = serializeYamlValue("line1\nline2");
      // The function wraps in quotes but does not escape the newline itself
      expect(result).toBe('"line1\nline2"');
    });

    it("quotes strings starting with curly brace", () => {
      const result = serializeYamlValue("{json}");
      expect(result).toBe('"{json}"');
    });

    it("quotes strings starting with square bracket", () => {
      const result = serializeYamlValue("[array]");
      expect(result).toBe('"[array]"');
    });

    it("does not quote strings with only double quotes (no trigger chars)", () => {
      // 'say "hello"' has no colon-space, no hash, no newline, no leading bracket
      const result = serializeYamlValue('say "hello"');
      expect(result).toBe('say "hello"');
    });

    it("escapes backslashes inside quoted strings", () => {
      const result = serializeYamlValue("path\\to: file");
      expect(result).toBe('"path\\\\to: file"');
    });

    it("does not quote simple strings without special chars", () => {
      expect(serializeYamlValue("hello world")).toBe("hello world");
    });
  });

  describe("arrays", () => {
    it("serializes empty array as []", () => {
      expect(serializeYamlValue([])).toBe("[]");
    });

    it("serializes array of strings", () => {
      const result = serializeYamlValue(["a", "b", "c"]);
      expect(result).toBe("- a\n- b\n- c");
    });

    it("serializes array of numbers", () => {
      const result = serializeYamlValue([1, 2, 3]);
      expect(result).toBe("- 1\n- 2\n- 3");
    });

    it("serializes array with mixed types", () => {
      const result = serializeYamlValue(["hello", 42, true]);
      expect(result).toBe("- hello\n- 42\n- true");
    });
  });

  describe("objects", () => {
    it("serializes flat object", () => {
      const result = serializeYamlValue({ title: "Hello", count: 5 });
      expect(result).toBe("title: Hello\ncount: 5");
    });

    it("serializes nested object with indentation", () => {
      const result = serializeYamlValue({ meta: { author: "John" } });
      expect(result).toContain("meta:\n");
      expect(result).toContain("  author: John");
    });

    it("serializes object with array value (indented)", () => {
      const result = serializeYamlValue({ tags: ["a", "b"] });
      // Arrays inside objects get indented by 2 spaces
      expect(result).toBe("tags:\n  - a\n  - b");
    });

    it("serializes object with empty array", () => {
      const result = serializeYamlValue({ tags: [] });
      expect(result).toBe("tags: []");
    });
  });
});

describe("buildFileContent", () => {
  it("returns just body when frontmatter is empty", () => {
    expect(buildFileContent({}, "Hello world")).toBe("Hello world");
  });

  it("wraps frontmatter in --- delimiters", () => {
    const result = buildFileContent({ title: "Test" }, "Body text");
    expect(result).toBe("---\ntitle: Test\n---\nBody text");
  });

  it("handles multiple frontmatter fields", () => {
    const result = buildFileContent({ title: "Test", draft: true }, "Body");
    expect(result).toContain("---\n");
    expect(result).toContain("title: Test");
    expect(result).toContain("draft: true");
    expect(result).toContain("\n---\n");
    expect(result.endsWith("Body")).toBe(true);
  });

  it("handles frontmatter with special characters", () => {
    const result = buildFileContent({ desc: "hello: world" }, "Body");
    expect(result).toContain('"hello: world"');
  });

  it("preserves body content exactly", () => {
    const body = "# Heading\n\nParagraph with **bold**.\n";
    const result = buildFileContent({ title: "X" }, body);
    expect(result.endsWith(body)).toBe(true);
  });
});
