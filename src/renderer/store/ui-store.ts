import { create } from "zustand";
import { DevServerState, GitStatus } from "../../shared/types";

type Panel = "collections" | "media" | "git" | "preview";
type Theme = "dark" | "light";

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
  focusMode: boolean;
  theme: Theme;

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
  toggleFocusMode: () => void;
  toggleTheme: () => void;
}

const getStoredTheme = (): Theme => {
  try {
    const stored = localStorage.getItem("editora-theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {}
  return "dark";
};

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
  focusMode: false,
  theme: getStoredTheme(),

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
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === "dark" ? "light" : "dark";
      try { localStorage.setItem("editora-theme", next); } catch {}
      return { theme: next };
    }),
}));
