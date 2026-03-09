import { app, BrowserWindow } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let backendProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  const isDev = !app.isPackaged;
  let backendExecutable;

  if (isDev) {
    // In dev, assume backend is running independently, or we could spawn it here
    console.log('Running in dev mode. Ensure the FastAPI backend is started manually.');
    return;
  } else {
    // In production, run the bundled PyInstaller executable
    // electron-builder copies extraResources to process.resourcesPath
    backendExecutable = path.join(process.resourcesPath, 'backend', 'main.exe');
  }

  console.log(`Starting backend: ${backendExecutable}`);
  backendProcess = spawn(backendExecutable, [], {
    stdio: 'inherit',
    windowsHide: true,
    cwd: isDev ? undefined : path.join(process.resourcesPath, 'backend')
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    console.log('Killing backend process...');
    backendProcess.kill();
  }
});
