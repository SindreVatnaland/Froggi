import type { ElectronLog } from 'electron-log';
import { delay, inject, singleton } from 'tsyringe';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { BrowserWindow } from 'electron';
import GOverlay, { IWindow } from 'electron-overlay';
import os from 'os';
import { NotificationType } from '../../frontend/src/lib/models/enum';
import { MessageHandler } from './messageHandler';
import { debounce, throttle } from 'lodash';
import { GameWindowEventFocus, GraphicWindowEventResize, InjectorEvent, InjectorPayload } from '../../frontend/src/lib/models/types/injectorTypes';
import { getWindowSize } from '../utils/windowManager';

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
						{
							const resizeEvent = payload as InjectorPayload["graphics.window.event.resize"];
							this.handleWindowResize(resizeEvent);
							break;
						}
					case "game.window.focused":
						{
							const focusEvent = payload as InjectorPayload["game.window.focused"];
							this.handleWindowFocus(focusEvent);
							break;
						}
					default:
						this.log.info(`Event: ${event}, ${JSON.stringify(payload)}`);
						break
				}
			}) as (event: string, ...args: unknown[]) => void
		);
	}

	private handleWindowResize = debounce((resizeEvent: GraphicWindowEventResize) => {
		for (const window of this.windows.values()) {
			// Always use full height
			const newRect = this.getCenteredBounds(resizeEvent.width, resizeEvent.height);

			window.setBounds(newRect);
			this.log.info(`Resized window: ${window.id}, ${JSON.stringify(window.getBounds())}`);

			// Manually emit the resize event
			window.emit("resize");
		}
	}, 250);

	private getCenteredBounds = (width: number, height: number): Electron.Rectangle => {
		const newHeight = height;
			const newWidth = Math.round((newHeight / 9) * 16);

			// Center the window horizontally
			const x = Math.round((width - newWidth) / 2);
			const y = 0; // Keep at top
		return { x, y, width: newWidth, height: newHeight };
	}

	private handleWindowFocus = debounce((focusEvent: GameWindowEventFocus) => {
		this.log.info(`Game window focus: ${focusEvent}`);
		// const focusWin = BrowserWindow.fromId(focusEvent.focusWindowId);
		// if (focusWin) {
		// 	focusWin.focusOnWebView();
		// }
	});


	private createWindow(url: string, rect: Electron.Rectangle) {
		const window = new BrowserWindow({
			...rect,
			frame: false,
			show: false,
			transparent: true,
			resizable: false,
			webPreferences: {
				backgroundThrottling: false,
				offscreen: true,
				nodeIntegration: true,
			},
		});
		window.loadURL(url);
		return window;
	}

	private injectOverlay = async (overlayId: string) => {
		if (!this.gameWindow) {
			this.log.warn('No game window found');
			this.messageHandler.sendMessage('Notification', 'No game window found', NotificationType.Danger);
			return;
		}

		
		const dolphinWindowSize = await getWindowSize(this.gameWindow.processId)
		const dolphinWindowBounds = this.getCenteredBounds(dolphinWindowSize.width, dolphinWindowSize.height);
		this.log.info(`Game window size: ${JSON.stringify(dolphinWindowSize)}`);

		this.log.info(`Injecting overlay: ${overlayId}`);

		const port = this.isDev ? '5173' : '3200';
		const window = this.createWindow(`http://localhost:${port}/obs/overlay/${overlayId}`, dolphinWindowBounds);
		this.windows.set(overlayId, window);

		this.overlayInjector.addWindow(window.id, {
			name: "StatusBar",
			resizable: false,
			transparent: true,
			maxWidth: window.getBounds().width,
			maxHeight: window.getBounds().height,
			minWidth: 0,
			minHeight: 0,
			rect: dolphinWindowBounds,
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
		}, 2, { leading: true, trailing: true });

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

	injectIntoGame = (windowTitle: string = "Dolphin") => {
		this.log.info(`Searching for game window: ${windowTitle}`);
		const topWindows = this.overlayInjector
			.getTopWindows()
			.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""))
			.reverse();

		this.log.info(`Top windows: ${JSON.stringify(topWindows)}`);

		const possibleSubTitles = [windowTitle, `Dolphin`, `Faster Melee`, `Mainline`];
		this.gameWindow = topWindows.find(win => possibleSubTitles.some(title => win.title?.includes(title)));
		if (!this.gameWindow) {
			this.log.warn(`No matching game window found`);
			return;
		}
		this.log.info(`Game window found: ${JSON.stringify(this.gameWindow)}`);
		const window = this.overlayInjector.injectProcess(this.gameWindow);
		this.log.info(`Injecting overlay into game: ${JSON.stringify(window)}`);
	};

	initEventListeners() {
		this.clientEmitter.on("InjectOverlay", this.injectOverlay.bind(this));
		this.clientEmitter.on("CloseAllInjectedOverlays", this.closeAllOverlays.bind(this));
		this.clientEmitter.on("CloseInjectedOverlay", this.closeOverlay.bind(this));
	}
}
