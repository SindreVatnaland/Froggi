import { BrowserWindow, ipcMain, nativeTheme } from "electron";
import { autoUpdater } from "electron-updater";
import path from "path";
import { ElectronLog } from "electron-log";
import Store from 'electron-store';

export async function performUpdate(_app: Electron.App, log: ElectronLog): Promise<void> {
  const store = new Store();
  autoUpdater.disableDifferentialDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.autoDownload = false;
  autoUpdater.autoRunAppAfterInstall = true;
  autoUpdater.allowPrerelease = Boolean(store.get('settings.froggi.betaOptIn'));

  const updateWindow = createUpdateWindow(log);

  try {
    await waitForUpdateConfirmation(log, updateWindow);
    autoUpdater.removeAllListeners();
    if (!updateWindow.isDestroyed()) updateWindow.close();
  } catch (error) {
    log.error('Error during update:', error);
    if (!updateWindow.isDestroyed()) {
      updateWindow.webContents.send('autoUpdater:status', 'error');
      setTimeout(() => { if (!updateWindow.isDestroyed()) updateWindow.close(); }, 2500);
    }
  }
}

function createUpdateWindow(log: ElectronLog): BrowserWindow {
  log.info('Creating update window');

  const isDark = nativeTheme.shouldUseDarkColors;
  const updateWindow = new BrowserWindow({
    width: 400,
    height: 260,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
    backgroundColor: isDark ? '#1a1a1a' : '#fbf0e5',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname.replace(`\\`, '/'), '..', 'preload.js'),
    },
  });

  const updateURL = `file://${path.join(__dirname, '..', 'update', 'update.html')}`;
  updateWindow.loadURL(updateURL);

  autoUpdater.on('checking-for-update', () => {
    log.verbose('Checking for update');
    updateWindow.webContents.send('autoUpdater:status', 'checking');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version);
    // Embed version in the status string so renderer can display it without a new channel
    updateWindow.webContents.send('autoUpdater:status', `available:${info.version}`);
  });

  autoUpdater.on('update-not-available', () => {
    log.info('No update available');
    updateWindow.webContents.send('autoUpdater:status', 'up-to-date');
  });

  autoUpdater.on('download-progress', (progress) => {
    const pct = progress.percent.toFixed(1);
    log.verbose('Download progress:', pct);
    updateWindow.webContents.send('autoUpdater:status', 'downloading');
    updateWindow.webContents.send('autoUpdater:progress', pct);
  });

  autoUpdater.on('update-downloaded', () => {
    log.info('Download complete, installing');
    updateWindow.webContents.send('autoUpdater:status', 'installing');
    setTimeout(() => autoUpdater.quitAndInstall(), 1500);
  });

  autoUpdater.on('error', (err) => {
    log.error('Update error:', err);
    updateWindow.webContents.send('autoUpdater:status', 'error');
  });

  autoUpdater.checkForUpdatesAndNotify();

  return updateWindow;
}

async function waitForUpdateConfirmation(log: ElectronLog, updateWindow: BrowserWindow): Promise<void> {
  return new Promise((resolve) => {
    let resolved = false;
    let downloading = false;

    const done = () => {
      if (resolved) return;
      resolved = true;
      ipcMain.removeListener('autoUpdater:skipUpdate', skipHandler);
      ipcMain.removeListener('autoUpdater:download', downloadHandler);
      resolve();
    };

    const skipHandler = () => {
      log.info('Update skipped');
      done();
    };

    const downloadHandler = () => {
      log.info('Downloading update');
      downloading = true;
      autoUpdater.downloadUpdate();
    };

    ipcMain.on('autoUpdater:skipUpdate', skipHandler);
    ipcMain.on('autoUpdater:download', downloadHandler);

    autoUpdater.on('download-progress', () => { downloading = true; });

    autoUpdater.on('update-not-available', () => setTimeout(done, 1500));

    autoUpdater.on('error', (err) => {
      log.error('Update window error:', err);
      if (downloading) {
        // Download failed mid-flight — keep window open so user can retry
        downloading = false;
        if (!updateWindow.isDestroyed()) {
          updateWindow.webContents.send('autoUpdater:status', 'download-error');
        }
      } else {
        setTimeout(done, 2500);
      }
    });

    autoUpdater.on('update-cancelled', () => {
      if (downloading) {
        downloading = false;
        if (!updateWindow.isDestroyed()) {
          updateWindow.webContents.send('autoUpdater:status', 'download-error');
        }
      } else {
        done();
      }
    });
  });
}
