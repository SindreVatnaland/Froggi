import type { ElectronLog } from 'electron-log';
import { delay, inject, singleton } from 'tsyringe';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { BrowserWindow } from 'electron';
import os from 'os';
import { NotificationType } from '../../frontend/src/lib/models/enum';
import { MessageHandler } from './messageHandler';
import { debounce, throttle } from 'lodash';
import { GameWindowEventFocus, GraphicWindowEventResize, InjectorEvent, InjectorPayload, IWindow, OverlayType, ProcessInfo } from '../../frontend/src/lib/models/types/injectorTypes';
import { getProcessByName, getWindowInfoByPid } from '../utils/windowManager';
import { ElectronSettingsStore } from './store/storeSettings';
import { BACKEND_PORT } from '../../frontend/src/lib/models/const';
import AmdOverlay from 'electron-overlay-amd';
import IntelOverlay from 'electron-overlay-intel';

@singleton()
export class OverlayInjector {
	injectedOverlayIds: string[] = [];

	private window: BrowserWindow | null = null;
	private overlayInjector: OverlayType | null = null;
	private gameWindow: IWindow | undefined;

	constructor(
		@inject('Dev') private isDev: boolean,
		@inject('ElectronLog') private log: ElectronLog,
		@inject("ClientEmitter") private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(delay(() => ElectronSettingsStore)) private settingsStore: ElectronSettingsStore
	) {
		this.log.info('Initializing Overlay Injection Service');
		//if (os.platform() !== 'win32') return;
		this.initEventListeners();
		this.initializeInjection();
	}

