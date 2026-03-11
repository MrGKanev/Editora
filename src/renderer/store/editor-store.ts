import { create } from "zustand";
import { ContentFile } from "../../shared/types";
import { buildFileContent } from "../utils/yaml";

interface OpenTab {
  file: ContentFile;
  originalContent: string;
  editorContent: string;
  frontmatter: Record<string, unknown>;
  isDirty: boolean;
}

interface EditorState {
  tabs: OpenTab[];
  activeTabPath: string | null;

  // Derived from active tab
  currentFile: ContentFile | null;
  originalContent: string;
  editorContent: string;
  frontmatter: Record<string, unknown>;
  isDirty: boolean;
  isSaving: boolean;

  openFile: (filePath: string) => Promise<void>;
  closeTab: (filePath: string) => void;
  setActiveTab: (filePath: string) => void;
  setEditorContent: (content: string) => void;
  setFrontmatter: (frontmatter: Record<string, unknown>) => void;
  updateFrontmatterField: (key: string, value: unknown) => void;
  save: () => Promise<void>;
  closeFile: () => void;
}

function syncActiveTab(state: Partial<EditorState> & Pick<EditorState, "tabs" | "activeTabPath">): Partial<EditorState> {
  const tab = state.tabs.find((t) => t.file.path === state.activeTabPath);
  if (!tab) {
    return {
      ...state,
      currentFile: null,
      originalContent: "",
      editorContent: "",
      frontmatter: {},
      isDirty: false,
    };
  }
  return {
    ...state,
    currentFile: tab.file,
    originalContent: tab.originalContent,
    editorContent: tab.editorContent,
    frontmatter: tab.frontmatter,
    isDirty: tab.isDirty,
  };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabPath: null,
  currentFile: null,
  originalContent: "",
  editorContent: "",
  frontmatter: {},
  isDirty: false,
  isSaving: false,

  openFile: async (filePath: string) => {
    const { tabs } = get();
    const existing = tabs.find((t) => t.file.path === filePath);
    if (existing) {
      set(syncActiveTab({ tabs, activeTabPath: filePath }));
      return;
    }

    try {
      const file = await window.editora.readContent(filePath);
      const fullContent = buildFileContent(file.frontmatter, file.body);
      const newTab: OpenTab = {
        file,
        originalContent: fullContent,
        editorContent: file.body,
        frontmatter: file.frontmatter,
        isDirty: false,
      };
      const newTabs = [...tabs, newTab];
      set(syncActiveTab({ tabs: newTabs, activeTabPath: filePath }));
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  },

  closeTab: (filePath: string) => {
    const { tabs, activeTabPath } = get();
    const idx = tabs.findIndex((t) => t.file.path === filePath);
    if (idx === -1) return;

    const newTabs = tabs.filter((t) => t.file.path !== filePath);
    let newActive = activeTabPath;
    if (activeTabPath === filePath) {
      // Switch to adjacent tab
      if (newTabs.length === 0) {
        newActive = null;
      } else if (idx >= newTabs.length) {
        newActive = newTabs[newTabs.length - 1].file.path;
      } else {
        newActive = newTabs[idx].file.path;
      }
    }
    set(syncActiveTab({ tabs: newTabs, activeTabPath: newActive }));
  },

  setActiveTab: (filePath: string) => {
    const { tabs } = get();
    set(syncActiveTab({ tabs, activeTabPath: filePath }));
  },

  setEditorContent: (content: string) => {
    const { tabs, activeTabPath } = get();
    const newTabs = tabs.map((tab) => {
      if (tab.file.path !== activeTabPath) return tab;
      const isDirty =
        content !== tab.file.body ||
        JSON.stringify(tab.frontmatter) !== JSON.stringify(tab.file.frontmatter);
      return { ...tab, editorContent: content, isDirty };
    });
    set(syncActiveTab({ tabs: newTabs, activeTabPath }));
  },

  setFrontmatter: (frontmatter) => {
    const { tabs, activeTabPath } = get();
    const newTabs = tabs.map((tab) => {
      if (tab.file.path !== activeTabPath) return tab;
      const isDirty =
        tab.editorContent !== tab.file.body ||
        JSON.stringify(frontmatter) !== JSON.stringify(tab.file.frontmatter);
      return { ...tab, frontmatter, isDirty };
    });
    set(syncActiveTab({ tabs: newTabs, activeTabPath }));
  },

  updateFrontmatterField: (key, value) => {
    const current = get().frontmatter;
    get().setFrontmatter({ ...current, [key]: value });
  },

  save: async () => {
    const { currentFile, frontmatter, editorContent, tabs, activeTabPath } = get();
    if (!currentFile) return;

    set({ isSaving: true });
    try {
      const content = buildFileContent(frontmatter, editorContent);
      await window.editora.writeContent(currentFile.path, content);
      const updatedFile = { ...currentFile, frontmatter, body: editorContent };
      const newTabs = tabs.map((tab) => {
        if (tab.file.path !== activeTabPath) return tab;
        return {
          ...tab,
          isDirty: false,
          originalContent: content,
          file: updatedFile,
        };
      });
      set({
        ...syncActiveTab({ tabs: newTabs, activeTabPath }),
        isSaving: false,
      });
    } catch (err) {
      console.error("Failed to save:", err);
      set({ isSaving: false });
    }
  },

  closeFile: () => {
    set({
      tabs: [],
      activeTabPath: null,
      currentFile: null,
      originalContent: "",
      editorContent: "",
      frontmatter: {},
      isDirty: false,
    });
  },
}));
