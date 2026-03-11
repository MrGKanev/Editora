import { describe, it, expect } from "vitest";
import { parseAnsi, colorizeLog } from "../terminal";

describe("parseAnsi", () => {
  it("should return plain text as single span with no classes", () => {
    const result = parseAnsi("hello world");
    expect(result).toEqual([{ text: "hello world", classes: "" }]);
  });

  it("should parse red color code", () => {
    const result = parseAnsi("\x1b[31mError\x1b[0m");
    expect(result).toEqual([
      { text: "Error", classes: "text-red-400" },
    ]);
  });

  it("should parse green color code", () => {
    const result = parseAnsi("\x1b[32mSuccess\x1b[0m");
    expect(result).toEqual([
      { text: "Success", classes: "text-green-400" },
    ]);
  });

  it("should handle bold code", () => {
    const result = parseAnsi("\x1b[1mBold text\x1b[0m");
    expect(result).toEqual([
      { text: "Bold text", classes: "font-bold" },
    ]);
  });

  it("should combine bold and color", () => {
    const result = parseAnsi("\x1b[1;31mBold Red\x1b[0m");
    expect(result).toEqual([
      { text: "Bold Red", classes: "font-bold text-red-400" },
    ]);
  });

  it("should handle text before and after ANSI codes", () => {
    const result = parseAnsi("before \x1b[32mgreen\x1b[0m after");
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ text: "before ", classes: "" });
    expect(result[1]).toEqual({ text: "green", classes: "text-green-400" });
    expect(result[2]).toEqual({ text: " after", classes: "" });
  });

  it("should reset classes on code 0", () => {
    const result = parseAnsi("\x1b[31mred\x1b[0mnormal");
    expect(result[0].classes).toBe("text-red-400");
    expect(result[1].classes).toBe("");
  });

  it("should replace color when a new color is applied", () => {
    const result = parseAnsi("\x1b[31mred\x1b[32mgreen\x1b[0m");
    expect(result[0]).toEqual({ text: "red", classes: "text-red-400" });
    expect(result[1]).toEqual({ text: "green", classes: "text-green-400" });
  });

  it("should handle bright colors (90-97)", () => {
    const result = parseAnsi("\x1b[91mbright red\x1b[0m");
    expect(result[0].classes).toBe("text-red-300");
  });

  it("should handle empty input", () => {
    const result = parseAnsi("");
    expect(result).toEqual([]);
  });

  it("should handle italic and underline", () => {
    const result = parseAnsi("\x1b[3mitalic\x1b[0m \x1b[4munderline\x1b[0m");
    expect(result[0].classes).toBe("italic");
    expect(result[2].classes).toBe("underline");
  });

  it("should handle dim text", () => {
    const result = parseAnsi("\x1b[2mdim\x1b[0m");
    expect(result[0].classes).toBe("opacity-60");
  });
});

describe("colorizeLog", () => {
  it("should use ANSI parsing when ANSI codes present", () => {
    const result = colorizeLog("\x1b[32mDone\x1b[0m");
    expect(result[0].classes).toContain("text-green");
  });

  it("should color error lines red", () => {
    expect(colorizeLog("Error: something failed")[0].classes).toBe("text-red-400");
    expect(colorizeLog("error in module")[0].classes).toBe("text-red-400");
    expect(colorizeLog("ERR! bad thing")[0].classes).toBe("text-red-400");
  });

  it("should color warning lines yellow", () => {
    expect(colorizeLog("warning: deprecated")[0].classes).toBe("text-yellow-400");
    expect(colorizeLog("WARN something")[0].classes).toBe("text-yellow-400");
    expect(colorizeLog("warn: check this")[0].classes).toBe("text-yellow-400");
  });

  it("should color success lines green", () => {
    expect(colorizeLog("success: built")[0].classes).toBe("text-green-400");
    expect(colorizeLog("✓ passed")[0].classes).toBe("text-green-400");
    expect(colorizeLog("done in 2s")[0].classes).toBe("text-green-400");
    expect(colorizeLog("ready - started")[0].classes).toBe("text-green-400");
  });

  it("should color info/localhost lines cyan", () => {
    expect(colorizeLog("info: listening")[0].classes).toBe("text-cyan-400");
    expect(colorizeLog("➜ Local: http://localhost:4321")[0].classes).toBe("text-cyan-400");
    expect(colorizeLog("server at localhost:3000")[0].classes).toBe("text-cyan-400");
  });

  it("should split timestamp-prefixed lines", () => {
    const result = colorizeLog("9:45 Building...");
    expect(result).toHaveLength(2);
    expect(result[0].classes).toBe("text-gray-500");
    expect(result[1].text).toContain("Building...");
  });

  it("should return plain text for unrecognized patterns", () => {
    const result = colorizeLog("just some output");
    expect(result).toEqual([{ text: "just some output", classes: "" }]);
  });

  it("should handle empty string", () => {
    const result = colorizeLog("");
    expect(result).toEqual([{ text: "", classes: "" }]);
  });
});
