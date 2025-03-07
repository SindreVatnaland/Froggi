import type { ElectronLog } from 'electron-log';
import { inject, singleton } from 'tsyringe';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { BrowserWindow } from 'electron';
import IOverlay from 'electron-overlay';
import os from 'os';
import { NotificationType } from '../../frontend/src/lib/models/enum';
import { MessageHandler } from './messageHandler';

@singleton()
export class InjectOverlay {
	constructor(
		private windows = new Map<string, BrowserWindow>(),
		@inject('Dev') private isDev: boolean,
		@inject('ElectronLog') private log: ElectronLog,
		@inject("ClientEmitter") private clientEmitter: TypedEmitter,
		@inject("MessageHandler") private messageHandler: MessageHandler,
	) {
		this.log.info('Initializing Overlay Injection Service');
		this.initializeInjection();
		this.initEventListeners();

	}

	private initializeInjection = async () => {
		IOverlay.start();
	}

	private createWindow(url: string) {
		const window = new BrowserWindow({
			width: 1920,
			height: 1080,
			webPreferences: {
				nodeIntegration: true,
				offscreen: true,
			},
		});
		window.loadURL(url);
		return window;
	}

	private injectOverlay = async (overlayId: string) => {
		this.log.info(`Injecting overlay: ${overlayId}`);
		const port = this.isDev ? '3200' : '5173';
		const window = this.createWindow(`http://localhost:${port}/overlay/${overlayId}`);
		this.windows.set(overlayId, window);
		IOverlay.addWindow(window.id, {
			name: overlayId,
			resizable: false,
			transparent: true,
			maxWidth: 1920,
			maxHeight: 1080,
			minWidth: 0,
			minHeight: 0,
			rect: {
				x: 0,
				y: 0,
				width: 1920,
				height: 1080,
			},
			nativeHandle: window.getNativeWindowHandle().readUInt32LE(0),
		});

		window.webContents.on("paint", (_, __, image) => {
			IOverlay.sendFrameBuffer(
				window.id,
				image.getBitmap(),
				image.getSize().width,
				image.getSize().height
			);
		});

		this.log.info(`Overlay injected: ${overlayId}`);
		this.messageHandler.sendMessage('Notification', `Overlay injected: ${overlayId}`, NotificationType.Success);
	}

	private closeOverlay = (overlayId: string) => {
		const window = this.windows.get(overlayId);
		if (window) {
			window.removeAllListeners();
			window.close();
			this.windows.delete(overlayId);
			IOverlay.closeWindow(window.id);
			this.log.info(`Overlay closed: ${overlayId}`);
		}
	};

	injectIntoGame = async (windowTitle: string) => {
		if (os.platform() !== 'win32') return;
		this.log.info(`Searching for game window: ${windowTitle}`);
		const topWindows = IOverlay.getTopWindows();
		const gameWindow = topWindows.find(win => win.title?.includes(windowTitle));
		if (!gameWindow) {
			this.log.warn(`No matching game window found for: ${windowTitle}`);
			return;
		}
		this.log.info(`Injecting overlay into game: ${gameWindow.title}`);
		IOverlay.injectProcess(gameWindow);
	};

	initEventListeners() {
		this.clientEmitter.on("InjectOverlay", this.injectOverlay.bind(this));
		this.clientEmitter.on("CloseInjectedOverlay", this.closeOverlay.bind(this));
	}
}
