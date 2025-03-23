import { BrowserWindow, ipcMain } from "electron";
import { autoUpdater } from "electron-updater";
import path from "path";
import { createErrorNotification } from "./../utils/notifications";
import { ElectronLog } from "electron-log";
import Store from 'electron-store';

export async function performUpdate(app: Electron.App, log: ElectronLog): Promise<void> {
  console.log(app)
  const store = new Store();
  autoUpdater.disableDifferentialDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.autoDownload = false;
  autoUpdater.autoRunAppAfterInstall = true;
  autoUpdater.allowPrerelease = Boolean(store.get('settings.froggi.betaOptIn'))
  const updateWindow = createUpdateWindow(log);
  try {
    console.log('Performing update tasks...');
    await waitForUpdateConfirmation(log);
    autoUpdater.removeAllListeners();
    updateWindow.close();
  } catch (error) {
    log.error('Error during update tasks:', error);
    const notification = createErrorNotification(updateWindow, "Update Error", error.message);
    notification.show();
    setTimeout(() => {
      updateWindow.close()
    }, 5000);
  }
}

function createUpdateWindow(log: ElectronLog): BrowserWindow {
  log.info('Creating update window');
  const updateWindow = new BrowserWindow({
    width: 400,
    height: 300,
    resizable: false,
    frame: false,
    alwaysOnTop: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname.replace(`\\`, '/'), '..', 'preload.js'),
    },
  });

  // Load a simple HTML file for the update window
  const updateURL = `file://${path.join(__dirname, '..', 'update', 'update.html')}`;
  updateWindow.loadURL(updateURL);

  autoUpdater.on('update-available', () => {
    log.info('Update available');
    updateWindow.webContents.send('autoUpdater:status', 'Update Available');
  });

  autoUpdater.on('download-progress', (progress) => {
    log.info("Download progress", progress.percent.toFixed(1));
    updateWindow.webContents.send('autoUpdater:progress', progress.percent.toFixed(1));
  });

  autoUpdater.on('update-downloaded', () => {
    log.info('Download complete');
    autoUpdater.quitAndInstall();
  });

  autoUpdater.checkForUpdatesAndNotify();

  return updateWindow;
}


async function waitForUpdateConfirmation(log: ElectronLog): Promise<boolean> {
  return await new Promise((resolve) => {
    const skipUpdateHandler = () => {
      log.info('Skipped update...');
      ipcMain.removeListener('autoUpdater:download', downloadUpdateHandler);
      resolve(false);
    };

    const downloadUpdateHandler = () => {
      log.info('Downloading update...');
      autoUpdater.downloadUpdate();
    };

    ipcMain.on('autoUpdater:skipUpdate', skipUpdateHandler);
    ipcMain.on('autoUpdater:download', downloadUpdateHandler);

    autoUpdater.on('update-not-available', () => {
      log.info('No updates available.');
      resolve(false);
    });

    autoUpdater.on('update-cancelled', () => {
      resolve(false);
    });

    autoUpdater.on('error', () => {
      resolve(false);
    });
  });
}