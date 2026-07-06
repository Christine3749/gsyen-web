const { Menu, Tray, nativeImage } = require('electron');
const path = require('path');

function createTray({ app, isDev, onQuit, showWindow }) {
  const iconPath = isDev
    ? path.join(__dirname, '../public/icon.ico')
    : path.join(process.resourcesPath, 'icon.ico');

  let icon = null;
  try {
    const raw = nativeImage.createFromPath(iconPath);
    icon = raw.isEmpty() ? null : raw.resize({ width: 16, height: 16 });
  } catch {
    icon = null;
  }

  if (!icon || icon.isEmpty()) return null;

  const tray = new Tray(icon);
  tray.setToolTip('GSYEN');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show GSYEN', click: showWindow },
    { type: 'separator' },
    { label: 'Quit', click: onQuit },
  ]));
  tray.on('double-click', showWindow);
  app.on('before-quit', () => tray.destroy());
  return tray;
}

module.exports = { createTray };
