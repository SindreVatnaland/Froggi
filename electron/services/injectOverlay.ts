import type { ElectronLog } from 'electron-log';
import { delay, inject, singleton } from 'tsyringe';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { BrowserWindow } from 'electron';
import GOverlay, { IWindow } from 'electron-overlay';
import os from 'os';
import { NotificationType } from '../../frontend/src/lib/models/enum';
import { MessageHandler } from './messageHandler';
import { throttle } from 'lodash';
import { GraphicWindowEventResize, InjectorEvent, InjectorPayload } from '../../frontend/src/lib/models/types/injectorTypes';

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
		this.overlayInjector.setEventCallback(
			((event: InjectorEvent, payload: InjectorPayload[InjectorEvent]) => {
				switch (event) {
					case "graphics.window.event.resize":
						this.handleWindowResize(payload);
						break;
					default:
						// this.log.info(`Event: ${event}, ${JSON.stringify(payload)}`);
						break
				}
			}) as (event: string, ...args: unknown[]) => void
		);
	}

	private handleWindowResize = (resizeEvent: GraphicWindowEventResize) => {
		for (const window of this.windows.values()) {
			let newWidth = resizeEvent.width;
			let newHeight = Math.round((newWidth / 16) * 9);

			// If the new height exceeds the given height, adjust based on height
			if (newHeight > resizeEvent.height) {
				newHeight = resizeEvent.height;
				newWidth = Math.round((newHeight / 9) * 16);
			}

			// Center the window horizontally
			const x = Math.round((resizeEvent.width - newWidth) / 2);
			const y = 0; // Keep at top

			window.setBounds({ x, y, width: newWidth, height: newHeight });
			this.log.info(`Resized window: ${window.id}, ${JSON.stringify(window.getBounds())}`);

			// Manually emit the resize event
			window.emit("resize");
		}
	};

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
			},
		});
		window.loadURL(url);
		return window;
	}

	private injectOverlay = (overlayId: string) => {
		if (!this.gameWindow) {
			this.log.warn('No game window found');
			this.messageHandler.sendMessage('Notification', 'No game window found', NotificationType.Danger);
			return;
		}

		this.log.info(`Injecting overlay: ${overlayId}`);
		const port = this.isDev ? '5173' : '3200';
		const window = this.createWindow(`http://localhost:${port}/obs/overlay/${overlayId}`);
		this.windows.set(overlayId, window);

		this.overlayInjector.addWindow(window.id, {
			name: "StatusBar",
			resizable: false,
			transparent: true,
			maxWidth: 1920,
			maxHeight: 1080,
			minWidth: 0,
			minHeight: 0,
			rect: window.getBounds(),
			caption: {
				left: 0,
				right: 0,
				top: 0,
				height: 0,
			},
			nativeHandle: window.getNativeWindowHandle().readUInt32LE(0),
		});

		window.on("resize", () => {
			this.overlayInjector.sendWindowBounds(window.id, { rect: window.getBounds() });
		})

		const processPaintEvent = throttle((image: Electron.NativeImage, window: BrowserWindow) => {
			this.overlayInjector.sendFrameBuffer(
				window.id,
				image.getBitmap(),
				image.getSize().width,
				image.getSize().height
			);
		}, 16, { leading: true, trailing: true });

		window.webContents.on("paint", (_, __, image) => {
			processPaintEvent(image, window);
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

	injectIntoGame = (windowTitle: string) => {
		this.log.info(`Searching for game window: ${windowTitle}`);
		const topWindows = this.overlayInjector.getTopWindows();

		const possibleTitles = [...windowTitle.split(".")[0].split(" "), "Dolphin", "Faster Melee", "Mainline"];
		this.gameWindow = topWindows.find(win => possibleTitles.some(title => win.title?.includes(title)));
		if (!this.gameWindow) {
			this.log.warn(`No matching game window found for: ${windowTitle}`);
			return;
		}
		const window = this.overlayInjector.injectProcess(this.gameWindow);
		this.log.info(`Injecting overlay into game: ${JSON.stringify(window)}`);
	};

	initEventListeners() {
		this.clientEmitter.on("InjectOverlay", this.injectOverlay.bind(this));
		this.clientEmitter.on("CloseAllInjectedOverlays", this.closeAllOverlays.bind(this));
		this.clientEmitter.on("CloseInjectedOverlay", this.closeOverlay.bind(this));
	}
}
