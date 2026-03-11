export function serializeYamlValue(value: unknown, indent = ""): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value.map((v) => `${indent}- ${serializeYamlValue(v, indent + "  ")}`).join("\n");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => {
        const serialized = serializeYamlValue(v, indent + "  ");
        if (typeof v === "object" && v !== null && !Array.isArray(v)) {
          return `${indent}${k}:\n${serialized}`;
        }
        if (Array.isArray(v) && v.length > 0) {
          return `${indent}${k}:\n${serialized}`;
        }
        return `${indent}${k}: ${serialized}`;
      })
      .join("\n");
  }
  const str = String(value);
  if (str.includes("\n") || str.includes(": ") || str.includes("#") || /^[{[]/.test(str)) {
    return `"${str.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return str;
}

export function buildFileContent(
  frontmatter: Record<string, unknown>,
  body: string
): string {
  const keys = Object.keys(frontmatter);
  if (keys.length === 0) return body;
  const yaml = serializeYamlValue(frontmatter);
  return `---\n${yaml}\n---\n${body}`;
}
