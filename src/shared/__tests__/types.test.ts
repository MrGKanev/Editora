import { describe, it, expect } from "vitest";
import { IPC } from "../types";

describe("IPC Channels", () => {
  it("should define all project channels", () => {
    expect(IPC.PROJECT_OPEN).toBe("project:open");
    expect(IPC.PROJECT_CLONE).toBe("project:clone");
    expect(IPC.PROJECT_GET_RECENT).toBe("project:get-recent");
    expect(IPC.PROJECT_VALIDATE).toBe("project:validate");
  });

  it("should define all collection channels", () => {
    expect(IPC.COLLECTION_LIST).toBe("collection:list");
    expect(IPC.COLLECTION_GET_FILES).toBe("collection:get-files");
  });

  it("should define all content channels", () => {
    expect(IPC.CONTENT_READ).toBe("content:read");
    expect(IPC.CONTENT_WRITE).toBe("content:write");
    expect(IPC.CONTENT_CREATE).toBe("content:create");
    expect(IPC.CONTENT_DELETE).toBe("content:delete");
  });

  it("should define all media channels", () => {
    expect(IPC.MEDIA_LIST).toBe("media:list");
    expect(IPC.MEDIA_UPLOAD).toBe("media:upload");
    expect(IPC.MEDIA_DELETE).toBe("media:delete");
    expect(IPC.MEDIA_GET_PATH).toBe("media:get-path");
  });

  it("should define all git channels", () => {
    expect(IPC.GIT_STATUS).toBe("git:status");
    expect(IPC.GIT_COMMIT).toBe("git:commit");
    expect(IPC.GIT_PUSH).toBe("git:push");
    expect(IPC.GIT_PULL).toBe("git:pull");
    expect(IPC.GIT_BRANCHES).toBe("git:branches");
    expect(IPC.GIT_CHECKOUT).toBe("git:checkout");
  });

  it("should define all server channels", () => {
    expect(IPC.SERVER_START).toBe("server:start");
    expect(IPC.SERVER_STOP).toBe("server:stop");
    expect(IPC.SERVER_STATUS).toBe("server:status");
    expect(IPC.SERVER_LOG).toBe("server:log");
  });

  it("should have unique channel values", () => {
    const values = Object.values(IPC);
    expect(new Set(values).size).toBe(values.length);
  });

  it("should follow namespace:action pattern", () => {
    for (const value of Object.values(IPC)) {
      expect(value).toMatch(/^[a-z]+:[a-z-]+$/);
    }
  });
});
