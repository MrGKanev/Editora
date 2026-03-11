import { ipcMain } from "electron";
import { IPC, GitStatus } from "../../shared/types";
import { GitService } from "../services/git-service";

const gitService = new GitService();

export function registerGitHandlers() {
  ipcMain.handle(
    IPC.GIT_STATUS,
    async (_event, projectPath: string): Promise<GitStatus> => {
      return gitService.getStatus(projectPath);
    }
  );

  ipcMain.handle(
    IPC.GIT_COMMIT,
    async (_event, projectPath: string, message: string) => {
      return gitService.commit(projectPath, message);
    }
  );

  ipcMain.handle(IPC.GIT_PUSH, async (_event, projectPath: string) => {
    return gitService.push(projectPath);
  });

  ipcMain.handle(IPC.GIT_PULL, async (_event, projectPath: string) => {
    return gitService.pull(projectPath);
  });

  ipcMain.handle(
    IPC.GIT_BRANCHES,
    async (_event, projectPath: string): Promise<string[]> => {
      return gitService.getBranches(projectPath);
    }
  );

  ipcMain.handle(
    IPC.GIT_CHECKOUT,
    async (_event, projectPath: string, branch: string) => {
      return gitService.checkout(projectPath, branch);
    }
  );

  ipcMain.handle(
    IPC.GIT_REMOTE_URL,
    async (_event, projectPath: string): Promise<string | null> => {
      return gitService.getRemoteUrl(projectPath);
    }
  );
}
