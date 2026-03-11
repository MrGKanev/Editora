import { ipcMain, BrowserWindow } from "electron";
import { IPC } from "../../shared/types";
import { DevServerService } from "../services/dev-server";

const devServer = new DevServerService();

export function registerServerHandlers() {
  ipcMain.handle(IPC.SERVER_START, async (_event, projectPath: string, ssgId?: string) => {
    const win = BrowserWindow.getFocusedWindow();
    const onLog = (log: string) => {
      win?.webContents.send(IPC.SERVER_LOG, log);
    };
    return devServer.start(projectPath, onLog, ssgId);
  });

  ipcMain.handle(IPC.SERVER_STOP, async () => {
    return devServer.stop();
  });

  ipcMain.handle(IPC.SERVER_STATUS, async () => {
    return devServer.getState();
  });
}
