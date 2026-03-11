import { contextBridge, ipcRenderer } from "electron";
import { IPC } from "../shared/types";

const api = {
  // Project
  openProject: () => ipcRenderer.invoke(IPC.PROJECT_OPEN),
  cloneProject: (url: string, dest: string) =>
    ipcRenderer.invoke(IPC.PROJECT_CLONE, url, dest),
  getRecentProjects: () => ipcRenderer.invoke(IPC.PROJECT_GET_RECENT),
  validateProject: (path: string) =>
    ipcRenderer.invoke(IPC.PROJECT_VALIDATE, path),

  // Collections
  listCollections: (projectPath: string, ssgId?: string) =>
    ipcRenderer.invoke(IPC.COLLECTION_LIST, projectPath, ssgId),
  getCollectionFiles: (collectionPath: string) =>
    ipcRenderer.invoke(IPC.COLLECTION_GET_FILES, collectionPath),

  // Content
  readContent: (filePath: string) =>
    ipcRenderer.invoke(IPC.CONTENT_READ, filePath),
  writeContent: (filePath: string, content: string) =>
    ipcRenderer.invoke(IPC.CONTENT_WRITE, filePath, content),
  createContent: (
    collectionPath: string,
    fileName: string,
    content: string
  ) => ipcRenderer.invoke(IPC.CONTENT_CREATE, collectionPath, fileName, content),
  deleteContent: (filePath: string) =>
    ipcRenderer.invoke(IPC.CONTENT_DELETE, filePath),
  renameContent: (oldPath: string, newName: string) =>
    ipcRenderer.invoke(IPC.CONTENT_RENAME, oldPath, newName),
  duplicateContent: (filePath: string) =>
    ipcRenderer.invoke(IPC.CONTENT_DUPLICATE, filePath),

  // Media
  listMedia: (projectPath: string, ssgId?: string) =>
    ipcRenderer.invoke(IPC.MEDIA_LIST, projectPath, ssgId),
  uploadMedia: (projectPath: string, filePaths: string[]) =>
    ipcRenderer.invoke(IPC.MEDIA_UPLOAD, projectPath, filePaths),
  deleteMedia: (filePath: string) =>
    ipcRenderer.invoke(IPC.MEDIA_DELETE, filePath),
  getMediaPath: (filePath: string) =>
    ipcRenderer.invoke(IPC.MEDIA_GET_PATH, filePath),
  getImageInfo: (filePaths: string[]) =>
    ipcRenderer.invoke(IPC.MEDIA_IMAGE_INFO, filePaths),
  optimizeUpload: (
    projectPath: string,
    filePaths: string[],
    options: { maxWidth: number; quality: number; convertToWebP: boolean } | null
  ) => ipcRenderer.invoke(IPC.MEDIA_OPTIMIZE_UPLOAD, projectPath, filePaths, options),

  // Git
  gitStatus: (projectPath: string) =>
    ipcRenderer.invoke(IPC.GIT_STATUS, projectPath),
  gitCommit: (projectPath: string, message: string) =>
    ipcRenderer.invoke(IPC.GIT_COMMIT, projectPath, message),
  gitPush: (projectPath: string) =>
    ipcRenderer.invoke(IPC.GIT_PUSH, projectPath),
  gitPull: (projectPath: string) =>
    ipcRenderer.invoke(IPC.GIT_PULL, projectPath),
  gitBranches: (projectPath: string) =>
    ipcRenderer.invoke(IPC.GIT_BRANCHES, projectPath),
  gitCheckout: (projectPath: string, branch: string) =>
    ipcRenderer.invoke(IPC.GIT_CHECKOUT, projectPath, branch),
  gitRemoteUrl: (projectPath: string) =>
    ipcRenderer.invoke(IPC.GIT_REMOTE_URL, projectPath),

  // Export
  exportHTML: (filePath: string) =>
    ipcRenderer.invoke(IPC.EXPORT_HTML, filePath),
  exportPDF: (filePath: string) =>
    ipcRenderer.invoke(IPC.EXPORT_PDF, filePath),

  // Links
  checkLinks: (content: string, filePath: string, projectPath: string) =>
    ipcRenderer.invoke(IPC.LINKS_CHECK, { content, filePath, projectPath }),

  // Dev Server
  serverStart: (projectPath: string, ssgId?: string) =>
    ipcRenderer.invoke(IPC.SERVER_START, projectPath, ssgId),
  serverStop: () => ipcRenderer.invoke(IPC.SERVER_STOP),
  serverStatus: () => ipcRenderer.invoke(IPC.SERVER_STATUS),
  onServerLog: (callback: (log: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, log: string) =>
      callback(log);
    ipcRenderer.on(IPC.SERVER_LOG, handler);
    return () => ipcRenderer.removeListener(IPC.SERVER_LOG, handler);
  },

  // Menu events
  onMenuEvent: (
    channel: string,
    callback: (...args: unknown[]) => void
  ) => {
    const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
      callback(...args);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },

  // Shell
  showItemInFolder: (filePath: string) =>
    ipcRenderer.invoke("shell:show-item-in-folder", filePath),
};

contextBridge.exposeInMainWorld("editora", api);

export type EditoraAPI = typeof api;
