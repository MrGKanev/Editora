import path from "node:path";

/**
 * Validates that a resolved file path is within the allowed base directory.
 * Prevents path traversal attacks (e.g. ../../etc/passwd).
 */
export function ensureWithinDir(basePath: string, filePath: string): string {
  const resolved = path.resolve(basePath, filePath);
  const normalizedBase = path.resolve(basePath);
  if (!resolved.startsWith(normalizedBase + path.sep) && resolved !== normalizedBase) {
    throw new Error("Access denied: path is outside the project directory");
  }
  return resolved;
}

/**
 * Validates that an absolute file path is within the allowed base directory.
 */
export function validatePathWithin(basePath: string, absolutePath: string): void {
  const normalizedBase = path.resolve(basePath);
  const normalizedPath = path.resolve(absolutePath);
  if (!normalizedPath.startsWith(normalizedBase + path.sep) && normalizedPath !== normalizedBase) {
    throw new Error("Access denied: path is outside the project directory");
  }
}
