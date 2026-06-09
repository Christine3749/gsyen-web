const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  canvas: {
    readAll: ()          => ipcRenderer.invoke('canvas:readAll'),
    write:   (id, data)  => ipcRenderer.invoke('canvas:write', id, data),
    delete:  (id)        => ipcRenderer.invoke('canvas:delete', id),
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close:    () => ipcRenderer.invoke('window:close'),
  },
  getAppPath: () => ipcRenderer.invoke('app:getPath'),
  isElectron: true,
});
