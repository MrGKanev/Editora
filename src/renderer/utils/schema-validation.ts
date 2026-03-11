import { SchemaField } from "../../shared/types";

export interface ValidationError {
  field: string;
  message: string;
  type: "error" | "warning";
}

export function validateFrontmatter(
  frontmatter: Record<string, unknown>,
  schema: SchemaField[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of schema) {
    const value = frontmatter[field.name];

    // Required check
    if (field.required && (value === undefined || value === null || value === "")) {
      errors.push({
        field: field.name,
        message: "This field is required",
        type: "error",
      });
      continue;
    }

    // Skip type check if value is absent and not required
    if (value === undefined || value === null || value === "") continue;

    // Type check
    const typeError = checkType(value, field);
    if (typeError) {
      errors.push({
        field: field.name,
        message: typeError,
        type: "warning",
      });
    }

    // Enum check
    if (field.type === "enum" && field.options && field.options.length > 0) {
      if (!field.options.includes(String(value))) {
        errors.push({
          field: field.name,
          message: `Must be one of: ${field.options.join(", ")}`,
          type: "warning",
        });
      }
    }
  }

  return errors;
}

function checkType(value: unknown, field: SchemaField): string | null {
  switch (field.type) {
    case "string":
      if (typeof value !== "string") return `Expected text, got ${typeof value}`;
      break;
    case "number":
      if (typeof value !== "number" && isNaN(Number(value)))
        return "Expected a number";
      break;
    case "boolean":
      if (typeof value !== "boolean") return "Expected true/false";
      break;
    case "date":
      if (value instanceof Date) break;
      if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) break;
      return "Expected a date (YYYY-MM-DD)";
    case "array":
      if (!Array.isArray(value)) return "Expected a list";
      break;
    case "enum":
      // Handled separately above
      break;
  }
  return null;
}
