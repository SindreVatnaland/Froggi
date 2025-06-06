import 'reflect-metadata';
import { app, BrowserWindow, IpcMain, ipcMain, Menu, nativeImage, Tray, Notification, powerSaveBlocker, session } from 'electron';
import contextMenu from 'electron-context-menu';
import { container } from 'tsyringe';
import getAppDataPath from 'appdata-path';
import log from 'electron-log';
import type { ElectronLog } from 'electron-log';
import serve from 'electron-serve';
import windowStateManager from 'electron-window-state';
import path from 'path';
import os from 'os';
import { TypedEmitter } from '../frontend/src/lib/utils/customEventEmitter';

import { AutoUpdater } from './services/autoUpdater';
import { MessageHandler } from './services/messageHandler';
import { ObsWebSocket } from './services/obs';
import { StatsDisplay } from './services/statsDisplay';
import { SlippiJs } from './services/slippi';
import { SlpParser, SlpStream } from '@slippi/slippi-js';
import { DiscordRpc } from './services/discord';
import { migrateStore } from './services/store/migration';
import Store from 'electron-store';
import { ElectronCommandStore } from './services/store/storeCommands';
import { FileHandler } from './services/fileUpload';
import { BACKEND_PORT, VITE_PORT } from '../frontend/src/lib/models/const';
import { FrontendLogger } from './services/frontendLogger';
import { createBackgroundNotification, createErrorNotification } from './utils/notifications';
import { SqliteOverlay } from './services/sqlite/sqliteOverlay';
import { PacketCapture } from './services/packetCapture';
import { performUpdate } from './update/updateWindow';

let mainLog: ElectronLog = log
let isQuitting = false;

function setLoggingPath(log: ElectronLog, appName: string): ElectronLog {
	try {
		const appDataPath = getAppDataPath(appName);
		log.transports.file.resolvePath = () =>
			path.join(`${appDataPath}/main.log`
			);

		log.transports.file.level = "verbose"

	} catch (err) {
		log.error(err);
	}

	return log;
}

