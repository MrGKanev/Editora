import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../ui-store";

describe("UIStore", () => {
  beforeEach(() => {
    // Reset store to defaults
    useUIStore.setState({
      activePanel: "collections",
      sidebarWidth: 260,
      showPreview: true,
      showTerminal: false,
      terminalHeight: 200,
      devServer: { status: "stopped" },
      gitStatus: null,
      serverLogs: [],
    });
  });

  describe("initial state", () => {
    it("should have correct defaults", () => {
      const state = useUIStore.getState();
      expect(state.activePanel).toBe("collections");
      expect(state.sidebarWidth).toBe(260);
      expect(state.showPreview).toBe(true);
      expect(state.showTerminal).toBe(false);
      expect(state.terminalHeight).toBe(200);
      expect(state.devServer.status).toBe("stopped");
      expect(state.gitStatus).toBeNull();
      expect(state.serverLogs).toEqual([]);
    });
  });

  describe("setActivePanel", () => {
    it("should change active panel", () => {
      useUIStore.getState().setActivePanel("media");
      expect(useUIStore.getState().activePanel).toBe("media");
    });

    it("should accept all panel types", () => {
      const panels = ["collections", "media", "git", "preview"] as const;
      for (const panel of panels) {
        useUIStore.getState().setActivePanel(panel);
        expect(useUIStore.getState().activePanel).toBe(panel);
      }
    });
  });

  describe("togglePreview", () => {
    it("should toggle from true to false", () => {
      useUIStore.getState().togglePreview();
      expect(useUIStore.getState().showPreview).toBe(false);
    });

    it("should toggle from false to true", () => {
      useUIStore.getState().togglePreview();
      useUIStore.getState().togglePreview();
      expect(useUIStore.getState().showPreview).toBe(true);
    });
  });

  describe("toggleTerminal", () => {
    it("should toggle from false to true", () => {
      useUIStore.getState().toggleTerminal();
      expect(useUIStore.getState().showTerminal).toBe(true);
    });

    it("should toggle from true to false", () => {
      useUIStore.getState().toggleTerminal();
      useUIStore.getState().toggleTerminal();
      expect(useUIStore.getState().showTerminal).toBe(false);
    });
  });

  describe("setSidebarWidth", () => {
    it("should update sidebar width", () => {
      useUIStore.getState().setSidebarWidth(300);
      expect(useUIStore.getState().sidebarWidth).toBe(300);
    });
  });

  describe("setTerminalHeight", () => {
    it("should update terminal height", () => {
      useUIStore.getState().setTerminalHeight(400);
      expect(useUIStore.getState().terminalHeight).toBe(400);
    });
  });

  describe("setDevServer", () => {
    it("should update dev server state", () => {
      useUIStore.getState().setDevServer({ status: "running", url: "http://localhost:4321", port: 4321 });
      const state = useUIStore.getState();
      expect(state.devServer.status).toBe("running");
      expect(state.devServer.url).toBe("http://localhost:4321");
      expect(state.devServer.port).toBe(4321);
    });

    it("should handle error state", () => {
      useUIStore.getState().setDevServer({ status: "error", error: "Failed to start" });
      expect(useUIStore.getState().devServer.status).toBe("error");
      expect(useUIStore.getState().devServer.error).toBe("Failed to start");
    });
  });

  describe("setGitStatus", () => {
    it("should update git status", () => {
      const gitStatus = {
        isRepo: true,
        branch: "main",
        ahead: 1,
        behind: 0,
        modified: ["file.txt"],
        staged: [],
        untracked: ["new.txt"],
      };
      useUIStore.getState().setGitStatus(gitStatus);
      expect(useUIStore.getState().gitStatus).toEqual(gitStatus);
    });

    it("should accept null to clear status", () => {
      useUIStore.getState().setGitStatus(null);
      expect(useUIStore.getState().gitStatus).toBeNull();
    });
  });

  describe("server logs", () => {
    it("should add a log entry", () => {
      useUIStore.getState().addServerLog("Starting server...");
      expect(useUIStore.getState().serverLogs).toEqual(["Starting server..."]);
    });

    it("should append multiple logs in order", () => {
      useUIStore.getState().addServerLog("Line 1");
      useUIStore.getState().addServerLog("Line 2");
      useUIStore.getState().addServerLog("Line 3");
      expect(useUIStore.getState().serverLogs).toEqual(["Line 1", "Line 2", "Line 3"]);
    });

    it("should limit logs to last 501 entries", () => {
      for (let i = 0; i < 510; i++) {
        useUIStore.getState().addServerLog(`Log ${i}`);
      }
      const logs = useUIStore.getState().serverLogs;
      expect(logs.length).toBeLessThanOrEqual(501);
      // Should contain the latest entry
      expect(logs[logs.length - 1]).toBe("Log 509");
    });

    it("should clear all logs", () => {
      useUIStore.getState().addServerLog("Log 1");
      useUIStore.getState().addServerLog("Log 2");
      useUIStore.getState().clearServerLogs();
      expect(useUIStore.getState().serverLogs).toEqual([]);
    });
  });
});
