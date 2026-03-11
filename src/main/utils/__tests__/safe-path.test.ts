import { describe, it, expect } from "vitest";
import path from "node:path";
import { ensureWithinDir, validatePathWithin } from "../safe-path";

describe("ensureWithinDir", () => {
  const base = "/projects/my-site";

  it("should allow paths within the base directory", () => {
    expect(ensureWithinDir(base, "post.md")).toBe(path.resolve(base, "post.md"));
    expect(ensureWithinDir(base, "sub/post.md")).toBe(path.resolve(base, "sub/post.md"));
  });

  it("should block path traversal with ../", () => {
    expect(() => ensureWithinDir(base, "../../../etc/passwd")).toThrow("outside the project");
    expect(() => ensureWithinDir(base, "../../secret.txt")).toThrow("outside the project");
  });

  it("should block path traversal with absolute paths", () => {
    expect(() => ensureWithinDir(base, "/etc/passwd")).toThrow("outside the project");
  });

  it("should allow the base directory itself", () => {
    expect(ensureWithinDir(base, ".")).toBe(path.resolve(base));
  });

  it("should normalize paths with ./ prefix", () => {
    expect(ensureWithinDir(base, "./post.md")).toBe(path.resolve(base, "post.md"));
  });
});

describe("validatePathWithin", () => {
  const base = "/projects/my-site";

  it("should not throw for valid paths", () => {
    expect(() => validatePathWithin(base, path.join(base, "file.md"))).not.toThrow();
    expect(() => validatePathWithin(base, path.join(base, "sub", "file.md"))).not.toThrow();
  });

  it("should throw for paths outside base", () => {
    expect(() => validatePathWithin(base, "/etc/passwd")).toThrow("outside the project");
    expect(() => validatePathWithin(base, "/projects/other-site/file.md")).toThrow("outside the project");
  });

  it("should allow the base directory itself", () => {
    expect(() => validatePathWithin(base, base)).not.toThrow();
  });
});
