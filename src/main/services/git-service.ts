import simpleGit, { SimpleGit } from "simple-git";
import { GitStatus, GitCommitResult } from "../../shared/types";

export class GitService {
  private getGit(projectPath: string): SimpleGit {
    return simpleGit(projectPath);
  }

  async getStatus(projectPath: string): Promise<GitStatus> {
    const git = this.getGit(projectPath);

    try {
      const status = await git.status();
      const branch = status.current || "main";

      return {
        isRepo: true,
        branch,
        ahead: status.ahead,
        behind: status.behind,
        modified: status.modified,
        staged: status.staged,
        untracked: status.not_added,
      };
    } catch {
      return {
        isRepo: false,
        branch: "",
        ahead: 0,
        behind: 0,
        modified: [],
        staged: [],
        untracked: [],
      };
    }
  }

  async commit(
    projectPath: string,
    message: string
  ): Promise<GitCommitResult> {
    const git = this.getGit(projectPath);
    await git.add(".");
    const result = await git.commit(message);
    return {
      hash: result.commit || "",
      message,
    };
  }

  async push(projectPath: string): Promise<{ success: boolean }> {
    const git = this.getGit(projectPath);
    await git.push();
    return { success: true };
  }

  async pull(projectPath: string): Promise<{ success: boolean }> {
    const git = this.getGit(projectPath);
    await git.pull();
    return { success: true };
  }

  async getBranches(projectPath: string): Promise<string[]> {
    const git = this.getGit(projectPath);
    const result = await git.branchLocal();
    return result.all;
  }

  async checkout(
    projectPath: string,
    branch: string
  ): Promise<{ success: boolean }> {
    const git = this.getGit(projectPath);
    await git.checkout(branch);
    return { success: true };
  }

  async getRemoteUrl(projectPath: string): Promise<string | null> {
    const git = this.getGit(projectPath);
    try {
      const remotes = await git.getRemotes(true);
      const origin = remotes.find((r) => r.name === "origin");
      return origin?.refs?.push || origin?.refs?.fetch || null;
    } catch {
      return null;
    }
  }
}
