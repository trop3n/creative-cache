// ============================================================
// Creative Suite - Electron Main Process
// ============================================================

const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');

// Development mode detection
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Keep global reference to window objects
let mainWindow = null;

// ============================================================
// Window Creation
// ============================================================

function createMainWindow() {
  // Create browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false, // Show when ready
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#0a0a0a'
  });

  // Load app
  if (isDev) {
    // Load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Load production build
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Set up application menu
  createApplicationMenu();
}

// ============================================================
// Application Menu
// ============================================================

function createApplicationMenu() {
  const template = [
    {
      label: 'Creative Suite',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            handleOpenFile();
          }
        },
        {
          label: 'Save Export...',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('menu-save-export');
          }
        },
        { type: 'separator' },
        {
          label: 'Switch Tool',
          submenu: [
            { label: 'DITHR', accelerator: 'CmdOrCtrl+1', click: () => switchTool('dither') },
            { label: 'FLAKE', accelerator: 'CmdOrCtrl+2', click: () => switchTool('flake') },
            { label: 'REFRACT', accelerator: 'CmdOrCtrl+3', click: () => switchTool('refract') },
            { label: 'SPLITX', accelerator: 'CmdOrCtrl+4', click: () => switchTool('split') },
            { label: 'TEXTR', accelerator: 'CmdOrCtrl+5', click: () => switchTool('textr') },
            { label: 'RITM',  accelerator: 'CmdOrCtrl+6', click: () => switchTool('rhythm') },
            { label: 'BOIDS', accelerator: 'CmdOrCtrl+7', click: () => switchTool('boids') }
          ]
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ============================================================
// IPC Handlers
// ============================================================

function switchTool(toolId) {
  mainWindow?.webContents.send('switch-tool', toolId);
}

async function handleOpenFile() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'All Supported', extensions: ['svg', 'png', 'jpg', 'jpeg', 'json', 'ttf', 'otf', 'woff', 'woff2'] },
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] },
      { name: 'SVG', extensions: ['svg'] },
      { name: 'JSON', extensions: ['json'] },
      { name: 'Fonts', extensions: ['ttf', 'otf', 'woff', 'woff2'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    mainWindow?.webContents.send('open-file', result.filePaths[0]);
  }
}

// IPC event handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

// ============================================================
// App Event Handlers
// ============================================================

// When Electron is ready
app.whenReady().then(createMainWindow);

// Quit when all windows closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, recreate window when dock clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});
