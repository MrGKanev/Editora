import { create } from "zustand";
import { ContentFile } from "../../shared/types";

interface EditorState {
  currentFile: ContentFile | null;
  originalContent: string;
  editorContent: string;
  frontmatter: Record<string, unknown>;
  isDirty: boolean;
  isSaving: boolean;

  openFile: (filePath: string) => Promise<void>;
  setEditorContent: (content: string) => void;
  setFrontmatter: (frontmatter: Record<string, unknown>) => void;
  updateFrontmatterField: (key: string, value: unknown) => void;
  save: () => Promise<void>;
  closeFile: () => void;
}

function serializeYamlValue(value: unknown, indent = ""): string {
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

function buildFileContent(
  frontmatter: Record<string, unknown>,
  body: string
): string {
  const keys = Object.keys(frontmatter);
  if (keys.length === 0) return body;
  const yaml = serializeYamlValue(frontmatter);
  return `---\n${yaml}\n---\n${body}`;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  currentFile: null,
  originalContent: "",
  editorContent: "",
  frontmatter: {},
  isDirty: false,
  isSaving: false,

  openFile: async (filePath: string) => {
    try {
      const file = await window.editora.readContent(filePath);
      const fullContent = buildFileContent(file.frontmatter, file.body);
      set({
        currentFile: file,
        originalContent: fullContent,
        editorContent: file.body,
        frontmatter: file.frontmatter,
        isDirty: false,
      });
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  },

  setEditorContent: (content: string) => {
    set((state) => ({
      editorContent: content,
      isDirty:
        content !== state.currentFile?.body ||
        JSON.stringify(state.frontmatter) !==
          JSON.stringify(state.currentFile?.frontmatter),
    }));
  },

  setFrontmatter: (frontmatter) => {
    set((state) => ({
      frontmatter,
      isDirty:
        state.editorContent !== state.currentFile?.body ||
        JSON.stringify(frontmatter) !==
          JSON.stringify(state.currentFile?.frontmatter),
    }));
  },

  updateFrontmatterField: (key, value) => {
    const current = get().frontmatter;
    get().setFrontmatter({ ...current, [key]: value });
  },

  save: async () => {
    const { currentFile, frontmatter, editorContent } = get();
    if (!currentFile) return;

    set({ isSaving: true });
    try {
      const content = buildFileContent(frontmatter, editorContent);
      await window.editora.writeContent(currentFile.path, content);
      set({
        isDirty: false,
        originalContent: content,
        currentFile: {
          ...currentFile,
          frontmatter,
          body: editorContent,
        },
      });
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      set({ isSaving: false });
    }
  },

  closeFile: () => {
    set({
      currentFile: null,
      originalContent: "",
      editorContent: "",
      frontmatter: {},
      isDirty: false,
    });
  },
}));
