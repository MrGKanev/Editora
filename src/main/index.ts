import { app, BrowserWindow, Menu, protocol, net, shell, ipcMain } from "electron";
import path from "node:path";
import { registerProjectHandlers } from "./ipc/project";
import { registerContentHandlers } from "./ipc/content";
import { registerMediaHandlers } from "./ipc/media";
import { registerGitHandlers } from "./ipc/git";
import { registerServerHandlers } from "./ipc/server";
import { registerLinkHandlers } from "./ipc/links";
import { createAppMenu } from "./menu";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

// Register custom protocol for local file access (media images)
protocol.registerSchemesAsPrivileged([
  {
    scheme: "local-file",
    privileges: {
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true,
    },
  },
]);

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: "Editora",
    icon: path.join(__dirname, "../../assets/icons/icon.png"),
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    backgroundColor: "#1e1e2e",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Load the renderer
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open DevTools in development
  if (process.env.NODE_ENV === "development" || MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
  }

  // Prevent navigation - open external links in browser instead
  mainWindow.webContents.on("will-navigate", (event, url) => {
    // Allow dev server reload
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL && url.startsWith(MAIN_WINDOW_VITE_DEV_SERVER_URL)) {
      return;
    }
    event.preventDefault();
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

// Register all IPC handlers
const registerAllHandlers = () => {
  registerProjectHandlers();
  registerContentHandlers();
  registerMediaHandlers();
  registerGitHandlers();
  registerServerHandlers();
  registerLinkHandlers();

  ipcMain.handle("shell:show-item-in-folder", (_event, filePath: string) => {
    shell.showItemInFolder(filePath);
  });
};

app.whenReady().then(() => {
  // Handle local-file:// protocol for serving media images
  protocol.handle("local-file", (request) => {
    const filePath = decodeURIComponent(request.url.replace("local-file://", ""));
    return net.fetch(`file://${filePath}`);
  });

  registerAllHandlers();
  Menu.setApplicationMenu(createAppMenu());
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Vite HMR declarations
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

export { mainWindow };
