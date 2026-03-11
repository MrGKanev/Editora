import { create } from "zustand";
import { DevServerState, GitStatus } from "../../shared/types";

type Panel = "collections" | "media" | "git" | "preview";

interface UIState {
  activePanel: Panel;
  sidebarWidth: number;
  showSidebar: boolean;
  showPreview: boolean;
  showTerminal: boolean;
  terminalHeight: number;
  devServer: DevServerState;
  gitStatus: GitStatus | null;
  serverLogs: string[];

  setActivePanel: (panel: Panel) => void;
  setSidebarWidth: (width: number) => void;
  toggleSidebar: () => void;
  togglePreview: () => void;
  toggleTerminal: () => void;
  setTerminalHeight: (height: number) => void;
  setDevServer: (state: DevServerState) => void;
  setGitStatus: (status: GitStatus | null) => void;
  addServerLog: (log: string) => void;
  clearServerLogs: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activePanel: "collections",
  sidebarWidth: 260,
  showSidebar: true,
  showPreview: true,
  showTerminal: false,
  terminalHeight: 200,
  devServer: { status: "stopped" },
  gitStatus: null,
  serverLogs: [],

  setActivePanel: (activePanel) => set({ activePanel }),
  setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
  toggleSidebar: () => set((s) => ({ showSidebar: !s.showSidebar })),
  togglePreview: () => set((s) => ({ showPreview: !s.showPreview })),
  toggleTerminal: () => set((s) => ({ showTerminal: !s.showTerminal })),
  setTerminalHeight: (terminalHeight) => set({ terminalHeight }),
  setDevServer: (devServer) => set({ devServer }),
  setGitStatus: (gitStatus) => set({ gitStatus }),
  addServerLog: (log) =>
    set((s) => ({ serverLogs: [...s.serverLogs.slice(-500), log] })),
  clearServerLogs: () => set({ serverLogs: [] }),
}));