try {
	const dev = !app.isPackaged;
	const appName = dev ? "Electron" : "froggi";
	mainLog = setLoggingPath(log, appName);
	mainLog.info('Starting app');
	handleMultipleInstances();

	const isMac = os.platform() === 'darwin';
	const isWindows = os.platform() === 'win32';
	const isLinux = os.platform() === 'linux';
	mainLog.info('mac:', isMac, 'win:', isWindows, 'linux', isLinux);

	const store = new Store(migrateStore(log));

	const slpParser = new SlpParser();
	const slpStream = new SlpStream();
	const localEmitter = new TypedEmitter();
	const clientEmitter = new TypedEmitter();

	localEmitter.setMaxListeners(30);
	clientEmitter.setMaxListeners(30);

	const serveURL = serve({ directory: 'build' });
	const port = dev ? `${VITE_PORT}` : `${BACKEND_PORT}`;

	let mainWindow: BrowserWindow;
	let tray: Tray;
	let backgroundNotification: Notification;

	app.commandLine.appendSwitch("disable-background-timer-throttling")
	app.commandLine.appendSwitch('disable-renderer-backgrounding')

	powerSaveBlocker.start('prevent-display-sleep');

	function createWindow(): BrowserWindow {

		session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
			details.requestHeaders['User-Agent'] = 'MyDesktopApp/1.0 (Windows NT 10.0; Win64; x64)'; // Mimic a desktop app
			delete details.requestHeaders['Referer']; // Remove referer to avoid origin checks

			callback({ requestHeaders: details.requestHeaders });
		});

		session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
			const headers = details.responseHeaders;

			if (!headers) return;

			delete headers['x-frame-options'];
			delete headers['X-Frame-Options'];

			if (headers['content-security-policy']) {
				headers['content-security-policy'] = headers['content-security-policy'].map(policy =>
					policy.replace(/frame-ancestors[^;]+;?/gi, '') // Remove frame restrictions
				);
			}

			callback({ responseHeaders: headers });
		});
		log.info('Creating window');
		const windowState = windowStateManager({
			defaultWidth: 800,
			defaultHeight: 600,
		});

		const mainWindow = new BrowserWindow({
			backgroundColor: 'whitesmoke',
			titleBarStyle: 'default',
			minHeight: 600,
			minWidth: 800,
			webPreferences: {
				backgroundThrottling: false,
				contextIsolation: true,
				devTools: dev,
				nodeIntegration: true,
				preload: path.join(__dirname.replace(`\\`, '/'), '/preload.js'),
				spellcheck: false,
			},
			x: windowState.x,
			y: windowState.y,
			width: windowState.width,
			height: windowState.height,
		});

		const menu = Menu.buildFromTemplate(createMenu());
		Menu.setApplicationMenu(menu);

		windowState.manage(mainWindow);

		mainWindow.once('ready-to-show', () => {
			mainWindow.show();
			mainWindow.focus();
		});

		mainWindow.on('close', () => {
			windowState.saveState(mainWindow);

			backgroundNotification.show();
		});

		return mainWindow;
	}

	function createMenu(): Electron.MenuItemConstructorOptions[] {
		if (isMac) return [
			{
				label: 'Froggi',
				submenu: [
					{
						label: 'Quit',
						accelerator: 'CmdOrCtrl+Q',
						click: () => {
							app.quit();
						},
					},
				],
			},
		];
		return []
	}

	function handleMultipleInstances() {
		const isOnlyInstance = app.requestSingleInstanceLock();

		if (!isOnlyInstance) {
			app.quit();
		}
	}

	function createTray(): Tray {
		const imagePath = path.join(__dirname, '../../build/icon-tray.png');
		const image = nativeImage.createFromPath(imagePath);
		tray = new Tray(image.resize({ width: 16, height: 16 }));
		if (isMac) app.dock.setIcon(image);
		tray.setToolTip('Froggi');

		const contextMenu = Menu.buildFromTemplate([
			{
				label: 'Show',
				click: () => {
					mainWindow.show();
				},
			},
			{
				label: 'Reload Window',
				click: () => {
					mainWindow.reload();
				},
			},
			{
				type: 'separator',
			},
			{
				label: 'Quit',
				click: () => {
					isQuitting = true;
					app.quit();
				},
			},
		]);

		tray.setContextMenu(contextMenu);
		return tray;
	}



	contextMenu({
		showLookUpSelection: false,
		showSearchWithGoogle: false,
		showCopyImage: false,
		prepend: (defaultActions, params, browserWindow) => [
			{
				label: 'Dev',
				click: () => {
					mainWindow.webContents.openDevTools();
					console.log(defaultActions, params, browserWindow);
				},
			},
		],
	});

	function loadVite(port: string) {
		log.info('Loading Vite');
		mainWindow.loadURL(`http://localhost:${port}`).catch((e: Error) => {
			mainLog.error('Error loading URL, retrying', e);
			setTimeout(() => {
				loadVite(port);
			}, 200);
		});
	}

	function createMainWindow() {
		mainWindow = createWindow();
		backgroundNotification = createBackgroundNotification(app, mainWindow)
		createTray();

		if (dev) loadVite(port);
		if (!dev) serveURL(mainWindow);

		mainWindow.webContents.once('dom-ready', async () => {
			container.register<ElectronLog>('ElectronLog', { useValue: mainLog });

			container.register<string>('AppDir', {
				useValue: dev ? getAppDataPath('Electron') : getAppDataPath('froggi'),
			});
			container.register<Electron.App>('App', { useValue: app });
			container.register<BrowserWindow>('BrowserWindow', { useValue: mainWindow });
			container.register<TypedEmitter>('LocalEmitter', { useValue: localEmitter });
			container.register<TypedEmitter>('ClientEmitter', { useValue: clientEmitter });
			container.register<IpcMain>('IpcMain', { useValue: ipcMain });
			container.register<SlpParser>('SlpParser', { useValue: slpParser });
			container.register<SlpStream>('SlpStream', { useValue: slpStream });
			container.register<Store>('ElectronStore', { useValue: store });
			container.register<string>('RootDir', {
				useValue: `${__dirname}/../..`.replaceAll('\\', '/'),
			});

			container.register<boolean>('Dev', { useValue: dev });
			container.register<string>('Port', { useValue: port });

			container.resolve(ElectronCommandStore);

			container.resolve(SqliteOverlay);
			container.resolve(DiscordRpc);
			container.resolve(MessageHandler);
			container.resolve(StatsDisplay);
			container.resolve(ObsWebSocket);
			container.resolve(SlippiJs);
			container.resolve(AutoUpdater);
			container.resolve(FileHandler);
			container.resolve(FrontendLogger);
			container.resolve(PacketCapture);
		});

		mainWindow.on('close', (event) => {
			if (!isQuitting) {
				event.preventDefault();
				mainWindow.minimize();
				backgroundNotification.show();
			}
		});
	}

	function setPriority() {
		if (dev) return;
		try {
			os.setPriority(process.pid, os.constants.priority.PRIORITY_HIGHEST);
		}
		catch (err) {
			mainLog.error(err);
		}
	}

	const gotTheLock = app.requestSingleInstanceLock();
	if (!gotTheLock) {
		app.quit();
	} else {
		app.on('second-instance', () => {
			if (!mainWindow) return;
			if (mainWindow.isMinimized()) mainWindow.restore();
			mainWindow.focus();
		});
	}

	app.on('ready', async () => {
		if (!dev) await performUpdate(app, mainLog);
		setPriority();
		createMainWindow();
	});

	app.on('activate', () => {
		mainWindow?.show();
	});

	app.on('before-quit', () => {
		mainLog.info('Quitting app');
		isQuitting = true;
	});

	process.on('uncaughtException', (error) => {
		mainLog.error('Uncaught Exception:', error);
		const notification = createErrorNotification(mainWindow, "Error", error.message)
		notification.show();
		setTimeout(() => app.exit(), 15000)
	});
} catch (err) {
	mainLog.error("Main application crashed", err);
}