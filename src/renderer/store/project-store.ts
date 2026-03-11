import { create } from "zustand";
import { Project, ContentCollection } from "../../shared/types";

interface ProjectState {
  currentProject: Project | null;
  collections: ContentCollection[];
  isLoading: boolean;
  error: string | null;

  setProject: (project: Project | null) => void;
  setCollections: (collections: ContentCollection[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  openProject: () => Promise<void>;
  openProjectPath: (path: string) => Promise<void>;
  loadCollections: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  collections: [],
  isLoading: false,
  error: null,

  setProject: (project) => set({ currentProject: project, error: null }),
  setCollections: (collections) => set({ collections }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  openProject: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await window.editora.openProject();
      if (!result) {
        set({ isLoading: false });
        return;
      }
      if ("error" in result) {
        set({ error: result.error, isLoading: false });
        return;
      }
      set({ currentProject: result, isLoading: false });
      get().loadCollections();
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  openProjectPath: async (path: string) => {
    set({ isLoading: true, error: null });
    try {
      const isValid = await window.editora.validateProject(path);
      if (!isValid) {
        set({ error: "No supported static site project detected.", isLoading: false });
        return;
      }
      // Re-use openProject flow but with specific path
      const project: Project = {
        path,
        name: path.split("/").pop() || path,
        lastOpened: Date.now(),
        isGitRepo: false,
      };
      set({ currentProject: project, isLoading: false });
      get().loadCollections();
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  loadCollections: async () => {
    const project = get().currentProject;
    if (!project) return;
    try {
      const collections = await window.editora.listCollections(project.path, project.ssgId);
      set({ collections });
    } catch (err) {
      console.error("Failed to load collections:", err);
    }
  },
}));
