import { BrowserWindow, ipcMain } from "electron";
import { autoUpdater } from "electron-updater";
import path from "path";
import { createErrorNotification } from "./../utils/notifications";

export async function performUpdate(): Promise<void> {
  const updateWindow = createUpdateWindow();
  try {
    console.log('Performing update tasks...');
    await waitForUpdateConfirmation();
    updateWindow.close();
  } catch (error) {
    console.error('Error during update tasks:', error);
    const notification = createErrorNotification(updateWindow, "Update Error", error.message);
    notification.show();
    setTimeout(() => {
      updateWindow.close()
    }, 5000);
  }
}

function createUpdateWindow(): BrowserWindow {
  console.log('Creating update window');
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
    updateWindow.webContents.send('autoUpdater:status', 'Update Available');
  });

  autoUpdater.on('download-progress', (progress) => {
    updateWindow.webContents.send('autoUpdater:progress', progress.percent);
  });

  autoUpdater.on('update-downloaded', () => {
    updateWindow.webContents.send('autoUpdater:status', 'Download Complete');
    autoUpdater.quitAndInstall();
  });

  autoUpdater.checkForUpdatesAndNotify();

  return updateWindow;
}


async function waitForUpdateConfirmation(): Promise<boolean> {
  return await new Promise((resolve) => {
    ipcMain.on('autoUpdater:skipUpdate', () => {
      console.log('Skipped update...');
      resolve(false);
    });

    ipcMain.on('autoUpdater:download', () => {
      console.log('Downloading update...');
      autoUpdater.downloadUpdate();
    });

    autoUpdater.on('update-not-available', () => {
      console.log('No updates available.');
      resolve(false);
    });

    autoUpdater.on('update-downloaded', () => {
      console.log('Update downloaded.');
      resolve(true);
    });
  });
}