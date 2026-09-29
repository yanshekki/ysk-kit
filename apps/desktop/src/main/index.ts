import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, ipcMain, safeStorage } from 'electron';

const here = dirname(fileURLToPath(import.meta.url));

const tokenDir = (): string => join(app.getPath('userData'), 'tokens');
const tokenPath = (name: string): string => join(tokenDir(), name);

const writeSecret = (name: string, value: string): void => {
  mkdirSync(tokenDir(), { recursive: true });
  const payload = safeStorage.isEncryptionAvailable()
    ? safeStorage.encryptString(value)
    : Buffer.from(value, 'utf8');
  writeFileSync(tokenPath(name), payload);
};

const readSecret = (name: string): string | null => {
  const path = tokenPath(name);
  if (!existsSync(path)) return null;
  const buf = readFileSync(path);
  try {
    return safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(buf)
      : buf.toString('utf8');
  } catch {
    return null;
  }
};

const clearSecrets = (): void => {
  for (const name of ['access', 'refresh']) {
    const path = tokenPath(name);
    if (existsSync(path)) unlinkSync(path);
  }
};

ipcMain.handle('ysk:token:get', () => readSecret('access'));
ipcMain.handle('ysk:token:set', (_event, token: string) => {
  writeSecret('access', token);
});
ipcMain.handle('ysk:token:getRefresh', () => readSecret('refresh'));
ipcMain.handle('ysk:token:setPair', (_event, access: string, refresh: string) => {
  writeSecret('access', access);
  writeSecret('refresh', refresh);
});
ipcMain.handle('ysk:token:clear', () => {
  clearSecrets();
});

const createWindow = (): void => {
  const win = new BrowserWindow({
    width: 960,
    height: 720,
    webPreferences: {
      preload: join(here, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void win.loadFile(join(here, '../renderer/index.html'));
  }
};

void app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
