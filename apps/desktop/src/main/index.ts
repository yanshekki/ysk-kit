import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  app,
  BrowserWindow,
  type IpcMainInvokeEvent,
  ipcMain,
  safeStorage,
  session,
} from 'electron';
import { createSecretStore } from './secret-store';
import {
  desktopCsp,
  isTrustedIpcSender,
  rendererAllowedOrigins,
  windowOpenDecision,
} from './security';

const here = dirname(fileURLToPath(import.meta.url));

const tokenDir = (): string => join(app.getPath('userData'), 'tokens');

const secrets = createSecretStore({
  tokenDir,
  io: {
    encryptionAvailable: () => safeStorage.isEncryptionAvailable(),
    encrypt: (value) => safeStorage.encryptString(value),
    decrypt: (buf) => safeStorage.decryptString(buf),
    writeFile: (path, data) => {
      writeFileSync(path, data);
    },
    readFile: (path) => readFileSync(path),
    exists: (path) => existsSync(path),
    unlink: (path) => {
      unlinkSync(path);
    },
    mkdir: (path) => {
      mkdirSync(path, { recursive: true });
    },
    warn: (message) => {
      console.warn(message);
    },
  },
});

const allowedOrigins = (): string[] =>
  rendererAllowedOrigins({
    ...(process.env.ELECTRON_RENDERER_URL
      ? { rendererUrl: process.env.ELECTRON_RENDERER_URL }
      : {}),
  });

const assertTrustedSender = (event: IpcMainInvokeEvent): void => {
  if (!isTrustedIpcSender(event.senderFrame?.url, allowedOrigins())) {
    throw new Error('untrusted ipc sender');
  }
};

ipcMain.handle('ysk:token:get', (event) => {
  assertTrustedSender(event);
  return secrets.read('access');
});
ipcMain.handle('ysk:token:set', (event, token: string) => {
  assertTrustedSender(event);
  secrets.write('access', token);
});
ipcMain.handle('ysk:token:getRefresh', (event) => {
  assertTrustedSender(event);
  return secrets.read('refresh');
});
ipcMain.handle('ysk:token:setPair', (event, access: string, refresh: string) => {
  assertTrustedSender(event);
  secrets.write('access', access);
  secrets.write('refresh', refresh);
});
ipcMain.handle('ysk:token:clear', (event) => {
  assertTrustedSender(event);
  secrets.clear();
});

const applyDesktopCsp = (): void => {
  const csp = desktopCsp({
    production: app.isPackaged,
    connectSrc: [process.env.API_PUBLIC_URL ?? 'http://localhost:3001'],
  });
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });
};

const createWindow = (): void => {
  const win = new BrowserWindow({
    width: 960,
    height: 720,
    webPreferences: {
      preload: join(here, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  win.webContents.setWindowOpenHandler(() => windowOpenDecision());
  win.webContents.on('will-navigate', (event, url) => {
    if (!isTrustedIpcSender(url, allowedOrigins())) {
      event.preventDefault();
    }
  });
  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void win.loadFile(join(here, '../renderer/index.html'));
  }
};

void app.whenReady().then(() => {
  applyDesktopCsp();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
