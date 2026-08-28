import type { ElectronLog } from 'electron-log';
import { delay, inject, singleton } from 'tsyringe';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { BrowserWindow } from 'electron';
import os from 'os';
import { NotificationType } from '../../frontend/src/lib/models/enum';
import { MessageHandler } from './messageHandler';
import { debounce } from 'lodash';
import { getProcessByName } from '../utils/windowManager';
import { scopedLog } from '../utils/logger';
import { BACKEND_PORT } from '../../frontend/src/lib/models/const';
import { ErrorReporter } from './errorReporter';
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
		@inject(delay(() => ErrorReporter)) private errorReporter: ErrorReporter,
	) {
		this.log = scopedLog(this.log, 'Injection');
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

		// Dynamic imports: only loaded on Windows after platform guard above.
		// These are optionalDependencies with native binaries — if they fail to load
		// (missing from the package, ABI mismatch, etc.) surface the real reason instead
		// of dead-ending later with a generic "No game attached".
		let Overlay: typeof import('@asdf-overlay/core').Overlay;
		let defaultDllDir: typeof import('@asdf-overlay/core').defaultDllDir;
		let percent: typeof import('@asdf-overlay/core').percent;
		let ElectronOverlaySurface: typeof import('@asdf-overlay/electron/surface').ElectronOverlaySurface;
		try {
			// TS with module:commonjs rewrites `import()` to `require()`, which throws
			// ERR_REQUIRE_ESM against @asdf-overlay's ESM. Force a real dynamic import.
			const dynamicImport = new Function('m', 'return import(m)') as <T = unknown>(m: string) => Promise<T>;
			const core = await dynamicImport<typeof import('@asdf-overlay/core')>('@asdf-overlay/core');
			const electron = await dynamicImport<typeof import('@asdf-overlay/electron/surface')>(
				'@asdf-overlay/electron/surface',
			);
			({ Overlay, defaultDllDir, percent } = core);
			({ ElectronOverlaySurface } = electron);
		} catch (err) {
			this.log.error('Failed to load overlay injection module:', err);
			void this.errorReporter.report(err, 'Overlay injection module load');
			this.messageHandler.sendMessage(
				'Notification',
				'Overlay injection unavailable — failed to load native module. See logs.',
				NotificationType.Danger,
			);
			return;
		}

		this.log.info(`Found process: pid=${proc.Id} name=${proc.ProcessName}`);
		this.messageHandler.sendMessage('Notification', 'Attaching overlay…', NotificationType.Info);

		try {
			const dllDir = defaultDllDir().replace('app.asar', 'app.asar.unpacked');
			this.overlay = await Overlay.attach(dllDir, proc.Id, 15000);
			this.log.info('Overlay DLL attached to process');
		} catch (err) {
			this.log.error('Failed to attach overlay:', err);
			void this.errorReporter.report(err, 'Overlay DLL attach');
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
		// If the auto-attach on Dolphin connect didn't take (or hasn't run yet),
		// try once more now before giving up — makes the Inject button self-healing.
		if (!this.overlay) {
			this.log.info('No overlay attached yet — attempting attach before injecting');
			await this.injectIntoGame();
		}

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
