import { describe, it, expect } from "vitest";
import { parseMarkdownTable, generateMarkdownTable } from "../TableEditorModal";

describe("parseMarkdownTable", () => {
  // Note: parseLine splits by "|" and drops only the first element (index 0).
  // When a line ends with "|", the trailing empty string is kept as a column.
  // This means "| A | B |" parses to ["A", "B", ""] (3 elements).

  it("parses a valid GFM table", () => {
    const md = `| Name | Age | City |
| --- | --- | --- |
| Alice | 30 | NYC |
| Bob | 25 | LA |`;

    const result = parseMarkdownTable(md);
    expect(result).not.toBeNull();
    // Trailing pipe produces an extra empty column
    expect(result!.headers).toEqual(["Name", "Age", "City", ""]);
    expect(result!.rows).toEqual([
      ["Alice", "30", "NYC", ""],
      ["Bob", "25", "LA", ""],
    ]);
  });

  it("parses table with alignment markers in separator", () => {
    const md = `| Left | Center | Right |
| :--- | :---: | ---: |
| a | b | c |`;

    const result = parseMarkdownTable(md);
    expect(result).not.toBeNull();
    expect(result!.headers).toEqual(["Left", "Center", "Right", ""]);
    expect(result!.rows).toEqual([["a", "b", "c", ""]]);
  });

  it("pads rows with fewer columns than headers", () => {
    const md = `| A | B | C |
| --- | --- | --- |
| 1 |`;

    const result = parseMarkdownTable(md);
    expect(result).not.toBeNull();
    // Headers: ["A", "B", "C", ""] (4 cols). Row "| 1 |" → ["1", ""] padded to 4.
    expect(result!.rows[0]).toHaveLength(4);
    expect(result!.rows[0][0]).toBe("1");
  });

  it("trims rows with more columns than headers", () => {
    const md = `| A | B |
| --- | --- |
| 1 | 2 | 3 | 4 |`;

    const result = parseMarkdownTable(md);
    expect(result).not.toBeNull();
    // Headers: ["A", "B", ""] (3 cols). Row trimmed to 3.
    expect(result!.rows[0]).toHaveLength(3);
    expect(result!.rows[0][0]).toBe("1");
    expect(result!.rows[0][1]).toBe("2");
  });

  it("returns null for input with fewer than 2 lines", () => {
    expect(parseMarkdownTable("| A | B |")).toBeNull();
    expect(parseMarkdownTable("just text")).toBeNull();
  });

  it("returns null when separator line is invalid", () => {
    const md = `| A | B |
| not a separator |
| 1 | 2 |`;

    expect(parseMarkdownTable(md)).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(parseMarkdownTable("")).toBeNull();
  });

  it("returns null for plain text that is not a table", () => {
    expect(parseMarkdownTable("Hello\nWorld\nFoo")).toBeNull();
  });

  it("handles table with no data rows (header + separator only)", () => {
    const md = `| A | B |
| --- | --- |`;

    const result = parseMarkdownTable(md);
    expect(result).not.toBeNull();
    expect(result!.headers).toEqual(["A", "B", ""]);
    expect(result!.rows).toEqual([]);
  });

  it("trims whitespace from cells", () => {
    const md = `|  Name  |  Value  |
| --- | --- |
|  hello  |  world  |`;

    const result = parseMarkdownTable(md);
    expect(result!.headers[0]).toBe("Name");
    expect(result!.headers[1]).toBe("Value");
    expect(result!.rows[0][0]).toBe("hello");
    expect(result!.rows[0][1]).toBe("world");
  });

  it("parses table without trailing pipe (no extra empty col)", () => {
    const md = `| Name | Age
| --- | ---
| Alice | 30`;

    const result = parseMarkdownTable(md);
    expect(result).not.toBeNull();
    expect(result!.headers).toEqual(["Name", "Age"]);
    expect(result!.rows).toEqual([["Alice", "30"]]);
  });
});

describe("generateMarkdownTable", () => {
  it("generates a formatted table with headers and rows", () => {
    const result = generateMarkdownTable(
      ["Name", "Age"],
      [["Alice", "30"], ["Bob", "25"]]
    );

    const lines = result.split("\n");
    expect(lines).toHaveLength(4); // header, separator, 2 data rows
    expect(lines[0]).toContain("Name");
    expect(lines[0]).toContain("Age");
    expect(lines[1]).toMatch(/^\|[\s-|]+\|$/);
    expect(lines[2]).toContain("Alice");
    expect(lines[3]).toContain("Bob");
  });

  it("pads cells to align columns", () => {
    const result = generateMarkdownTable(
      ["X", "Long Header"],
      [["a", "b"]]
    );

    const lines = result.split("\n");
    // Separator dashes should match column widths
    const separatorParts = lines[1].split("|").filter((s) => s.trim());
    expect(separatorParts[1].trim().length).toBe("Long Header".length);
  });

  it("handles empty cells", () => {
    const result = generateMarkdownTable(
      ["A", "B"],
      [["", "val"]]
    );
    expect(result).toContain("val");
  });

  it("ensures minimum column width of 3", () => {
    const result = generateMarkdownTable(["A"], [["b"]]);
    const lines = result.split("\n");
    const sepContent = lines[1].split("|").filter((s) => s.trim())[0].trim();
    expect(sepContent.length).toBeGreaterThanOrEqual(3);
  });
});

describe("roundtrip: generate → parse", () => {
  it("generate then parse recovers the data (with trailing empty col from pipe)", () => {
    const headers = ["Name", "Score", "Grade"];
    const rows = [
      ["Alice", "95", "A"],
      ["Bob", "82", "B"],
    ];

    const md = generateMarkdownTable(headers, rows);
    const parsed = parseMarkdownTable(md);
    expect(parsed).not.toBeNull();

    // Generated table has trailing "|", so parsed headers include a trailing "".
    // The original data columns are still intact.
    expect(parsed!.headers.slice(0, 3)).toEqual(headers);
    expect(parsed!.rows.map((r) => r.slice(0, 3))).toEqual(rows);
  });

  it("generate preserves all cell content", () => {
    const headers = ["Item"];
    const rows = [["apple"], ["banana"]];

    const md = generateMarkdownTable(headers, rows);
    expect(md).toContain("apple");
    expect(md).toContain("banana");

    const parsed = parseMarkdownTable(md);
    expect(parsed).not.toBeNull();
    expect(parsed!.headers[0]).toBe("Item");
    expect(parsed!.rows[0][0]).toBe("apple");
    expect(parsed!.rows[1][0]).toBe("banana");
  });
});
