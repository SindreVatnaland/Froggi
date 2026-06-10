import 'reflect-metadata';
import { app, BrowserWindow, dialog, IpcMain, ipcMain, Menu, nativeImage, Tray, Notification, powerSaveBlocker, session } from 'electron';
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
import { ElectronSettingsStore } from './services/store/storeSettings';
import { ElectronSetService } from './services/setService';
import { NgrokService } from './services/ngrokService';
import { ElectronWebhookStore } from './services/store/storeWebhook';
import { WebhookService } from './services/webhookService';
import { ActionStateService } from './services/actionStateService';
import { ErrorReporter, reportStartupError } from './services/errorReporter';
import { BUILD_CRASH_WEBHOOK } from './services/reportWebhooks';
import { BingoService } from './services/bingoService';
import { IronManService } from './services/ironmanService';
import { LobbyService } from './services/lobbyService';
import { TwitchChatService } from './services/twitchChatService';

let mainLog: ElectronLog = log
let isQuitting = false;

function setLoggingPath(log: ElectronLog, appName: string, dev: boolean): ElectronLog {
	try {
		const appDataPath = getAppDataPath(appName);
		log.transports.file.resolvePath = () => path.join(`${appDataPath}/main.log`);

		// File: full detail in dev, trim verbose/debug noise in production.
		log.transports.file.level = dev ? 'verbose' : 'info';
		// Console: visible while developing, off in packaged builds.
		log.transports.console.level = dev ? 'debug' : false;

		// Scope label so every line shows which service emitted it.
		// Padded to a fixed width so columns line up in the log file.
		log.scope.labelPadding = 14;

		// [HH:MM:SS.mmm] [level] [scope] message
		const fileFormat = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {scope} {text}';
		const consoleFormat = '{h}:{i}:{s}.{ms} {scope} {text}';
		log.transports.file.format = fileFormat;
		log.transports.console.format = consoleFormat;

		// Keep the log file from growing without bound (5 MB → rotates to .old).
		log.transports.file.maxSize = 5 * 1024 * 1024;
	} catch (err) {
		log.error(err);
	}

	return log;
}

