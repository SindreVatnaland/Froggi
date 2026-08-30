import type { ElectronLog } from 'electron-log';
import { delay, inject, singleton } from 'tsyringe';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { app, BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { NotificationType } from '../../frontend/src/lib/models/enum';
import { MessageHandler } from './messageHandler';
import { debounce } from 'lodash';
import { getProcessByName } from '../utils/windowManager';
import { scopedLog } from '../utils/logger';
import { BACKEND_PORT } from '../../frontend/src/lib/models/const';
import { ErrorReporter } from './errorReporter';
import { ElectronOverlayStore } from './store/storeOverlay';
import { ElectronFroggiStore } from './store/storeFroggi';
import { ConnectionState } from '../../frontend/src/lib/models/enum';
import type { AspectRatio } from '../../frontend/src/lib/models/types/overlay';
// Type-only imports — erased at compile time, no runtime module load on macOS
import type { Overlay, GpuLuid, length as lengthFn } from '@asdf-overlay/core';
import type { ElectronOverlaySurface } from '@asdf-overlay/electron/surface';

const DEFAULT_ASPECT_RATIO: AspectRatio = { width: 16, height: 9 };

@singleton()
export class OverlayInjector {
	injectedOverlayIds: string[] = [];

	private window: BrowserWindow | null = null;
	private overlay: Overlay | null = null;
	private surface: ElectronOverlaySurface | null = null;
	private windowId: number | null = null;
	private length: typeof lengthFn | null = null;
	private gameWidth = 0;
	private gameHeight = 0;

	constructor(
		@inject('Dev') private isDev: boolean,
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject('LocalEmitter') private localEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(delay(() => ErrorReporter)) private errorReporter: ErrorReporter,
		@inject(delay(() => ElectronOverlayStore)) private storeOverlay: ElectronOverlayStore,
		@inject(delay(() => ElectronFroggiStore)) private storeFroggi: ElectronFroggiStore,
	) {
		this.log = scopedLog(this.log, 'Injection');
		this.log.info('Initializing Overlay Injection Service');
		// Listeners run on every platform so the inject TOGGLE + auto-inject setting persist and
		// broadcast even on macOS/Linux — the actual DLL injection stays win32-guarded further down.
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
		this.gameWidth = 0;
		this.gameHeight = 0;
		this.injectedOverlayIds = [];
		this.emitInjectedOverlays();
	};

	/** Aspect ratio driving the letterbox fit — the first currently-injected overlay's, or 16:9 if none. */
	private getReferenceAspectRatio = async (): Promise<AspectRatio> => {
		const overlayId = this.injectedOverlayIds[0];
		if (overlayId) {
			const overlay = await this.storeOverlay.getOverlayById(overlayId);
			if (overlay?.aspectRatio?.width && overlay?.aspectRatio?.height) return overlay.aspectRatio;
		}
		return DEFAULT_ASPECT_RATIO;
	};

	/** Always fit the overlay's aspect ratio to the game window's full height, centered horizontally — width overflows/crops as needed. */
	private computeFitRect = async (
		gameWidth: number,
		gameHeight: number,
	): Promise<{ width: number; height: number; x: number; y: number }> => {
		const aspect = await this.getReferenceAspectRatio();
		const targetAspect = aspect.width / aspect.height;

		const height = gameHeight;
		const width = Math.round(height * targetAspect);

		const x = Math.round((gameWidth - width) / 2);
		const y = 0;
		return { width, height, x, y };
	};

	/** Recompute the letterboxed fit for the current game window size and reposition/resize the injected window. */
	private applyFit = async (): Promise<void> => {
		if (!this.overlay || !this.window || this.window.isDestroyed() || this.windowId === null || !this.length) return;
		if (!this.gameWidth || !this.gameHeight) return;

		const fit = await this.computeFitRect(this.gameWidth, this.gameHeight);
		this.log.info(
			`Fit: game=${this.gameWidth}x${this.gameHeight} -> window=${fit.width}x${fit.height} pos=(${fit.x},${fit.y})`,
		);
		const [curWidth, curHeight] = this.window.getSize();
		if (curWidth !== fit.width || curHeight !== fit.height) {
			this.window.setSize(fit.width, fit.height);
		}
		await this.overlay.setPosition(this.windowId, this.length(fit.x), this.length(fit.y));
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
		let length: typeof import('@asdf-overlay/core').length;
		let ElectronOverlaySurface: typeof import('@asdf-overlay/electron/surface').ElectronOverlaySurface;
		try {
			// TS with module:commonjs rewrites `import()` to `require()`, which throws
			// ERR_REQUIRE_ESM against @asdf-overlay's ESM. Force a real dynamic import.
			const dynamicImport = new Function('m', 'return import(m)') as <T = unknown>(m: string) => Promise<T>;
			const core = await dynamicImport<typeof import('@asdf-overlay/core')>('@asdf-overlay/core');
			const electron = await dynamicImport<typeof import('@asdf-overlay/electron/surface')>(
				'@asdf-overlay/electron/surface',
			);
			({ Overlay, defaultDllDir, percent, length } = core);
			({ ElectronOverlaySurface } = electron);
			this.length = length;
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
			this.gameWidth = width;
			this.gameHeight = height;

			const fit = await this.computeFitRect(width, height);
			this.log.info(
				`Fit: game=${width}x${height} -> window=${fit.width}x${fit.height} pos=(${fit.x},${fit.y})`,
			);

			this.window = new BrowserWindow({
				width: fit.width,
				height: fit.height,
				frame: false,
				show: false,
				transparent: true,
				// Offscreen rendering needs an explicit fully-transparent hint — without it
				// Chromium fills transparent regions of the shared texture with an opaque
				// default regardless of page CSS, showing as a solid background in-game.
				backgroundColor: '#00000000',
				resizable: false,
				webPreferences: {
					backgroundThrottling: false,
					offscreen: { useSharedTexture: true } as unknown as boolean,
				},
			});
			// Force a transparent DOM background directly, rather than relying on the app's
			// own store-driven CSS toggle — this re-applies on every navigation, including
			// the reloads triggered by resize/fit changes.
			this.window.webContents.on('dom-ready', () => {
				void this.window?.webContents.insertCSS(
					'html, body, #svelte, main { background: transparent !important; overflow: hidden !important; }',
				);
			});
			this.window.loadURL(overlayUrl);

			await this.overlay!.setPosition(id, length(fit.x), length(fit.y));
			await this.overlay!.setAnchor(id, percent(0), percent(0));

			this.surface = ElectronOverlaySurface.connect(
				{ id, overlay: this.overlay! },
				luid,
				this.window.webContents,
			);

			this.log.info('Overlay surface connected');
			this.messageHandler.sendMessage('Notification', 'Overlay attached to game', NotificationType.Success);

			// TEMP DEBUG: dump what the offscreen page is actually rendering — remove once
			// the background/render investigation is done.
			setTimeout(() => void this.debugCapture(), 5000);
		});

		this.overlay.event.on('resized', debounce((id: number, width: number, height: number) => {
			if (id !== this.windowId || !this.window || this.window.isDestroyed()) return;
			this.log.info(`Game window resized: ${width}x${height}`);
			this.gameWidth = width;
			this.gameHeight = height;
			void this.applyFit().then(() => {
				this.window?.reload();
				// TEMP DEBUG: capture post-resize state once content has had time to resync.
				setTimeout(() => void this.debugCapture(), 5000);
			});
		}, 200));

		this.overlay.event.on('disconnected', () => {
			this.log.info('Overlay disconnected from process');
			void this.stopInjection();
		});
	};

	// Toggles an overlay in the persisted inject set (source of truth for "toggled to inject"), then
	// injects/removes it now if a game is attached. Persisting works on every platform so the toggle
	// "stays on" and auto-injects on the next Dolphin connect (win32).
	private injectOverlay = async (overlayId: string) => {
		const persisted = this.storeFroggi.getAutoInjectOverlayIds();
		const isToggled = persisted.includes(overlayId);

		if (isToggled) {
			this.storeFroggi.setAutoInjectOverlayIds(persisted.filter((id) => id !== overlayId));
			this.emitAutoInjectOverlays();
			if (this.injectedOverlayIds.includes(overlayId)) {
				this.closeOverlay(overlayId);
				void this.applyFit();
				this.emitInjectedOverlays();
			}
			this.messageHandler.sendMessage('Notification', 'Overlay injection disabled', NotificationType.Warning);
			return;
		}

		this.storeFroggi.setAutoInjectOverlayIds([...persisted, overlayId]);
		this.emitAutoInjectOverlays();

		if (os.platform() !== 'win32') {
			this.messageHandler.sendMessage('Notification', 'Overlay injection is Windows-only', NotificationType.Info);
			return;
		}
		await this.injectNow(overlayId);
	};

	// Injects a single overlay into the attached game right now (win32). If no game is attached it
	// attempts to attach first; if still none, the toggle stays on and it'll auto-inject on connect.
	private injectNow = async (overlayId: string) => {
		if (os.platform() !== 'win32') return;
		if (!this.overlay) {
			this.log.info('No overlay attached yet — attempting attach before injecting');
			await this.injectIntoGame();
		}
		if (!this.overlay) {
			this.messageHandler.sendMessage(
				'Notification',
				'Toggled on — will inject when Dolphin connects.',
				NotificationType.Info,
			);
			return;
		}
		if (!this.injectedOverlayIds.includes(overlayId)) {
			this.log.info(`Enabling overlay: ${overlayId}`);
			this.injectedOverlayIds.push(overlayId);
			this.messageHandler.sendMessage('Notification', 'Overlay enabled', NotificationType.Success);
		}
		void this.applyFit();
		this.emitInjectedOverlays();
	};

	// Auto-inject the persisted toggle set when Dolphin connects, if the setting is on.
	private autoInjectOnConnect = debounce(async () => {
		if (os.platform() !== 'win32') return;
		if (!this.storeFroggi.getAutoInjectEnabled()) return;
		const ids = this.storeFroggi.getAutoInjectOverlayIds();
		if (!ids.length) return;
		this.log.info('Auto-injecting overlays on Dolphin connect:', ids);
		for (const id of ids) await this.injectNow(id);
	}, 500);

	// TEMP DEBUG: remove once the background/render investigation is done.
	private debugCapture = async () => {
		if (!this.window || this.window.isDestroyed()) return;
		const image = await this.window.webContents.capturePage();
		const outPath = path.join(app.getPath('userData'), 'overlay-debug.png');
		fs.writeFileSync(outPath, image.toPNG());
		this.log.info(`Debug screenshot saved to ${outPath}`);

		try {
			const info = await this.window.webContents.executeJavaScript(`(() => {
				const cs = (el) => el ? getComputedStyle(el).backgroundColor : null;
				const dims = (el) => el ? {
					scrollW: el.scrollWidth, scrollH: el.scrollHeight,
					clientW: el.clientWidth, clientH: el.clientHeight,
					offsetW: el.offsetWidth, offsetH: el.offsetHeight,
				} : null;
				const board = document.querySelector('[id^="layer-"]')?.parentElement;
				return JSON.stringify({
					location: location.pathname,
					isElectron: typeof window.electron,
					innerWidth: window.innerWidth,
					innerHeight: window.innerHeight,
					devicePixelRatio: window.devicePixelRatio,
					htmlBg: cs(document.documentElement),
					bodyBg: cs(document.body),
					htmlDims: dims(document.documentElement),
					bodyDims: dims(document.body),
					boardDims: dims(board),
					boardInlineStyle: board?.getAttribute('style'),
					injectedCount: document.querySelectorAll('[id^="layer-"]').length,
				});
			})()`);
			this.log.info(`Debug page state: ${info}`);
		} catch (err) {
			this.log.error('Debug executeJavaScript failed:', err);
		}
	};

	private closeOverlay = (overlayId: string) => {
		this.injectedOverlayIds = this.injectedOverlayIds.filter((id) => id !== overlayId);
	};

	closeAllOverlays = () => {
		this.injectedOverlayIds = [];
		this.emitInjectedOverlays();
	};

	/** Public toggle for the MCP: add/remove an overlay from the persisted inject set (and inject/close now if applicable). */
	setOverlayInjection = async (overlayId: string, enabled: boolean) => {
		const inSet = this.storeFroggi.getAutoInjectOverlayIds().includes(overlayId);
		if (enabled !== inSet) await this.injectOverlay(overlayId);
		return this.storeFroggi.getAutoInjectOverlayIds();
	};

	private emitInjectedOverlays = () => {
		this.messageHandler.sendMessage('InjectedOverlays', this.injectedOverlayIds);
	};

	private emitAutoInjectOverlays = () => {
		this.messageHandler.sendMessage('AutoInjectOverlays', this.storeFroggi.getAutoInjectOverlayIds());
	};

	private initEventListeners() {
		this.clientEmitter.on('InjectOverlay', this.injectOverlay.bind(this));
		this.clientEmitter.on('CloseAllInjectedOverlays', this.closeAllOverlays.bind(this));
		this.clientEmitter.on('CloseInjectedOverlay', this.closeOverlay.bind(this));
		// Auto-inject the toggled set when Dolphin connects (localEmitter mirrors sendMessage events).
		this.localEmitter.on('DolphinConnectionState', (state: ConnectionState | undefined) => {
			if (state === ConnectionState.Connected) void this.autoInjectOnConnect();
		});
	}
}
