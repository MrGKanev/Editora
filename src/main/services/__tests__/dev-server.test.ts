import { describe, it, expect, beforeEach } from "vitest";
import { DevServerService } from "../dev-server";

describe("DevServerService", () => {
  let service: DevServerService;

  beforeEach(() => {
    service = new DevServerService();
  });

  describe("getState", () => {
    it("should start with stopped status", () => {
      const state = service.getState();
      expect(state.status).toBe("stopped");
      expect(state.url).toBeUndefined();
      expect(state.port).toBeUndefined();
      expect(state.error).toBeUndefined();
    });
  });

  describe("stop", () => {
    it("should return success when no server is running", async () => {
      const result = await service.stop();
      expect(result.success).toBe(true);
    });

    it("should set state to stopped", async () => {
      await service.stop();
      expect(service.getState().status).toBe("stopped");
    });
  });

  describe("start", () => {
    it("should return error state when no SSG is specified", async () => {
      const logs: string[] = [];
      const state = await service.start("/tmp/test-project", (log) => logs.push(log));

      expect(state.status).toBe("error");
      expect(state.error).toContain("No dev server command");
      expect(logs.length).toBeGreaterThan(0);
    });

    it("should return error for unknown SSG ID", async () => {
      const logs: string[] = [];
      const state = await service.start("/tmp/test-project", (log) => logs.push(log), "nonexistent");

      expect(state.status).toBe("error");
    });
  });
});
