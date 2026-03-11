export function isHtmlHeavy(content: string): boolean {
  const trimmed = content.trim();
  if (/^<[a-z][\s\S]*>/i.test(trimmed)) return true;
  const tagCount = (trimmed.match(/<\/?[a-z][^>]*>/gi) || []).length;
  const lineCount = trimmed.split("\n").length;
  return tagCount > lineCount * 0.3;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_.]/g, "");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