try {
	const dev = !app.isPackaged;
	const appName = dev ? "Electron" : "froggi";
	mainLog = setLoggingPath(log, appName, dev);
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

	// froggi:// deep-link state. A link may arrive before services are wired (cold start
	// via the protocol on macOS), so queue it and flush once LobbyService is resolved.
	let servicesReady = false;
	let pendingDeepLink: string | null = null;

	app.commandLine.appendSwitch("disable-background-timer-throttling")
	app.commandLine.appendSwitch('disable-renderer-backgrounding')

	// Register the froggi:// protocol so public-invite deep links open the app.
	if (process.defaultApp && process.argv.length >= 2) {
		app.setAsDefaultProtocolClient('froggi', process.execPath, [path.resolve(process.argv[1])]);
	} else {
		app.setAsDefaultProtocolClient('froggi');
	}

	// macOS delivers deep links via open-url (can fire before the app is ready).
	app.on('open-url', (event, url) => {
		event.preventDefault();
		handleDeepLink(url);
	});

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
		});

		return mainWindow;
	}

	function createMenu(): Electron.MenuItemConstructorOptions[] {
		const editMenu: Electron.MenuItemConstructorOptions = {
			label: 'Edit',
			submenu: [
				{ role: 'undo' },
				{ role: 'redo' },
				{ type: 'separator' },
				{ role: 'cut' },
				{ role: 'copy' },
				{ role: 'paste' },
				{ role: 'selectAll' },
			],
		};
		if (isMac) return [
			{
				label: 'Froggi',
				submenu: [
					{
						label: 'Quit',
						accelerator: 'CmdOrCtrl+Q',
						click: () => { app.quit(); },
					},
				],
			},
			editMenu,
		];
		return [editMenu];
	}

	function handleMultipleInstances() {
		const isOnlyInstance = app.requestSingleInstanceLock();

		if (!isOnlyInstance) {
			app.quit();
		}
	}

	/** Handle a froggi:// deep link. Currently only `froggi://join/<code>` (join a public lobby). */
	function handleDeepLink(rawUrl: string | undefined) {
		if (!rawUrl || !rawUrl.startsWith('froggi://')) return;
		mainLog.info('Deep link received:', rawUrl);
		let action: string;
		let code: string;
		try {
			const u = new URL(rawUrl);
			action = u.hostname;
			code = decodeURIComponent(u.pathname.replace(/^\/+/, ''));
		} catch (err) {
			mainLog.warn('Failed to parse deep link:', err);
			return;
		}
		if (action !== 'join' || !code) {
			mainLog.warn('Unsupported deep link:', rawUrl);
			return;
		}
		// Services (LobbyService) may not be wired yet on a cold start — queue and flush later.
		if (!servicesReady) {
			pendingDeepLink = rawUrl;
			return;
		}
		// Route through the normal connect-code join so it lands in the right game
		// (bingo/ironman, detected via /lobby-info) — same path as pasting the code.
		container.resolve(MessageHandler).sendMessage('JoinWithCode', code);
		if (mainWindow) {
			if (mainWindow.isMinimized()) mainWindow.restore();
			mainWindow.show();
			mainWindow.focus();
		}
	}

	function createTray(): Tray {
		const trayImagePath = path.join(__dirname, '../../build/icon-tray.png');
		const dockImagePath = path.join(__dirname, '../../build/icon.png');
		const trayImage = nativeImage.createFromPath(trayImagePath).resize({ width: 16, height: 16 });
		const dockImage = nativeImage.createFromPath(dockImagePath);
		tray = new Tray(trayImage);
		// In production the packaged .app already supplies the Dock icon (the properly sized
		// bundle .icns). Overriding it with the raw full-bleed PNG makes it look oversized and
		// square, so only set it in dev where there's no bundle icon (avoids the generic Electron one).
		if (isMac && dev) app.dock.setIcon(dockImage);
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

			// Resolve first so its crash hooks are installed before any other service runs.
			container.resolve(ErrorReporter);

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
			container.resolve(ElectronSetService);
			container.resolve(NgrokService);
			container.resolve(ElectronWebhookStore);
			container.resolve(WebhookService);
			container.resolve(ActionStateService);
			container.resolve(TwitchChatService);
			container.resolve(BingoService);
			container.resolve(IronManService);
			container.resolve(LobbyService);

			// Deep links can now be acted on; flush any that arrived during cold start.
			servicesReady = true;
			if (pendingDeepLink) {
				const link = pendingDeepLink;
				pendingDeepLink = null;
				handleDeepLink(link);
			}

			// Notify the frontend of any missing spectate configuration now that
			// MessageHandler is ready and listening for Notification events.
			container.resolve(ElectronSettingsStore).notifyMissingSpectateConfig();

			// First-run crash-report consent. Ask once on the very first launch (when no
			// choice has been stored yet) regardless of whether a webhook is configured —
			// this captures the user's preference up front. Actual sending is still gated
			// on a webhook being present (see ErrorReporter).
			const crashConsent = store.get('settings.froggi.crashReportsEnabled');
			if (crashConsent === undefined) {
				const { response } = await dialog.showMessageBox(mainWindow, {
					type: 'question',
					buttons: ['Allow', 'No thanks'],
					defaultId: 0,
					cancelId: 1,
					title: 'Help improve Froggi',
					message: 'Send anonymous crash reports?',
					detail: 'If something crashes, Froggi can send the error and recent logs to the developer. '
						+ 'Personal data (usernames, connect codes, IP addresses) is removed first. '
						+ 'You can change this anytime in Settings.',
				});
				store.set('settings.froggi.crashReportsEnabled', response === 0);
			}
		});

		// Migrate legacy top-level closeAction key
		const legacyClose = store.get('closeAction');
		if (legacyClose) { store.set('settings.froggi.closeAction', legacyClose); store.delete('closeAction'); }

		mainWindow.on('close', async (event) => {
			if (!isQuitting) {
				event.preventDefault();
				const remembered = store.get('settings.froggi.closeAction') as string | undefined;
				if (remembered === 'minimize') {
					mainWindow.hide();
					backgroundNotification.show();
					return;
				}
				if (remembered === 'quit') {
					isQuitting = true;
					app.quit();
					return;
				}
				const { response, checkboxChecked } = await dialog.showMessageBox(mainWindow, {
					type: 'question',
					buttons: ['Minimize to tray', 'Quit'],
					defaultId: 0,
					cancelId: 0,
					title: 'Close Froggi',
					message: 'Froggi runs in the background to keep the server active.',
					detail: 'Minimize to tray to keep the server running, or Quit to shut everything down.',
					checkboxLabel: 'Remember my choice',
					checkboxChecked: false,
				});
				if (checkboxChecked) {
					store.set('settings.froggi.closeAction', response === 1 ? 'quit' : 'minimize');
				}
				if (response === 1) {
					isQuitting = true;
					app.quit();
				} else {
					mainWindow.hide();
					backgroundNotification.show();
				}
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
		app.on('second-instance', (_event, argv) => {
			// Windows/Linux deliver the deep link as an argv entry on the second launch.
			const link = argv.find((a) => a.startsWith('froggi://'));
			if (link) handleDeepLink(link);
			if (!mainWindow) return;
			if (mainWindow.isMinimized()) mainWindow.restore();
			mainWindow.show();
			mainWindow.focus();
		});
	}

	app.on('ready', async () => {
		if (!dev) await performUpdate(app, mainLog);
		setPriority();
		createMainWindow();
		// Windows/Linux cold start via protocol: the link is in argv. Queue until services are ready.
		const linkArg = process.argv.find((a) => a.startsWith('froggi://'));
		if (linkArg) handleDeepLink(linkArg);
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
	// Bootstrap failed before the DI ErrorReporter existed — report directly.
	try {
		const webhook = process.env.DISCORD_USER_CRASH_REPORT_WEBHOOK?.trim() || BUILD_CRASH_WEBHOOK || undefined;
		const consented = new Store().get('settings.froggi.crashReportsEnabled') === true;
		reportStartupError(webhook, consented, err);
	} catch { /* ignore */ }
}