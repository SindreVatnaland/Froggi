import { Notification, BrowserWindow } from 'electron';
import { BACKEND_PORT, WEBSOCKET_PORT } from '../../frontend/src/lib/models/const';

export function createBackgroundNotification(_: Electron.App, mainWindow: BrowserWindow): Notification {
  const notification = new Notification({
    title: "App running",
    body: 'The window has been closed, but the app is still running in the background.',
    urgency: "low",
    silent: true,
    actions: [
      {
        type: "button",
        text: "Quit App"
      },
    ]
  });

  notification.addListener("click", () => {
    mainWindow.show();
  });

  notification.addListener("close", () => {
    mainWindow.hide();
  })

  // notification.addListener("action", (_, index) => {
  //   if (index === 0) {
  //     app.exit();
  //   }
  // });

  return notification
}

export function createErrorNotification(mainWindow: BrowserWindow, title: string, message: string): Notification {

  switch (true) {
    case message.includes(`${WEBSOCKET_PORT}`) || message.includes(`${BACKEND_PORT}`):
      message = "An instance of Froggi might already be running in the background. Check the application Tray"
      break
  }

  const notification = new Notification({
    title: title,
    body: message,
    urgency: "critical",
    silent: true,
  });

  notification.addListener("click", () => {
    mainWindow.show();
  });

  notification.addListener("close", () => {
    mainWindow.hide();
  })

  return notification
}