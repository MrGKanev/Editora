import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { GitService } from "../git-service";

describe("GitService", () => {
  let service: GitService;
  let tmpDir: string;

  beforeEach(async () => {
    service = new GitService();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "editora-git-test-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  function initGitRepo() {
    execSync("git init", { cwd: tmpDir, stdio: "ignore" });
    execSync('git config user.email "test@test.com"', { cwd: tmpDir, stdio: "ignore" });
    execSync('git config user.name "Test"', { cwd: tmpDir, stdio: "ignore" });
  }

  describe("getStatus", () => {
    it("should return isRepo false for non-git directories", async () => {
      const status = await service.getStatus(tmpDir);
      expect(status.isRepo).toBe(false);
      expect(status.branch).toBe("");
      expect(status.modified).toEqual([]);
      expect(status.staged).toEqual([]);
      expect(status.untracked).toEqual([]);
    });

    it("should return isRepo true for git directories", async () => {
      initGitRepo();
      // Create initial commit so branch exists
      await fs.writeFile(path.join(tmpDir, "init.txt"), "init");
      execSync("git add . && git commit -m init", { cwd: tmpDir, stdio: "ignore" });

      const status = await service.getStatus(tmpDir);
      expect(status.isRepo).toBe(true);
      expect(status.branch).toBeTruthy();
    });

    it("should detect modified files", async () => {
      initGitRepo();
      await fs.writeFile(path.join(tmpDir, "file.txt"), "original");
      execSync("git add . && git commit -m init", { cwd: tmpDir, stdio: "ignore" });

      await fs.writeFile(path.join(tmpDir, "file.txt"), "modified");

      const status = await service.getStatus(tmpDir);
      expect(status.modified).toContain("file.txt");
    });

    it("should detect untracked files", async () => {
      initGitRepo();
      await fs.writeFile(path.join(tmpDir, "init.txt"), "init");
      execSync("git add . && git commit -m init", { cwd: tmpDir, stdio: "ignore" });

      await fs.writeFile(path.join(tmpDir, "new-file.txt"), "new");

      const status = await service.getStatus(tmpDir);
      expect(status.untracked).toContain("new-file.txt");
    });

    it("should report ahead/behind as 0 without remote", async () => {
      initGitRepo();
      await fs.writeFile(path.join(tmpDir, "file.txt"), "data");
      execSync("git add . && git commit -m init", { cwd: tmpDir, stdio: "ignore" });

      const status = await service.getStatus(tmpDir);
      expect(status.ahead).toBe(0);
      expect(status.behind).toBe(0);
    });
  });

  describe("commit", () => {
    it("should create a commit with given message", async () => {
      initGitRepo();
      await fs.writeFile(path.join(tmpDir, "file.txt"), "content");

      const result = await service.commit(tmpDir, "test commit");
      expect(result.hash).toBeTruthy();
      expect(result.message).toBe("test commit");

      // Verify commit exists
      const log = execSync("git log --oneline -1", { cwd: tmpDir, encoding: "utf-8" });
      expect(log).toContain("test commit");
    });

    it("should stage all files before committing", async () => {
      initGitRepo();
      await fs.writeFile(path.join(tmpDir, "a.txt"), "a");
      await fs.writeFile(path.join(tmpDir, "b.txt"), "b");

      await service.commit(tmpDir, "commit both");

      const log = execSync("git diff --name-only HEAD", { cwd: tmpDir, encoding: "utf-8" });
      expect(log.trim()).toBe("");
    });
  });

  describe("getBranches", () => {
    it("should list local branches", async () => {
      initGitRepo();
      await fs.writeFile(path.join(tmpDir, "file.txt"), "data");
      execSync("git add . && git commit -m init", { cwd: tmpDir, stdio: "ignore" });
      execSync("git branch feature", { cwd: tmpDir, stdio: "ignore" });

      const branches = await service.getBranches(tmpDir);
      expect(branches.length).toBeGreaterThanOrEqual(2);
      expect(branches).toContain("feature");
    });
  });

  describe("checkout", () => {
    it("should switch to specified branch", async () => {
      initGitRepo();
      await fs.writeFile(path.join(tmpDir, "file.txt"), "data");
      execSync("git add . && git commit -m init", { cwd: tmpDir, stdio: "ignore" });
      execSync("git branch feature", { cwd: tmpDir, stdio: "ignore" });

      const result = await service.checkout(tmpDir, "feature");
      expect(result.success).toBe(true);

      const currentBranch = execSync("git branch --show-current", {
        cwd: tmpDir,
        encoding: "utf-8",
      }).trim();
      expect(currentBranch).toBe("feature");
    });
  });
});
