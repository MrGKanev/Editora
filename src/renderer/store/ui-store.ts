import { create } from "zustand";
import { DevServerState, GitStatus } from "../../shared/types";

type Panel = "collections" | "media" | "git" | "preview";

interface UIState {
  activePanel: Panel;
  sidebarWidth: number;
  showPreview: boolean;
  devServer: DevServerState;
  gitStatus: GitStatus | null;
  serverLogs: string[];

  setActivePanel: (panel: Panel) => void;
  setSidebarWidth: (width: number) => void;
  togglePreview: () => void;
  setDevServer: (state: DevServerState) => void;
  setGitStatus: (status: GitStatus | null) => void;
  addServerLog: (log: string) => void;
  clearServerLogs: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activePanel: "collections",
  sidebarWidth: 260,
  showPreview: true,
  devServer: { status: "stopped" },
  gitStatus: null,
  serverLogs: [],

  setActivePanel: (activePanel) => set({ activePanel }),
  setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
  togglePreview: () => set((s) => ({ showPreview: !s.showPreview })),
  setDevServer: (devServer) => set({ devServer }),
  setGitStatus: (gitStatus) => set({ gitStatus }),
  addServerLog: (log) =>
    set((s) => ({ serverLogs: [...s.serverLogs.slice(-200), log] })),
  clearServerLogs: () => set({ serverLogs: [] }),
}));
