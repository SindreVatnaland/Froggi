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
import type { Overlay, SurfaceInfo } from '@asdf-overlay/core';
import type { ElectronOverlaySurface } from '@asdf-overlay/electron/surface';

const DEFAULT_ASPECT_RATIO: AspectRatio = { width: 16, height: 9 };

@singleton()
export class OverlayInjector {
	injectedOverlayIds: string[] = [];

	private window: BrowserWindow | null = null;
	private overlay: Overlay | null = null;
	private surface: ElectronOverlaySurface | null = null;
	// The game's render surface (swapchain) we draw onto. Re-created by the game on fullscreen
	// toggles / backend switches — we follow surface_destroyed → surface_added.
	private surfaceId: bigint | null = null;
	// Physical texture px per BrowserWindow DIP, measured from the first paint (Windows display
	// scaling makes the offscreen texture DIP × scaleFactor). Window DIP size = fit / textureScale.
	private textureScale = 1;
	private gameWidth = 0;
	private gameHeight = 0;
	// In-flight attach, shared so concurrent callers (Dolphin connect + auto-inject) wait for it
	// instead of skipping — two parallel Overlay.attach calls hit ERROR_PIPE_BUSY (os error 231).
	private attachPromise: Promise<void> | null = null;

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
		await this.disconnectSurface();
		if (this.overlay) {
			try {
				this.overlay.detach();
			} catch {
				// already detached
			}
			this.overlay = null;
		}
		this.gameWidth = 0;
		this.gameHeight = 0;
		this.injectedOverlayIds = [];
		this.emitInjectedOverlays();
	};

	/** Drop the current game surface and its offscreen window (the game destroyed it, or we're stopping). */
	private disconnectSurface = async () => {
		const surface = this.surface;
		this.surface = null;
		this.surfaceId = null;
		if (surface) await surface.disconnect().catch((e: unknown) => this.log.warn('Surface disconnect:', e));
		if (this.window && !this.window.isDestroyed()) this.window.close();
		this.window = null;
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

	/** Fit the overlay's aspect ratio to the game's full height, centred; width overflows/crops as needed. */
	private computeFitRect = async (
		gameWidth: number,
		gameHeight: number,
	): Promise<{ width: number; height: number; x: number; y: number }> => {
		const aspect = await this.getReferenceAspectRatio();
		const height = gameHeight;
		const width = Math.round(height * (aspect.width / aspect.height));
		return { width, height, x: Math.round((gameWidth - width) / 2), y: 0 };
	};

	/** Resize the offscreen window to the fit and centre it on the game surface (physical px offset). */
	private applyFit = async (): Promise<void> => {
		const { overlay, window, surfaceId } = this;
		if (!overlay || !window || window.isDestroyed() || surfaceId === null) return;
		if (!this.gameWidth || !this.gameHeight) return;

		const fit = await this.computeFitRect(this.gameWidth, this.gameHeight);
		if (window.isDestroyed() || surfaceId !== this.surfaceId) return; // torn down while awaiting
		this.log.info(`Fit: game=${this.gameWidth}x${this.gameHeight} -> overlay=${fit.width}x${fit.height} pos=(${fit.x},${fit.y})`);
		const dipW = Math.round(fit.width / this.textureScale);
		const dipH = Math.round(fit.height / this.textureScale);
		const [curWidth, curHeight] = window.getSize();
		if (curWidth !== dipW || curHeight !== dipH) {
			window.setSize(dipW, dipH);
			const [w, h] = window.getSize();
			if (w !== dipW || h !== dipH) this.log.warn(`Overlay window size ${w}x${h} != requested ${dipW}x${dipH} (scale ${this.textureScale})`);
		}
		await overlay.setPosition(surfaceId, fit.x, fit.y).catch((e: unknown) => this.log.warn('setPosition failed:', e));
	};

	/**
	 * Measure physical texture px per window DIP from a paint. With Windows display scaling the
	 * offscreen texture is DIP × scaleFactor, so a window sized to the game's physical px paints too
	 * large and spills past the game window. Re-fit once the real ratio is known.
	 */
	private calibrateTextureScale = (e: Electron.Event) => {
		const coded = (e as unknown as { texture?: { textureInfo?: { codedSize?: { width: number } } } })
			.texture?.textureInfo?.codedSize?.width;
		if (!coded || !this.window || this.window.isDestroyed()) return;
		const [dipW] = this.window.getSize();
		if (!dipW) return;
		const scale = coded / dipW;
		if (Math.abs(scale - this.textureScale) < 0.01) return;
		this.log.info(`Texture scale calibrated: ${coded}px / ${dipW}dip = ${scale.toFixed(3)} (was ${this.textureScale})`);
		this.textureScale = scale;
		void this.applyFit();
	};

	injectIntoGame = (processName: string = 'dolphin'): Promise<void> => {
		if (os.platform() !== 'win32' || this.overlay) return Promise.resolve();
		this.attachPromise ??= this.attach(processName).finally(() => {
			this.attachPromise = null;
		});
		return this.attachPromise;
	};

	private attach = async (processName: string): Promise<void> => {
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
		let core: typeof import('@asdf-overlay/core');
		let ElectronOverlaySurface: typeof import('@asdf-overlay/electron/surface').ElectronOverlaySurface;
		try {
			// TS with module:commonjs rewrites `import()` to `require()`, which throws
			// ERR_REQUIRE_ESM against @asdf-overlay/electron's ESM. Force a real dynamic import.
			const dynamicImport = new Function('m', 'return import(m)') as <T = unknown>(m: string) => Promise<T>;
			core = await dynamicImport<typeof import('@asdf-overlay/core')>('@asdf-overlay/core');
			({ ElectronOverlaySurface } = await dynamicImport<typeof import('@asdf-overlay/electron/surface')>(
				'@asdf-overlay/electron/surface',
			));
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

		let overlay: Overlay;
		try {
			const dllDir = core.defaultDllDir().replace('app.asar', 'app.asar.unpacked');
			overlay = await core.Overlay.attach(dllDir, proc.Id, 15000);
			this.log.info('Overlay DLL attached to process');
		} catch (err) {
			this.log.error('Failed to attach overlay:', err);
			void this.errorReporter.report(err, 'Overlay DLL attach');
			this.messageHandler.sendMessage('Notification', 'Failed to attach overlay to game', NotificationType.Danger);
			return;
		}
		this.overlay = overlay;

		const port = this.isDev ? '5173' : `${BACKEND_PORT}`;
		const overlayUrl = `http://localhost:${port}/obs/overlay/inject`;

		const connectSurface = async (id: bigint, width: number, height: number, info: SurfaceInfo) => {
			this.log.info(`Game surface detected: id=${id} ${width}x${height} type=${info.ty.type} keyedMutex=${info.keyedMutex}`);
			this.surfaceId = id;
			this.gameWidth = width;
			this.gameHeight = height;

			const fit = await this.computeFitRect(width, height);
			const window = new BrowserWindow({
				width: Math.round(fit.width / this.textureScale),
				height: Math.round(fit.height / this.textureScale),
				frame: false,
				show: false,
				transparent: true,
				// Offscreen rendering needs an explicit fully-transparent hint — without it
				// Chromium fills transparent regions of the shared texture with an opaque
				// default regardless of page CSS, showing as a solid background in-game.
				backgroundColor: '#00000000',
				// Not `resizable: false`: on Windows that pins the minimum size to the creation size, so
				// setSize could never shrink the window after the game window shrank (overlay stuck oversized).
				webPreferences: {
					backgroundThrottling: false,
					offscreen: { useSharedTexture: true },
				},
			});
			this.window = window;
			// Force a transparent DOM background directly, rather than relying on the app's
			// own store-driven CSS toggle — this re-applies on every navigation, including
			// the reloads triggered by resize/fit changes.
			window.webContents.on('dom-ready', () => {
				void window.webContents.insertCSS(
					'html, body, #svelte, main { background: transparent !important; overflow: hidden !important; }',
				);
			});
			window.webContents.on('paint', this.calibrateTextureScale);
			void window.loadURL(overlayUrl);

			const surface = ElectronOverlaySurface.connect({ overlay, id, info }, window.webContents);
			surface.events.on('error', (e: unknown) => this.log.error('Overlay surface copy failed:', e));
			this.surface = surface;
			await this.applyFit();

			this.log.info('Overlay surface connected');
			this.messageHandler.sendMessage('Notification', 'Overlay attached to game', NotificationType.Success);

			// TEMP DEBUG: dump what the offscreen page is actually rendering — remove once
			// the background/render investigation is done.
			setTimeout(() => void this.debugCapture(), 5000);
		};

		overlay.event.on('surface_added', (id, width, height, info) => {
			if (this.surfaceId !== null) {
				this.log.info(`Ignoring extra surface id=${id} type=${info.ty.type} (already drawing on ${this.surfaceId})`);
				return;
			}
			void connectSurface(id, width, height, info).catch((e: unknown) => this.log.error('Surface connect failed:', e));
		});

		overlay.event.on('surface_resized', debounce((id: bigint, width: number, height: number) => {
			if (id !== this.surfaceId || !this.window || this.window.isDestroyed()) return;
			this.log.info(`Game surface resized: ${width}x${height}`);
			this.gameWidth = width;
			this.gameHeight = height;
			void this.applyFit().then(() => {
				this.window?.reload();
				// TEMP DEBUG: capture post-resize state once content has had time to resync.
				setTimeout(() => void this.debugCapture(), 5000);
			});
		}, 200));

		// Fullscreen toggles / backend switches recreate the swapchain: drop ours, the next
		// surface_added reconnects.
		overlay.event.on('surface_destroyed', (id) => {
			if (id !== this.surfaceId) return;
			this.log.info(`Game surface destroyed: id=${id}`);
			this.surface = null; // its target is gone — nothing to clear
			void this.disconnectSurface();
		});

		overlay.event.on('error', (err) => this.log.error('Overlay IPC error:', err));

		overlay.event.on('disconnected', () => {
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
