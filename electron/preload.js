// ============================================================
// Creative Suite - Electron Preload Script
// ============================================================

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // File dialogs
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  
  // Menu events
  onMenuSaveExport: (callback) => ipcRenderer.on('menu-save-export', callback),
  onSwitchTool: (callback) => ipcRenderer.on('switch-tool', callback),
  onOpenFile: (callback) => ipcRenderer.on('open-file', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
