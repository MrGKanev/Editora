import { create } from "zustand";
import { ContentFile } from "../../shared/types";
import { buildFileContent } from "../utils/yaml";

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
