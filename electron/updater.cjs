const { autoUpdater } = require('electron-updater');

let wired = false;
let getWindow = () => null;

function send(channel, payload) {
  const win = getWindow();
  if (!win || win.isDestroyed()) return;
  win.webContents.send(channel, payload);
}

function setupAutoUpdater(resolveWindow) {
  getWindow = resolveWindow;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  if (wired) return;
  wired = true;

  autoUpdater.on('update-available', info => send('updater:available', info));
  autoUpdater.on('update-not-available', () => send('updater:not-available'));
  autoUpdater.on('download-progress', progress => send('updater:progress', progress));
  autoUpdater.on('update-downloaded', info => send('updater:downloaded', info));
  autoUpdater.on('error', err => send('updater:error', err?.message ?? String(err)));

  setTimeout(() => autoUpdater.checkForUpdates().catch(err => {
    console.error('[updater] checkForUpdates failed:', err?.message ?? err);
    send('updater:error', err?.message ?? String(err));
  }), 5000);
}

function registerUpdaterIpc(ipcMain) {
  ipcMain.handle('updater:install', () => autoUpdater.quitAndInstall(true, true));
  ipcMain.handle('updater:check', () => autoUpdater.checkForUpdates());
}

module.exports = { registerUpdaterIpc, setupAutoUpdater };