	private initializeInjection = async () => {
		this.log.info('Initializing overlay injection');

		this.log.info('Waiting for 10 seconds to initialize overlay injector');

		await new Promise(resolve => setTimeout(resolve, 10000));

		this.log.info('Initializing overlay injector');

		this.messageHandler.sendMessage('Notification', 'Initializing overlay injector', NotificationType.Info);

		this.overlayInjector = this.getInjector();
		this.log.info('Overlay Injector: ', this.overlayInjector);

		if (!this.overlayInjector) {
			const cpuModel = os.cpus()[0].model;
			this.log.error('Failed to initialize overlay injector using', cpuModel);
			return;
		}

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
						// this.log.info(`Event: `, event, payload);
						break
				}
			}) as (event: string, ...args: unknown[]) => void
		);
	}

	stopInjection = () => {
		this.closeAllOverlays();
		this.overlayInjector?.stop();
		this.overlayInjector = null;
	};

	private handleWindowResize = debounce((resizeEvent: GraphicWindowEventResize) => {
		if (!this.window) return;
		const newRect = this.getCenteredBounds(resizeEvent.width, resizeEvent.height);

		this.window.setBounds(newRect);
		this.window.emit("resize");

		this.window.reload();
		this.log.info(`Resized window: `, this.window.id, this.window.getBounds());
	});

	private getCenteredBounds = (width: number, height: number): Electron.Rectangle => {
		const newHeight = height;
		const newWidth = Math.round((newHeight / 9) * 16);

		// Center the window horizontally
		const x = Math.round((width - newWidth) / 2);
		const y = 0; // Keep at top
		return { x, y, width: newWidth, height: newHeight };
	}

	private handleWindowFocus = debounce((focusEvent: GameWindowEventFocus) => {
		this.log.info(`Game window focus: `, focusEvent);
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

	// TODO: Once stable, inject automatically and handle injectedOverlayIds
	private injectOverlay = async (overlayId: string) => {
		if (!this.overlayInjector) {
			this.log.warn('Overlay injector not initialized');
			this.messageHandler.sendMessage('Notification', 'Overlay injector not initialized', NotificationType.Danger);
			return;
		}

		if (!this.gameWindow) {
			this.log.warn('No game window found');
			this.messageHandler.sendMessage('Notification', 'No game window found', NotificationType.Danger);
			return;
		}

		if (this.injectedOverlayIds.includes(overlayId)) {
			this.messageHandler.sendMessage('Notification', `Disabled the injected overlay`, NotificationType.Warning);
			this.closeOverlay(overlayId);
			this.emitInjectedOverlays();
		} else {
			this.log.info(`Injecting overlay: ${overlayId}`);
			this.injectedOverlayIds.push(overlayId);
			this.emitInjectedOverlays();
		}

		if (this.window) {
			this.log.info(`A window is already injected`);
			return;
		}

		let dolphinWindowSize = { width: 1920, height: 1080 };
		try {
			dolphinWindowSize = await getWindowInfoByPid(this.gameWindow.processId)
			console.log("Dolphin size", dolphinWindowSize);
		} catch (error) {
			this.log.error(error);
		}

		const dolphinWindowBounds = this.getCenteredBounds(dolphinWindowSize.width, dolphinWindowSize.height);
		this.log.info(`Game window size: ${dolphinWindowSize}`);

		this.log.info(`Injecting overlay: ${overlayId}`);

		const port = this.isDev ? '5173' : `${BACKEND_PORT}`;
		this.window = this.createWindow(`http://localhost:${port}/obs/overlay/inject`, dolphinWindowBounds);

		this.overlayInjector.addWindow(this.window.id, {
			name: "StatusBar",
			resizable: false,
			transparent: true,
			maxWidth: this.window.getBounds().width,
			maxHeight: this.window.getBounds().height,
			minWidth: 0,
			minHeight: 0,
			rect: dolphinWindowBounds,
			caption: {
				left: 0,
				right: 0,
				top: 0,
				height: 0,
			},
			nativeHandle: this.window.getNativeWindowHandle().readUInt32LE(0),
		});

		this.window.on("resize", () => {
			if (!this.window) return;
			this.overlayInjector?.sendWindowBounds(this.window.id, { rect: this.window.getBounds() });
		})

		const processPaintEvent = throttle((image: Electron.NativeImage, window: BrowserWindow) => {
			try {
				this.overlayInjector?.sendFrameBuffer(
					window.id,
					image.getBitmap(),
					image.getSize().width,
					image.getSize().height
				);
			} catch (error) {
				this.log.error(error);
			}
		}, 2, { leading: true, trailing: true });

		this.window.webContents.on("paint", (_, __, image) => {
			if (!this.window) return;
			processPaintEvent(image, this.window);
		});

		this.emitInjectedOverlays();

		this.messageHandler.sendMessage('Notification', `Overlay injected: ${overlayId}`, NotificationType.Success);
	}

	private closeOverlay = (overlayId: string) => {
		this.injectedOverlayIds = this.injectedOverlayIds.filter((id) => id !== overlayId);
	};

	closeAllOverlays = () => {
		this.injectedOverlayIds = [];
		this.emitInjectedOverlays();
	}

	private emitInjectedOverlays = () => {
		this.messageHandler.sendMessage('InjectedOverlays', this.injectedOverlayIds);
	}

	injectIntoGame = async (processName: string = "dolphin"): Promise<void> => {
		if (os.platform() !== 'win32') return;
		this.log.info(`CPU Model: ${os.cpus()[0]?.model}`);
		this.log.info(`Searching for game window: ${processName} `);

		await this.initializeInjection();

		if (!this.overlayInjector) {
			this.log.warn(`Overlay injector not initialized`);
			this.messageHandler.sendMessage('Notification', 'Overlay injector not initialized', NotificationType.Danger);
			return;
		}

		const dolphinSettings = this.settingsStore.getDolphinSettings();

		if (dolphinSettings?.Core?.GFXBackend && !["d3", "dx"].some(backend => dolphinSettings?.Core?.GFXBackend?.toLocaleLowerCase().includes(backend))) {
			this.log.warn(`Dolphin settings not using DirectX backend`);
			this.messageHandler.sendMessage('Notification', 'Dolphin settings not using D3D backend', NotificationType.Danger);
			this.stopInjection();
			return;
		}

		this.gameWindow = await this.findGameWindow(processName);

		if (!this.gameWindow) {
			this.log.warn(`No matching game window found`);
			this.stopInjection();
			return;
		}

		const topWindows = this.overlayInjector.getTopWindows();
		const topWindow = topWindows.find((window) => window.processId === this.gameWindow?.processId);

		if (!topWindow) {
			this.log.warn(`Game window not found in top windows`);
			this.stopInjection();
			return;
		}

		this.log.info(`Game window found: `, this.gameWindow);
		const window = this.overlayInjector.injectProcess(topWindow);
		this.log.info(`Injecting overlay into game: `, window);
	};

	private findGameWindow = async (processName: string): Promise<IWindow | undefined> => {

		let windowProcess: ProcessInfo | null = null;
		try {
			windowProcess = await getProcessByName(processName.split(".")[0]);
			this.log.info("Powershell", windowProcess);
			return { title: windowProcess?.MainWindowTitle ?? "Dolphin", processId: windowProcess?.Id ?? 0, threadId: 0, windowId: 0 };
		} catch (error) {
			this.log.error(error);
		}

		return;
	};

	getInjector = () => {
		const cpuModel = os.cpus()[0].model.toLowerCase();
		const isIntel = cpuModel.includes('intel');

		this.log.info(`CPU Model: ${cpuModel}`);
		this.log.info(`Injector Intel Module: `, IntelOverlay);
		this.log.info(`Injector AMD Module: `, AmdOverlay);

		if (isIntel) {
			return IntelOverlay;
		}

		return AmdOverlay;

	};

	initEventListeners() {
		this.clientEmitter.on("InjectOverlay", this.injectOverlay.bind(this));
		this.clientEmitter.on("CloseAllInjectedOverlays", this.closeAllOverlays.bind(this));
		this.clientEmitter.on("CloseInjectedOverlay", this.closeOverlay.bind(this));
	}
}
