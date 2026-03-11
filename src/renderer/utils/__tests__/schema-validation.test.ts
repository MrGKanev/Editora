import { describe, it, expect } from "vitest";
import { validateFrontmatter, ValidationError } from "../schema-validation";
import { SchemaField } from "../../../shared/types";

function field(overrides: Partial<SchemaField> & { name: string; type: SchemaField["type"] }): SchemaField {
  return { required: false, ...overrides };
}

describe("validateFrontmatter", () => {
  describe("required field checks", () => {
    const schema: SchemaField[] = [field({ name: "title", type: "string", required: true })];

    it("returns error when required field is undefined", () => {
      const errors = validateFrontmatter({}, schema);
      expect(errors).toEqual([
        { field: "title", message: "This field is required", type: "error" },
      ]);
    });

    it("returns error when required field is null", () => {
      const errors = validateFrontmatter({ title: null }, schema);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("error");
    });

    it("returns error when required field is empty string", () => {
      const errors = validateFrontmatter({ title: "" }, schema);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("error");
    });

    it("returns no error when required field is present", () => {
      const errors = validateFrontmatter({ title: "Hello" }, schema);
      expect(errors).toEqual([]);
    });

    it("skips type check after required error", () => {
      // If required and missing, should only get the required error, not a type warning
      const s = [field({ name: "count", type: "number", required: true })];
      const errors = validateFrontmatter({}, s);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe("This field is required");
    });
  });

  describe("optional field handling", () => {
    it("skips absent optional fields without error", () => {
      const schema = [field({ name: "subtitle", type: "string", required: false })];
      const errors = validateFrontmatter({}, schema);
      expect(errors).toEqual([]);
    });

    it("skips null optional fields without error", () => {
      const schema = [field({ name: "subtitle", type: "string", required: false })];
      const errors = validateFrontmatter({ subtitle: null }, schema);
      expect(errors).toEqual([]);
    });

    it("skips empty string optional fields without error", () => {
      const schema = [field({ name: "subtitle", type: "string", required: false })];
      const errors = validateFrontmatter({ subtitle: "" }, schema);
      expect(errors).toEqual([]);
    });
  });

  describe("type checks - string", () => {
    const schema = [field({ name: "title", type: "string" })];

    it("no warning for actual string", () => {
      expect(validateFrontmatter({ title: "Hello" }, schema)).toEqual([]);
    });

    it("warning when number given for string field", () => {
      const errors = validateFrontmatter({ title: 42 }, schema);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("warning");
      expect(errors[0].message).toContain("Expected text");
    });

    it("warning when boolean given for string field", () => {
      const errors = validateFrontmatter({ title: true }, schema);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("warning");
    });
  });

  describe("type checks - number", () => {
    const schema = [field({ name: "count", type: "number" })];

    it("no warning for actual number", () => {
      expect(validateFrontmatter({ count: 42 }, schema)).toEqual([]);
    });

    it("no warning for numeric string (coercible)", () => {
      expect(validateFrontmatter({ count: "42" }, schema)).toEqual([]);
    });

    it("warning for non-numeric string", () => {
      const errors = validateFrontmatter({ count: "hello" }, schema);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe("Expected a number");
    });
  });

  describe("type checks - boolean", () => {
    const schema = [field({ name: "draft", type: "boolean" })];

    it("no warning for actual boolean", () => {
      expect(validateFrontmatter({ draft: false }, schema)).toEqual([]);
      expect(validateFrontmatter({ draft: true }, schema)).toEqual([]);
    });

    it("warning for string given as boolean", () => {
      const errors = validateFrontmatter({ draft: "true" }, schema);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe("Expected true/false");
    });

    it("warning for number given as boolean", () => {
      const errors = validateFrontmatter({ draft: 1 }, schema);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("warning");
    });
  });

  describe("type checks - date", () => {
    const schema = [field({ name: "published", type: "date" })];

    it("accepts Date objects", () => {
      expect(validateFrontmatter({ published: new Date() }, schema)).toEqual([]);
    });

    it("accepts YYYY-MM-DD string", () => {
      expect(validateFrontmatter({ published: "2024-01-15" }, schema)).toEqual([]);
    });

    it("accepts YYYY-MM-DD with time suffix", () => {
      expect(validateFrontmatter({ published: "2024-01-15T10:00:00Z" }, schema)).toEqual([]);
    });

    it("rejects random string", () => {
      const errors = validateFrontmatter({ published: "January 15" }, schema);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe("Expected a date (YYYY-MM-DD)");
    });

    it("rejects number as date", () => {
      const errors = validateFrontmatter({ published: 20240115 }, schema);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("warning");
    });
  });

  describe("type checks - array", () => {
    const schema = [field({ name: "tags", type: "array" })];

    it("accepts array", () => {
      expect(validateFrontmatter({ tags: ["a", "b"] }, schema)).toEqual([]);
    });

    it("accepts empty array", () => {
      expect(validateFrontmatter({ tags: [] }, schema)).toEqual([]);
    });

    it("rejects string as array", () => {
      const errors = validateFrontmatter({ tags: "a,b" }, schema);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe("Expected a list");
    });
  });

  describe("enum validation", () => {
    const schema = [field({ name: "status", type: "enum", options: ["draft", "published", "archived"] })];

    it("accepts valid option", () => {
      expect(validateFrontmatter({ status: "draft" }, schema)).toEqual([]);
    });

    it("rejects invalid option", () => {
      const errors = validateFrontmatter({ status: "pending" }, schema);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain("Must be one of");
      expect(errors[0].message).toContain("draft");
      expect(errors[0].type).toBe("warning");
    });

    it("coerces value to string for comparison", () => {
      // Number 1 becomes "1", which won't be in options
      const errors = validateFrontmatter({ status: 1 }, schema);
      expect(errors.some((e) => e.message.includes("Must be one of"))).toBe(true);
    });

    it("skips enum check if options array is empty", () => {
      const s = [field({ name: "status", type: "enum", options: [] })];
      const errors = validateFrontmatter({ status: "anything" }, s);
      expect(errors).toEqual([]);
    });

    it("skips enum check if options is undefined", () => {
      const s = [field({ name: "status", type: "enum" })];
      const errors = validateFrontmatter({ status: "anything" }, s);
      expect(errors).toEqual([]);
    });
  });

  describe("multiple fields", () => {
    it("validates all fields and collects all errors", () => {
      const schema: SchemaField[] = [
        field({ name: "title", type: "string", required: true }),
        field({ name: "count", type: "number" }),
        field({ name: "tags", type: "array" }),
      ];
      const errors = validateFrontmatter({ count: "abc", tags: "not-array" }, schema);
      // title required -> error, count NaN -> warning, tags not array -> warning
      expect(errors).toHaveLength(3);
      expect(errors.filter((e) => e.type === "error")).toHaveLength(1);
      expect(errors.filter((e) => e.type === "warning")).toHaveLength(2);
    });
  });
});
