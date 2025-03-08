import type { ElectronLog } from 'electron-log';
import { delay, inject, singleton } from 'tsyringe';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { BrowserWindow, screen } from 'electron';
import GOverlay, { IWindow } from 'electron-overlay';
import os from 'os';
import { NotificationType } from '../../frontend/src/lib/models/enum';
import { MessageHandler } from './messageHandler';
import { throttle } from 'lodash';

@singleton()
export class OverlayInjection {
	private windows: Map<string, BrowserWindow> = new Map();
	private overlayInjector = GOverlay;
	private gameWindow: IWindow | undefined;

	constructor(
		@inject('Dev') private isDev: boolean,
		@inject('ElectronLog') private log: ElectronLog,
		@inject("ClientEmitter") private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler
	) {
		this.log.info('Initializing Overlay Injection Service');
		if (os.platform() !== 'win32') return;
		this.initializeInjection();
		this.initEventListeners();
	}

	private initializeInjection = async () => {
		this.log.info('Initializing overlay injection');
		this.overlayInjector.start();
		this.overlayInjector.setEventCallback((event: string, payload: any) => {
			this.log.info(`Overlay event: ${event}`, payload);
			if (event === "game.window.focused") {
				console.log("focusWindowId", payload.focusWindowId);

				BrowserWindow.getAllWindows().forEach((window) => {
					window.blurWebView();
				});

				const focusWin = BrowserWindow.fromId(payload.focusWindowId);
				if (focusWin) {
					focusWin.focusOnWebView();
				}
			}
			if (event === "game.window.focused") {
				console.log("focusWindowId", payload.focusWindowId);

				BrowserWindow.getAllWindows().forEach((window) => {
					window.blurWebView();
				});

				const focusWin = BrowserWindow.fromId(payload.focusWindowId);
				if (focusWin) {
					focusWin.focusOnWebView();
				}
			}
		});
	}

	private createWindow(url: string) {
		const window = new BrowserWindow({
			width: 1920,
			height: 1080,
			frame: false,
			show: false,
			transparent: true,
			resizable: false,
			x: 0,
			y: 0,
			webPreferences: {
				offscreen: true,
				nodeIntegration: true,
				contextIsolation: false,
			},
		});
		window.loadURL(url);
		return window;
	}

	private injectOverlay = async (overlayId: string) => {
		if (!this.gameWindow) {
			this.log.warn('No game window found');
			return;
		}

		const display = screen.getDisplayNearestPoint(
			screen.getCursorScreenPoint()
		);

		this.log.info(`Injecting overlay: ${overlayId}`);
		const port = this.isDev ? '5173' : '3200';
		const window = this.createWindow(`http://localhost:${port}/obs/overlay/${overlayId}`);
		this.windows.set(overlayId, window);

		this.overlayInjector.addWindow(window.id, {
			name: overlayId,
			resizable: false,
			transparent: true,
			maxWidth: 1920,
			maxHeight: 1080,
			minWidth: 1920,
			minHeight: 1080,
			rect: {
				x: 0,
				y: 0,
				width: 1920,
				height: 1080,
			},
			nativeHandle: window.getNativeWindowHandle().readUInt32LE(0),
		});

		const processPaintEvent = throttle((image: Electron.NativeImage) => {
			console.log("paint to window", window.id);
			console.log("windows", this.windows);

			this.overlayInjector.sendFrameBuffer(
				window.id,
				image.getBitmap(),
				image.getSize().width,
				image.getSize().height
			);
		}, 16, { leading: true, trailing: true }); // Adjust the throttle time as needed (in milliseconds)

		window.webContents.on("paint", (_, __, image) => {
			processPaintEvent(image);
		});

		window.on("ready-to-show", () => {
			window.focusOnWebView();
		});

		this.messageHandler.sendMessage('Notification', `Overlay injected: ${overlayId}`, NotificationType.Success);
	}

	private closeOverlay = (overlayId: string) => {
		const window = this.windows.get(overlayId);
		if (window) {
			window.removeAllListeners();
			window.close();
			this.windows.delete(overlayId);
			this.overlayInjector.closeWindow(window.id);
			this.log.info(`Overlay closed: ${overlayId}`);
		}
	};

	closeAllOverlays = () => {
		for (const overlayId of this.windows.keys()) {
			this.closeOverlay(overlayId);
		}
	}

	injectIntoGame = async (windowTitle: string) => {
		this.log.info(`Searching for game window: ${windowTitle}`);
		const topWindows = this.overlayInjector.getTopWindows();
		this.gameWindow = topWindows.find(win => win.title?.includes(windowTitle));
		if (!this.gameWindow) {
			this.log.warn(`No matching game window found for: ${windowTitle}`);
			return;
		}
		this.log.info(`Injecting overlay into game: ${JSON.stringify(this.gameWindow)}`);
		this.overlayInjector.injectProcess(this.gameWindow);
	};

	initEventListeners() {
		this.clientEmitter.on("InjectOverlay", this.injectOverlay.bind(this));
		this.clientEmitter.on("CloseAllInjectedOverlays", this.closeAllOverlays.bind(this));
		this.clientEmitter.on("CloseInjectedOverlay", this.closeOverlay.bind(this));
	}
}
