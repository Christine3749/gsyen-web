const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs   = require('fs');

const isDev = process.env.NODE_ENV !== 'production';
const CANVAS_DIR = path.join(app.getPath('userData'), 'canvas');

// ── 自动更新 ──────────────────────────────────────────────────────────────────

function setupAutoUpdater(win) {
  autoUpdater.autoDownload    = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', info => {
    win.webContents.send('updater:available', info);
  });
  autoUpdater.on('update-not-available', () => {
    win.webContents.send('updater:not-available');
  });
  autoUpdater.on('download-progress', progress => {
    win.webContents.send('updater:progress', progress);
  });
  autoUpdater.on('update-downloaded', info => {
    win.webContents.send('updater:downloaded', info);
  });
  autoUpdater.on('error', err => {
    win.webContents.send('updater:error', err?.message ?? String(err));
  });

  // 启动 5 秒后检查（避免影响启动速度）
  setTimeout(() => autoUpdater.checkForUpdates(), 5000);
}

ipcMain.handle('updater:install', () => {
  autoUpdater.quitAndInstall(false, true);
});
ipcMain.handle('updater:check', () => {
  autoUpdater.checkForUpdates();
});

// ── 文件系统 IPC ──────────────────────────────────────────────────────────────

ipcMain.handle('canvas:readAll', () => {
  if (!fs.existsSync(CANVAS_DIR)) return [];
  return fs.readdirSync(CANVAS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(CANVAS_DIR, f), 'utf8')); }
      catch { return null; }
    })
    .filter(Boolean);
});

ipcMain.handle('canvas:write', (_e, id, data) => {
  if (!fs.existsSync(CANVAS_DIR)) fs.mkdirSync(CANVAS_DIR, { recursive: true });
  fs.writeFileSync(path.join(CANVAS_DIR, `${id}.json`), JSON.stringify(data, null, 2));
  return true;
});

ipcMain.handle('canvas:delete', (_e, id) => {
  const file = path.join(CANVAS_DIR, `${id}.json`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  return true;
});

ipcMain.handle('app:getPath', () => app.getPath('userData'));
ipcMain.handle('app:getVersion', () => app.getVersion());

// ── 窗口控制 IPC ──────────────────────────────────────────────────────────────

ipcMain.handle('window:minimize', (e) => {
  BrowserWindow.fromWebContents(e.sender)?.minimize();
});
ipcMain.handle('window:maximize', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win) return;
  win.isMaximized() ? win.unmaximize() : win.maximize();
});
ipcMain.handle('window:close', (e) => {
  BrowserWindow.fromWebContents(e.sender)?.close();
});

// ── 窗口 ──────────────────────────────────────────────────────────────────────

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#F9F8F6',
    icon: path.join(__dirname, '../public/icon.png'),
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
    setupAutoUpdater(win);
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
