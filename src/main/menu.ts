import { Menu, app, dialog, BrowserWindow, shell } from "electron";

function sendToRenderer(channel: string, ...args: unknown[]) {
  const win = BrowserWindow.getFocusedWindow();
  win?.webContents.send(channel, ...args);
}

export function createAppMenu(): Menu {
  const isMac = process.platform === "darwin";

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "New File",
          accelerator: "CmdOrCtrl+N",
          click: () => sendToRenderer("menu:new-file"),
        },
        { type: "separator" },
        {
          label: "Open Project...",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;
            const result = await dialog.showOpenDialog(win, {
              properties: ["openDirectory"],
              title: "Open Project",
            });
            if (!result.canceled && result.filePaths[0]) {
              win.webContents.send("menu:open-project", result.filePaths[0]);
            }
          },
        },
        { type: "separator" },
        {
          label: "Save",
          accelerator: "CmdOrCtrl+S",
          click: () => sendToRenderer("menu:save"),
        },
        {
          label: "Save As...",
          accelerator: "CmdOrCtrl+Shift+S",
          click: async () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;
            const result = await dialog.showSaveDialog(win, {
              title: "Save As",
              filters: [
                { name: "Markdown", extensions: ["md", "mdx"] },
                { name: "HTML", extensions: ["html", "htm"] },
                { name: "All Files", extensions: ["*"] },
              ],
            });
            if (!result.canceled && result.filePath) {
              win.webContents.send("menu:save-as", result.filePath);
            }
          },
        },
        { type: "separator" },
        {
          label: "Export As HTML...",
          click: async () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;
            const result = await dialog.showSaveDialog(win, {
              title: "Export as HTML",
              filters: [{ name: "HTML", extensions: ["html"] }],
            });
            if (!result.canceled && result.filePath) {
              win.webContents.send("menu:export-html", result.filePath);
            }
          },
        },
        { type: "separator" },
        {
          label: "Reveal in Finder",
          accelerator: "CmdOrCtrl+Shift+R",
          click: () => sendToRenderer("menu:reveal-file"),
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "pasteAndMatchStyle" },
        { role: "delete" },
        { type: "separator" },
        { role: "selectAll" },
        { type: "separator" },
        {
          label: "Find...",
          accelerator: "CmdOrCtrl+F",
          click: () => sendToRenderer("menu:find"),
        },
        {
          label: "Find and Replace...",
          accelerator: "CmdOrCtrl+H",
          click: () => sendToRenderer("menu:find-replace"),
        },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Toggle Preview",
          accelerator: "CmdOrCtrl+P",
          click: () => sendToRenderer("menu:toggle-preview"),
        },
        {
          label: "Toggle Sidebar",
          accelerator: "CmdOrCtrl+B",
          click: () => sendToRenderer("menu:toggle-sidebar"),
        },
        {
          label: "Toggle Terminal",
          accelerator: "CmdOrCtrl+`",
          click: () => sendToRenderer("menu:toggle-terminal"),
        },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
        { type: "separator" },
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [
              { type: "separator" as const },
              { role: "front" as const },
            ]
          : [{ role: "close" as const }]),
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Documentation",
          click: () => {
            shell.openExternal("https://github.com/MrGKanev/Editora#readme");
          },
        },
        {
          label: "Report Issue",
          click: () => {
            shell.openExternal("https://github.com/MrGKanev/Editora/issues");
          },
        },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}
