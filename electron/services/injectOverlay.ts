import type { ElectronLog } from 'electron-log';
import { delay, inject, singleton } from 'tsyringe';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { BrowserWindow } from 'electron';
import os from 'os';
import { NotificationType } from '../../frontend/src/lib/models/enum';
import { MessageHandler } from './messageHandler';
import { debounce } from 'lodash';
import { getProcessByName } from '../utils/windowManager';
import { BACKEND_PORT } from '../../frontend/src/lib/models/const';
// Type-only imports — erased at compile time, no runtime module load on macOS
import type { Overlay, GpuLuid } from '@asdf-overlay/core';
import type { ElectronOverlaySurface } from '@asdf-overlay/electron/surface';

@singleton()
export class OverlayInjector {
	injectedOverlayIds: string[] = [];

	private window: BrowserWindow | null = null;
	private overlay: Overlay | null = null;
	private surface: ElectronOverlaySurface | null = null;
	private windowId: number | null = null;

	constructor(
		@inject('Dev') private isDev: boolean,
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
	) {
		this.log.info('Initializing Overlay Injection Service');
		if (os.platform() !== 'win32') return;
		this.initEventListeners();
	}

	stopInjection = async () => {
		if (this.surface) {
			await this.surface.disconnect().catch((e: unknown) => this.log.error('Surface disconnect error:', e));
			this.surface = null;
		}
		if (this.overlay) {
			this.overlay.destroy();
			this.overlay = null;
		}
		if (this.window && !this.window.isDestroyed()) {
			this.window.close();
			this.window = null;
		}
		this.windowId = null;
		this.injectedOverlayIds = [];
		this.emitInjectedOverlays();
	};

	injectIntoGame = async (processName: string = 'dolphin'): Promise<void> => {
		if (os.platform() !== 'win32') return;

		if (this.overlay) {
			this.log.info('Overlay already attached, skipping');
			return;
		}

		this.log.info(`Searching for game process: ${processName}`);

		const proc = await getProcessByName(processName.split('.')[0]).catch((e) => {
			this.log.error('Failed to find process:', e);
			return null;
		});

		if (!proc) {
			this.log.warn('No matching game process found');
			this.messageHandler.sendMessage('Notification', 'Game process not found', NotificationType.Danger);
			return;
		}

		// Dynamic imports: only loaded on Windows after platform guard above
		const { Overlay, defaultDllDir, percent } = await import('@asdf-overlay/core');
		const { ElectronOverlaySurface } = await import('@asdf-overlay/electron/surface');

		this.log.info(`Found process: pid=${proc.Id} name=${proc.ProcessName}`);
		this.messageHandler.sendMessage('Notification', 'Attaching overlay…', NotificationType.Info);

		try {
			const dllDir = defaultDllDir().replace('app.asar', 'app.asar.unpacked');
			this.overlay = await Overlay.attach(dllDir, proc.Id, 15000);
			this.log.info('Overlay DLL attached to process');
		} catch (err) {
			this.log.error('Failed to attach overlay:', err);
			this.messageHandler.sendMessage('Notification', 'Failed to attach overlay to game', NotificationType.Danger);
			return;
		}

		const port = this.isDev ? '5173' : `${BACKEND_PORT}`;
		const overlayUrl = `http://localhost:${port}/obs/overlay/inject`;

		this.overlay.event.once('added', async (id: number, width: number, height: number, luid: GpuLuid) => {
			this.log.info(`Game window detected: id=${id} ${width}x${height}`);
			this.windowId = id;

			this.window = new BrowserWindow({
				width,
				height,
				frame: false,
				show: false,
				transparent: true,
				resizable: false,
				webPreferences: {
					backgroundThrottling: false,
					offscreen: { useSharedTexture: true } as unknown as boolean,
				},
			});
			this.window.loadURL(overlayUrl);

			await this.overlay!.setPosition(id, percent(0), percent(0));
			await this.overlay!.setAnchor(id, percent(0), percent(0));

			this.surface = ElectronOverlaySurface.connect(
				{ id, overlay: this.overlay! },
				luid,
				this.window.webContents,
			);

			this.log.info('Overlay surface connected');
			this.messageHandler.sendMessage('Notification', 'Overlay attached to game', NotificationType.Success);
		});

		this.overlay.event.on('resized', debounce((id: number, width: number, height: number) => {
			if (id !== this.windowId || !this.window || this.window.isDestroyed()) return;
			this.log.info(`Game window resized: ${width}x${height}`);
			this.window.setSize(width, height);
			this.window.reload();
		}, 200));

		this.overlay.event.on('disconnected', () => {
			this.log.info('Overlay disconnected from process');
			void this.stopInjection();
		});
	};

	private injectOverlay = async (overlayId: string) => {
		if (!this.overlay) {
			this.log.warn('No game attached — connect Dolphin first');
			this.messageHandler.sendMessage(
				'Notification',
				'No game attached. Connect Dolphin first.',
				NotificationType.Danger,
			);
			return;
		}

		if (this.injectedOverlayIds.includes(overlayId)) {
			this.messageHandler.sendMessage('Notification', 'Overlay disabled', NotificationType.Warning);
			this.closeOverlay(overlayId);
		} else {
			this.log.info(`Enabling overlay: ${overlayId}`);
			this.injectedOverlayIds.push(overlayId);
			this.messageHandler.sendMessage('Notification', 'Overlay enabled', NotificationType.Success);
		}

		this.emitInjectedOverlays();
	};

	private closeOverlay = (overlayId: string) => {
		this.injectedOverlayIds = this.injectedOverlayIds.filter((id) => id !== overlayId);
	};

	closeAllOverlays = () => {
		this.injectedOverlayIds = [];
		this.emitInjectedOverlays();
	};

	private emitInjectedOverlays = () => {
		this.messageHandler.sendMessage('InjectedOverlays', this.injectedOverlayIds);
	};

	private initEventListeners() {
		this.clientEmitter.on('InjectOverlay', this.injectOverlay.bind(this));
		this.clientEmitter.on('CloseAllInjectedOverlays', this.closeAllOverlays.bind(this));
		this.clientEmitter.on('CloseInjectedOverlay', this.closeOverlay.bind(this));
	}
}
