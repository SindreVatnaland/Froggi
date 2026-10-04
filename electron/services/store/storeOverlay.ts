import Store from 'electron-store';
import type { AspectRatio, ElementPayload, GridContentItem, Layer, Overlay, OverlayEditor, Scene, SharedOverlay } from '../../../frontend/src/lib/models/types/overlay';
import type { CustomElement } from '../../../frontend/src/lib/models/constants/customElement';
import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { MessageHandler } from '../messageHandler';
import { newId } from '../../utils/functions';
import { TypedEmitter } from '../../../frontend/src/lib/utils/customEventEmitter';
import { BrowserWindow, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { LiveStatsScene, NotificationType } from '../../../frontend/src/lib/models/enum';
import { cloneDeep, isNil, kebabCase, merge } from 'lodash';
import { findFilesStartingWith, getCustomFiles, saveCustomFiles } from '../../utils/fileHandler';
import { COL, MIN } from '../../../frontend/src/lib/models/const';
import gridHelp from "../../utils/gridHelp.js"
import { ElectronFroggiStore } from './storeFroggi';
import { SqliteOverlay } from './../sqlite/sqliteOverlay';
import semver from 'semver'
import { OverlayEntity } from 'services/sqlite/entities/overlay/overlayEntity';
import { fillOverlayDefaults, getNewOverlay } from './../../utils/overlayHandler';

/** Grid placement patch (grid is COL x COL units). Any omitted field keeps the item's current value. */
export type GridPosition = { x?: number; y?: number; w?: number; h?: number };

/** Clamps a placement patch to the grid so an element can't be positioned/sized off-canvas. */
const clampGridPosition = (current: { x: number; y: number; w: number; h: number }, pos: GridPosition) => {
	const w = Math.max(MIN, Math.min(COL, Math.round(pos.w ?? current.w)));
	const h = Math.max(MIN, Math.min(COL, Math.round(pos.h ?? current.h)));
	const x = Math.max(0, Math.min(COL - w, Math.round(pos.x ?? current.x)));
	const y = Math.max(0, Math.min(COL - h, Math.round(pos.y ?? current.y)));
	return { x, y, w, h };
};

/**
 * Builds a grid item. Uses `position` when given (clamped), otherwise auto-places in the first
 * free grid space relative to `existingItems`. Shared by single and batch element adds.
 */
const buildGridItem = (
	elementId: CustomElement,
	payload: ElementPayload,
	existingItems: GridContentItem[],
	position?: GridPosition,
	itemId: string = newId(),
): GridContentItem => {
	const item: GridContentItem = {
		[COL]: gridHelp.item({ w: 24, h: 24, x: 0, y: 0, min: { w: MIN, h: MIN }, max: { y: COL - MIN, h: COL + 1 } }),
		id: itemId,
		elementId,
		data: payload,
	};
	if (position) {
		item[COL] = { ...item[COL], ...clampGridPosition(item[COL], position) };
	} else {
		item[COL] = { ...item[COL], ...gridHelp.findSpace(item, existingItems, COL) };
	}
	return item;
};

@singleton()
export class ElectronOverlayStore {
	constructor(
		@inject('AppDir') private appDir: string,
		@inject('BrowserWindow') private mainWindow: BrowserWindow,
		@inject('Dev') private isDev: boolean,
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ElectronStore') private store: Store,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(ElectronFroggiStore) private froggiStore: ElectronFroggiStore,
		@inject(SqliteOverlay) private sqliteOverlay: SqliteOverlay,
	) {
		this.log.info('Initializing Obs Overlay Store');
		this.initDemoOverlays();
		this.migrateOverlays();
		this.initListeners();

		this.initSvelteListeners();
	}

	async getOverlays(): Promise<Record<string, OverlayEntity>> {
		const overlays = await this.sqliteOverlay.getOverlays()
		return overlays.reduce((acc, overlay) => {
			acc[overlay.id] = overlay;
			return acc;
		}, {} as Record<string, OverlayEntity>);
	}

	async setOverlay(value: Overlay) {
		await this.persistOverlay(value);
		await this.emitOverlayUpdate();
	}

	/** Save an overlay WITHOUT broadcasting. Use in bulk loops, then emit once at the end. */
	private async persistOverlay(value: Overlay) {
		if (!value) return;
		const froggiVersion = this.froggiStore.getFroggiConfig().version ?? "0.0.0";
		const overlay = { ...value, froggiVersion } as Overlay;
		await this.sqliteOverlay.addOrUpdateOverlay(overlay);
	}

	getScene(overlayId: string, statsScene: string): Scene {
		return this.store.get(`obs.layout.overlays.${overlayId}.${statsScene}`) as Scene
	}

	async setScene(overlayId: string, statsScene: LiveStatsScene, scene: Scene): Promise<Scene | undefined> {
		this.log.info("Update scene", overlayId, statsScene, scene.id);

		for (const [index, layer] of scene.layers.entries()) {
			layer.index = index;
		};

		scene.layers.sort((a, b) => a.index - b.index);

		const updatedScene = await this.sqliteOverlay.addOrUpdateScene(scene);
		if (!updatedScene) return;
		this.messageHandler.sendMessage('SceneUpdate', overlayId, statsScene, updatedScene);
		return updatedScene;
	}

	async getOverlayById(overlayId: string): Promise<Overlay | undefined> {
		const overlays = await this.getOverlays()
		return overlays[overlayId]
	}

	/**
	 * Downloads a font file from a URL and saves it under the overlay's font dir, returning the saved
	 * filename to use as `font.src`. https only; accepts only real font files (.ttf/.otf/.woff/.woff2
	 * by extension or content-type), capped at 5MB. Used by MCP overlay-write tools.
	 */
	async downloadFont(overlayId: string, url: string, fileName?: string): Promise<{ fileName: string } | { error: string }> {
		const overlay = await this.getOverlayById(overlayId);
		if (isNil(overlay)) return { error: `No overlay with id "${overlayId}"` };

		let u: URL;
		try { u = new URL(url); } catch { return { error: 'Invalid URL' }; }
		if (u.protocol !== 'https:') return { error: 'Font URL must be https' };

		const FONT_EXT_BY_CT: Record<string, string> = {
			'font/ttf': '.ttf', 'application/x-font-ttf': '.ttf', 'application/font-sfnt': '.ttf',
			'font/otf': '.otf', 'application/x-font-otf': '.otf',
			'font/woff': '.woff', 'application/font-woff': '.woff',
			'font/woff2': '.woff2', 'application/font-woff2': '.woff2',
		};
		const ALLOWED = ['.ttf', '.otf', '.woff', '.woff2'];
		const urlExt = path.extname(u.pathname).toLowerCase();

		let res: Response;
		try { res = await fetch(url); } catch (e) { return { error: `Download failed: ${(e as Error).message}` }; }
		if (!res.ok) return { error: `Download failed: HTTP ${res.status}` };

		const ct = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
		const ext = ALLOWED.includes(urlExt) ? urlExt : FONT_EXT_BY_CT[ct];
		if (!ext) return { error: 'Not a font file — expected .ttf/.otf/.woff/.woff2 (by URL extension or content-type)' };

		const buf = Buffer.from(await res.arrayBuffer());
		if (buf.length > 5 * 1024 * 1024) return { error: 'Font too large (>5MB)' };
		if (buf.length === 0) return { error: 'Downloaded font is empty' };

		const rawBase = fileName ?? path.basename(u.pathname, urlExt);
		const base = rawBase.replace(/\.[^.]*$/, '').replace(/[^a-zA-Z0-9_-]/g, '') || 'font';
		const saveDir = path.join(this.appDir, 'public', 'custom', overlayId, 'font');
		fs.mkdirSync(saveDir, { recursive: true });
		const finalName = `${base}${ext}`;
		fs.writeFileSync(path.join(saveDir, finalName), buf);
		this.log.info('Downloaded overlay font', overlayId, finalName, `${buf.length}b`);
		return { fileName: finalName };
	}

	/**
	 * Stores an image for an overlay under public/custom/<overlayId>/image/ and returns the file name
	 * to reference (element `image.name`, or scene `background.customImage.name`). Exactly one source:
	 * an http(s) URL, a local file path, base64 data, or `picker` (opens a file dialog in Froggi for
	 * the user). Images only (png/jpg/jpeg/gif/webp/svg/avif), max 15MB. Used by MCP overlay-write tools.
	 */
	async saveOverlayImage(
		overlayId: string,
		source: { url?: string; filePath?: string; base64?: string; picker?: boolean },
		fileName?: string,
	): Promise<{ fileName: string } | { error: string } | { canceled: true }> {
		if (!(await this.getOverlayById(overlayId))) return { error: `No overlay with id "${overlayId}"` };
		const EXT_BY_CT: Record<string, string> = {
			'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp',
			'image/svg+xml': '.svg', 'image/avif': '.avif',
		};
		const ALLOWED = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif'];
		const MAX = 15 * 1024 * 1024;

		let buf: Buffer;
		let ext = '';
		let baseName = fileName ?? '';
		try {
			if (source.url) {
				const u = new URL(source.url);
				if (u.protocol !== 'https:' && u.protocol !== 'http:') return { error: 'Image URL must be http(s)' };
				const res = await fetch(u);
				if (!res.ok) return { error: `Download failed: HTTP ${res.status}` };
				const ct = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
				const urlExt = path.extname(u.pathname).toLowerCase();
				ext = ALLOWED.includes(urlExt) ? urlExt : EXT_BY_CT[ct] ?? '';
				buf = Buffer.from(await res.arrayBuffer());
				baseName ||= path.basename(u.pathname, urlExt);
			} else if (source.filePath || source.picker) {
				let filePath = source.filePath;
				if (!filePath) {
					this.mainWindow.show();
					this.mainWindow.focus();
					const { canceled, filePaths } = await dialog.showOpenDialog(this.mainWindow, {
						title: 'Choose an image for the overlay',
						properties: ['openFile'],
						filters: [{ name: 'Images', extensions: ALLOWED.map((e) => e.slice(1)) }],
					});
					if (canceled || !filePaths[0]) return { canceled: true };
					filePath = filePaths[0];
				}
				ext = path.extname(filePath).toLowerCase();
				if (fs.statSync(filePath).size > MAX) return { error: 'Image too large (>15MB)' };
				buf = fs.readFileSync(filePath);
				baseName ||= path.basename(filePath, ext);
			} else if (source.base64) {
				const m = /^data:([^;]+);base64,/.exec(source.base64);
				ext = (m && EXT_BY_CT[m[1]]) || path.extname(fileName ?? '').toLowerCase();
				buf = Buffer.from(source.base64.replace(/^data:[^,]*,/, ''), 'base64');
			} else {
				return { error: 'Provide one of url, filePath, base64 or picker' };
			}
		} catch (e) {
			return { error: `Could not read image: ${(e as Error).message}` };
		}
		if (ext === '.jpeg') ext = '.jpg';
		if (!ALLOWED.includes(ext)) return { error: 'Not a supported image (png/jpg/gif/webp/svg/avif) — check the extension or content type' };
		if (!buf.length) return { error: 'Image is empty' };
		if (buf.length > MAX) return { error: 'Image too large (>15MB)' };

		const base = baseName.replace(/\.[^.]*$/, '').replace(/[^a-zA-Z0-9_-]/g, '') || 'image';
		const saveDir = path.join(this.appDir, 'public', 'custom', overlayId, 'image');
		fs.mkdirSync(saveDir, { recursive: true });
		let finalName = `${base}${ext}`;
		if (fs.existsSync(path.join(saveDir, finalName))) finalName = `${base}-${newId()}${ext}`;
		fs.writeFileSync(path.join(saveDir, finalName), buf);
		this.log.info('Saved overlay image', overlayId, finalName, `${buf.length}b`);
		return { fileName: finalName };
	}

	/**
	 * Patches a scene's config (active/fallback/font/background/scene-switch animation), leaving
	 * layers/items untouched. font/background/animation are deep-merged so a partial patch keeps the
	 * rest of the structure. Used by MCP overlay-write tools.
	 */
	async setSceneConfig(
		overlayId: string,
		statsScene: LiveStatsScene,
		patch: Partial<Pick<Scene, 'active' | 'fallback' | 'font' | 'background' | 'animation'>>,
	): Promise<Scene | undefined> {
		const overlay = await this.getOverlayById(overlayId);
		const scene = overlay?.[statsScene];
		if (isNil(overlay) || isNil(scene)) return;

		if (patch.active !== undefined) scene.active = patch.active;
		if (patch.fallback !== undefined) scene.fallback = patch.fallback;
		if (patch.font) scene.font = merge({}, scene.font, patch.font);
		if (patch.background) scene.background = merge({}, scene.background, patch.background);
		if (patch.animation) scene.animation = merge({}, scene.animation, patch.animation);

		return this.setScene(overlayId, statsScene, scene);
	}

	async createOverlay(aspectRatio: AspectRatio, title?: string): Promise<string> {
		const overlay = getNewOverlay(aspectRatio);
		if (title) overlay.title = title;
		await this.setOverlay(overlay);
		return overlay.id;
	}

	removeDuplicateItems(): void {
		const overlays = Object.values(this.getOverlays())
		overlays.forEach(this.removeDuplicateOverlayItems.bind(this))
	}

	async removeDuplicateItemsByOverlayId(overlayId: string): Promise<void> {
		const overlay = await this.getOverlayById(overlayId)
		if (isNil(overlay)) return;
		this.removeDuplicateOverlayItems(overlay)
	}

	removeDuplicateOverlayItems(overlay: Overlay): Overlay {
		Object.keys(LiveStatsScene)
			.filter(key => isNaN(Number(key)))
			.forEach(key => {
				const statsScene = LiveStatsScene[key as keyof typeof LiveStatsScene];
				overlay[statsScene].layers.forEach(layer => {
					layer.items = layer.items.reduce((acc: GridContentItem[], currentItem) => {
						const existingItem = acc.find(item => item.id === currentItem.id);
						if (!existingItem) {
							acc.push(currentItem);
						}
						return acc;
					}, []);
				});
			});

		this.setOverlay(overlay)

		return overlay;
	}

	async cleanupCustomResources() {
		const overlays = await this.getOverlays()
		Object.values(overlays).forEach((overlay) => this.cleanupCustomResourceByOverlayId(overlay.id))
	}

	async cleanupCustomResourceByOverlayId(overlayId: string) {
		const overlay = await this.getOverlayById(overlayId)
		if (isNil(overlay)) return;
		const itemsKebabId = Object.values(LiveStatsScene).map(statsScene => {
			return overlay[statsScene]?.layers?.map((layer: Layer) => layer.items).flat() ?? []
		}).flat()
			.map(item => kebabCase(item.id))
		const customFileEntry = path.join(this.appDir, "public", "custom", overlay.id)
		if (!fs.existsSync(customFileEntry)) {
			this.log.verbose("Path:", customFileEntry, "does not exist")
			return;
		}
		const storedCustomTypes = fs.readdirSync(customFileEntry, { withFileTypes: true })
			.filter(dirent => dirent.isDirectory())
			.map(dirent => dirent.name);
		storedCustomTypes.forEach(type => {
			const fileTypeDir = path.join(customFileEntry, type)
			const existingFiles = fs.readdirSync(fileTypeDir, { withFileTypes: true })
				.map(dirent => dirent.name)
			existingFiles.forEach(file => {
				// Deletes all files with name different from any item id's
				if (itemsKebabId.some(id => file.includes(id))) return;
				const filePath = path.join(fileTypeDir, file)
				fs.rmSync(filePath)
			})
		})
	}

	updateOverlay(overlay: Overlay): void {
		if (!overlay || overlay.isDemo) return;
		this.setOverlay(overlay)
	}

	async copyOverlay(overlayId: string): Promise<void> {
		const overlay = await this.getOverlayById(overlayId);
		if (isNil(overlay)) return;

		const newOverlay = { ...overlay, id: newId(), title: `${overlay.title} - copy`, isDemo: false, deletedAt: null }
		Object.keys(LiveStatsScene)
			.filter(key => isNaN(Number(key)))
			.forEach(key => {
				const statsScene = LiveStatsScene[key as keyof typeof LiveStatsScene];
				if (!newOverlay[statsScene]) return;
				newOverlay[statsScene].layers.forEach(layer => {
					delete layer.id;
				})
				delete newOverlay[statsScene].id
			})

		this.setOverlay(newOverlay);
		const source = path.join(this.appDir, "public", "custom", overlayId)
		const destination = path.join(this.appDir, "public", "custom", newOverlay.id)
		if (fs.existsSync(source)) {
			fs.cp(source, destination, { recursive: true }, (err => { if (err) this.log.error(err) }));
		}
	}

	async uploadOverlay(overlay: Overlay, overlayId: string = newId()): Promise<void> {
		overlay.id = overlayId;
		this.clearOverlay(overlay)
		await this.setOverlay(overlay)
	}

	/** Soft delete: moves the overlay to Deleted Overlays (restorable). Files are kept. */
	async deleteOverlay(overlayId: string): Promise<boolean> {
		return this.setDeletedAt(overlayId, new Date().toISOString());
	}

	async restoreOverlay(overlayId: string): Promise<boolean> {
		return this.setDeletedAt(overlayId, null);
	}

	private async setDeletedAt(overlayId: string, deletedAt: string | null): Promise<boolean> {
		const overlay = await this.getOverlayById(overlayId);
		if (!overlay) return false;
		this.log.info(deletedAt ? 'Moving overlay to deleted:' : 'Restoring overlay:', overlayId);
		await this.sqliteOverlay.addOrUpdateOverlay({ ...overlay, deletedAt });
		await this.emitOverlayUpdate();
		return true;
	}

	/** Permanent delete — UI only (Deleted Overlays page), and only for already soft-deleted overlays. Never exposed to the MCP. */
	async deleteOverlayPermanently(overlayId: string): Promise<void> {
		const overlay = await this.getOverlayById(overlayId);
		if (!overlay?.deletedAt) return;
		await this.deleteOverlaySilent(overlayId);
		await this.emitOverlayUpdate();
	}

	/** Delete an overlay WITHOUT broadcasting. Use in bulk loops, then emit once at the end. */
	private async deleteOverlaySilent(overlayId: string): Promise<void> {
		await this.sqliteOverlay.deleteOverlayById(overlayId)
		const source = path.join(this.appDir, "public", "custom", overlayId)
		fs.rm(source, { recursive: true, force: true }, (err => { if (err) this.log.error(err) }))
	}

	async copySceneLayerItem(overlayId: string, statsScene: LiveStatsScene, layerIndex: number, itemId: string) {
		const overlay = await this.getOverlayById(overlayId);
		if (isNil(overlay) || !overlay?.[statsScene].layers.length) return;

		const layer = overlay[statsScene].layers[layerIndex]
		const prevItem = layer.items.find(item => item.id === itemId);

		if (isNil(prevItem)) return
		let newItem = cloneDeep({ ...prevItem, id: newId() }) as GridContentItem

		const findPosition = gridHelp.findSpace(newItem, layer.items, COL);

		newItem = {
			...newItem,
			[COL]: {
				...newItem[COL],
				...findPosition,
			},
		};

		const customFileDir = path.join(this.appDir, "public", "custom", overlayId)
		const prevFileName = kebabCase(prevItem?.id)
		const newFileName = kebabCase(newItem?.id)

		const files = findFilesStartingWith(customFileDir, prevFileName)
		files.forEach(file => {
			const source = file;
			const target = file.replace(prevFileName, newFileName)
			if (!fs.existsSync(source)) return;
			fs.copyFileSync(source, target)
		})
		// Currently not a flexible solution
		newItem.data.font.src = prevItem.data.font.src?.replace(prevFileName, newFileName)
		newItem.data.image.name = prevItem.data.image.name?.replace(prevFileName, newFileName)

		layer.items.push(newItem);

		this.setOverlay(overlay)
	}

	/**
	 * Adds a new element to a layer. Auto-places in the first free grid space unless `position`
	 * is given, in which case it's placed at that grid coordinate/size (grid is COL x COL units).
	 * Used by MCP overlay-write tools.
	 */
	async addItemToLayer(
		overlayId: string,
		statsScene: LiveStatsScene,
		layerIndex: number,
		elementId: CustomElement,
		payload: ElementPayload,
		itemId: string = newId(),
		position?: GridPosition,
	): Promise<Scene | undefined> {
		const overlay = await this.getOverlayById(overlayId);
		const layer = overlay?.[statsScene]?.layers[layerIndex];
		if (isNil(overlay) || isNil(layer)) return;

		const newItem = buildGridItem(elementId, payload, layer.items, position, itemId);
		layer.items = [...layer.items, newItem];

		return this.setScene(overlayId, statsScene, overlay[statsScene]);
	}

	/**
	 * Adds several elements to one scene in a single save (one persist + one broadcast), so a whole
	 * HUD can be built in one MCP call. Each element auto-places unless it carries a `position`;
	 * auto-placement accounts for elements added earlier in the same batch. Skips entries whose
	 * layerIndex doesn't exist. Used by MCP overlay-write tools.
	 */
	async addItemsToScene(
		overlayId: string,
		statsScene: LiveStatsScene,
		items: { layerIndex: number; elementId: CustomElement; payload: ElementPayload; position?: GridPosition }[],
	): Promise<{ scene: Scene; addedIds: string[] } | undefined> {
		const overlay = await this.getOverlayById(overlayId);
		const sceneObj = overlay?.[statsScene];
		if (isNil(overlay) || isNil(sceneObj)) return;

		const addedIds: string[] = [];
		for (const it of items) {
			const layer = sceneObj.layers[it.layerIndex];
			if (isNil(layer)) continue;
			const id = newId();
			const item = buildGridItem(it.elementId, it.payload, layer.items, it.position, id);
			layer.items = [...layer.items, item];
			addedIds.push(id);
		}

		const scene = await this.setScene(overlayId, statsScene, sceneObj);
		if (!scene) return;
		return { scene, addedIds };
	}

	/** Moves/resizes an existing element within its layer's grid. Used by MCP overlay-write tools. */
	async moveItemInLayer(
		overlayId: string,
		statsScene: LiveStatsScene,
		layerIndex: number,
		itemId: string,
		position: GridPosition,
	): Promise<Scene | undefined> {
		const overlay = await this.getOverlayById(overlayId);
		const layer = overlay?.[statsScene]?.layers[layerIndex];
		const item = layer?.items.find((item) => item.id === itemId);
		if (isNil(overlay) || isNil(layer) || isNil(item)) return;

		item[COL] = { ...item[COL], ...clampGridPosition(item[COL], position) };

		return this.setScene(overlayId, statsScene, overlay[statsScene]);
	}

	/** Merges a partial payload patch into an existing element. Used by MCP overlay-write tools. */
	async updateItemInLayer(
		overlayId: string,
		statsScene: LiveStatsScene,
		layerIndex: number,
		itemId: string,
		payloadPatch: Partial<ElementPayload>,
	): Promise<Scene | undefined> {
		const overlay = await this.getOverlayById(overlayId);
		const layer = overlay?.[statsScene]?.layers[layerIndex];
		const item = layer?.items.find((item) => item.id === itemId);
		if (isNil(overlay) || isNil(layer) || isNil(item)) return;

		item.data = merge({}, item.data, payloadPatch);

		return this.setScene(overlayId, statsScene, overlay[statsScene]);
	}

	/** Removes an element from a layer. Used by MCP overlay-write tools. */
	async deleteItemFromLayer(
		overlayId: string,
		statsScene: LiveStatsScene,
		layerIndex: number,
		itemId: string,
	): Promise<Scene | undefined> {
		const overlay = await this.getOverlayById(overlayId);
		const layer = overlay?.[statsScene]?.layers[layerIndex];
		if (isNil(overlay) || isNil(layer)) return;

		layer.items = layer.items.filter((item) => item.id !== itemId);

		return this.setScene(overlayId, statsScene, overlay[statsScene]);
	}

	async duplicateSceneLayer(overlayId: string, statsScene: LiveStatsScene, layerIndex: number) {
		const overlay = await this.getOverlayById(overlayId);
		if (isNil(overlay) || !overlay?.[statsScene].layers.length) return;

		const duplicatedLayer: Layer = cloneDeep(overlay[statsScene].layers[layerIndex]);
		delete duplicatedLayer.id;

		const customFileDir = path.join(this.appDir, "public", "custom", overlayId)

		duplicatedLayer.items.forEach(item => {
			const prevId = `${item.id}`
			const prevFileName = kebabCase(prevId)
			item.id = newId()
			const newFileName = kebabCase(item.id)
			const files = findFilesStartingWith(customFileDir, prevFileName)
			files.forEach(file => {
				const source = file;
				const target = file.replace(prevFileName, newFileName)
				fs.copyFileSync(source, target)
			})
			// Currently not a flexible solution
			item.data.font.src = item.data.font.src?.replace(prevFileName, newFileName)
			item.data.image.name = item.data.image.name?.replace(prevFileName, newFileName)
		})

		const layers: Layer[] = [...overlay[statsScene].layers];
		overlay[statsScene].layers = [
			...layers.slice(0, layerIndex),
			duplicatedLayer,
			...layers.slice(layerIndex),
		];

		return this.setScene(overlayId, statsScene, overlay[statsScene])
	}

	setCurrentOverlayEditor(overlayEditor: OverlayEditor) {
		this.log.info("Current overlay editor", overlayEditor);
		this.store.set('obs.layout.current', overlayEditor);
	}

	setCurrentItemId(itemId: string) {
		this.store.set('obs.layout.current.itemId', itemId);
	}

	async emitOverlayUpdate() {
		const overlays = await this.getOverlays();
		this.messageHandler.sendMessage('Overlays', overlays);
	}


	async addLayer(overlayId: string, statsScene: LiveStatsScene, sceneId: number, layerIndex: number) {
		this.log.debug("Adding layer", overlayId, statsScene)
		const scene = await this.sqliteOverlay.getScene(sceneId) as Scene
		if (!scene) return;

		const newLayer: Layer = {
			index: layerIndex,
			items: [],
			id: undefined,
			preview: true,
		};

		scene.layers = [
			...scene.layers.slice(0, layerIndex),
			newLayer,
			...scene.layers.slice(layerIndex),
		];

		this.setScene(overlayId, statsScene, scene)
	}

	/** Move a layer from one index to another (others shift). Returns the saved scene. */
	async moveLayerTo(overlayId: string, statsScene: LiveStatsScene, fromIndex: number, toIndex: number): Promise<Scene | undefined> {
		const overlay = await this.getOverlayById(overlayId);
		const scene = overlay?.[statsScene];
		if (!scene || !scene.layers[fromIndex]) return;
		const [layer] = scene.layers.splice(fromIndex, 1);
		scene.layers.splice(Math.min(toIndex, scene.layers.length), 0, layer);
		return this.setScene(overlayId, statsScene, scene);
	}

	/** Update overlay-level settings (title / description / aspect ratio). */
	async updateOverlaySettings(overlayId: string, settings: { title?: string; description?: string; aspectRatio?: AspectRatio }): Promise<Overlay | undefined> {
		const overlay = await this.getOverlayById(overlayId);
		if (!overlay) return;
		const updated = { ...overlay, ...Object.fromEntries(Object.entries(settings).filter(([, v]) => v !== undefined)) } as Overlay;
		await this.setOverlay(updated);
		return updated;
	}

	/** Insert `count` empty layers at `atIndex` (default: end = furthest back). Returns the saved scene. */
	async addLayersToScene(overlayId: string, statsScene: LiveStatsScene, count: number, atIndex?: number): Promise<Scene | undefined> {
		const overlay = await this.getOverlayById(overlayId);
		const scene = overlay?.[statsScene];
		if (!scene) return;
		const index = Math.min(atIndex ?? scene.layers.length, scene.layers.length);
		const newLayers: Layer[] = Array.from({ length: count }, () => ({ index: 0, items: [], id: undefined, preview: true }));
		scene.layers = [...scene.layers.slice(0, index), ...newLayers, ...scene.layers.slice(index)];
		return this.setScene(overlayId, statsScene, scene);
	}

	async deleteLayer(overlayId: string, statsScene: LiveStatsScene, sceneId: number, layerId: number) {
		this.log.info("Delete layer", overlayId, statsScene)
		const scene = await this.sqliteOverlay.getScene(sceneId) as Scene
		if (!scene) return;

		scene.layers = scene.layers.filter((layer) => layer.id !== layerId);

		await this.setScene(overlayId, statsScene, scene)
		await this.sqliteOverlay.deleteLayer(layerId)
	}

	async moveLayer(
		overlayId: string,
		statsScene: LiveStatsScene,
		sceneId: number,
		layerIndex: number,
		relativeSwap: number
	) {
		this.log.debug("Moving layer", overlayId, statsScene, sceneId, layerIndex, relativeSwap);
		const scene = await this.sqliteOverlay.getScene(sceneId);
		if (!scene) return;

		const newIndex = layerIndex + relativeSwap;
		if (newIndex < 0 || newIndex >= scene.layers.length) return;
		[scene.layers[layerIndex], scene.layers[newIndex]] =
			[scene.layers[newIndex], scene.layers[layerIndex]];

		await this.setScene(overlayId, statsScene, scene);
	}

	initListeners() {
		this.store.onDidChange('obs.layout.current', (value) => {
			this.messageHandler.sendMessage('CurrentOverlayEditor', value as OverlayEditor);
		});
	}

	private initSvelteListeners() {
		this.clientEmitter.on('CleanupCustomResources', this.cleanupCustomResources.bind(this));

		this.clientEmitter.on("RemoveDuplicateItems", this.removeDuplicateItems.bind(this));

		this.clientEmitter.on('CleanupCustomResourcesByOverlayId', this.cleanupCustomResourceByOverlayId.bind(this));

		this.clientEmitter.on("RemoveDuplicateItemsByOverlayId", this.removeDuplicateItemsByOverlayId.bind(this));

		this.clientEmitter.on('OverlayUpdate', async (overlay) => {
			this.updateOverlay(overlay);
		});

		this.clientEmitter.on('SceneUpdate', async (overlayId, statsScene, scene) => {
			this.setScene(overlayId, statsScene, scene)
		})

		this.clientEmitter.on('OverlayDuplicate', this.copyOverlay.bind(this));

		this.clientEmitter.on('OverlayDelete', this.deleteOverlay.bind(this));

		this.clientEmitter.on('OverlayRestore', this.restoreOverlay.bind(this));

		this.clientEmitter.on('OverlayDeletePermanent', this.deleteOverlayPermanently.bind(this));

		this.clientEmitter.on('OverlayCreate', this.createOverlay.bind(this));

		this.clientEmitter.on('SceneItemDuplicate', this.copySceneLayerItem.bind(this))

		this.clientEmitter.on('LayerDelete', this.deleteLayer.bind(this))

		this.clientEmitter.on('LayerNew', this.addLayer.bind(this))

		this.clientEmitter.on('LayerDuplicate', this.duplicateSceneLayer.bind(this))

		this.clientEmitter.on('LayerMove', this.moveLayer.bind(this))

		this.clientEmitter.on('SelectedItemChange', this.setCurrentItemId.bind(this));

		this.clientEmitter.on('CurrentOverlayEditor', this.setCurrentOverlayEditor.bind(this));

		this.clientEmitter.on('OverlayDownload', async (overlayId) => {
			const overlay = await this.getOverlayById(overlayId);
			if (!overlay) return;
			const { canceled, filePath } = await dialog.showSaveDialog(this.mainWindow, {
				filters: [{ name: 'json', extensions: ['json'] }],
				nameFieldLabel: overlay.title,
			});
			if (canceled || !filePath) return;
			const appDirCustomFilesDir = `${this.appDir}/public/custom/${overlayId}`
			const entries = getCustomFiles(appDirCustomFilesDir);
			const shareOverlay: SharedOverlay = {
				...overlay,
				customFiles: entries
			}
			fs.writeFileSync(filePath, JSON.stringify(shareOverlay), 'utf-8');
		});

		this.clientEmitter.on('OverlayUpload', async () => {
			const { canceled, filePaths } = await dialog.showOpenDialog(this.mainWindow, {
				properties: ['openFile'],
				filters: [{ name: 'json', extensions: ['json'] }],
			});
			if (canceled || !filePaths[0]) return;
			try {
				const sharedOverlay = JSON.parse(fs.readFileSync(filePaths[0], 'utf8')) as SharedOverlay;
				const { customFiles, ...overlay } = sharedOverlay;
				this.log.info(`Importing overlay "${overlay.title}" (made with Froggi ${overlay.froggiVersion || 'unknown'})`);
				// Files from older versions skip the startup migration (persist stamps the current
				// version), so migrate here: old layer order + any fields/scenes added since.
				if (semver.valid(overlay.froggiVersion) && semver.gt("0.9.20-beta.1", overlay.froggiVersion)) this.reverseLayers(overlay);
				fillOverlayDefaults(overlay);
				overlay.id = newId()
				overlay.deletedAt = null

				const customFileDir = path.join(this.appDir, "public", "custom", overlay.id)
				if (customFiles) saveCustomFiles(customFileDir, customFiles)
				await this.uploadOverlay(overlay, overlay.id);
				this.messageHandler.sendMessage('Notification', `Imported "${overlay.title}"`, NotificationType.Success);
			} catch (e) {
				this.log.error('Overlay import failed:', e);
				this.messageHandler.sendMessage('Notification', 'Overlay import failed — not a valid Froggi overlay file', NotificationType.Danger);
			}
		});
	}

	private async initDemoOverlays() {

		const currentFroggiVersion = this.froggiStore.getFroggiConfig().version ?? "0.0.0"

		// Demos only change between app versions. Re-deleting and re-uploading every demo
		// on every launch is a full cascade rewrite per overlay — skip when already synced.
		// Demo authors can force a refresh with FROGGI_RESYNC_DEMOS=1.
		const forceResync = process.env.FROGGI_RESYNC_DEMOS === '1';
		if (!forceResync && this.froggiStore.getDemosSyncedVersion() === currentFroggiVersion) {
			this.log.info('Demo overlays already synced for this version — skipping');
			return;
		}

		const overlays = await this.getOverlays();

		// Delete + re-upload silently, then broadcast once at the end — emitting per item
		// re-reads every overlay's full graph and floods the renderer over IPC.
		for (const overlay of Object.values(overlays)) {
			if (!overlay.isDemo) continue;
			if (!semver.valid(overlay.froggiVersion)) {
				console.error(`Invalid version: ${overlay.froggiVersion}. Setting 0.0.0`);
				overlay.froggiVersion = "0.0.0";
			}

			if (semver.satisfies(currentFroggiVersion, `>=${overlay.froggiVersion}`) || this.isDev) {
				await this.deleteOverlaySilent(overlay.id);
			}
		}
		const overlayFiles = fs.readdirSync(path.join(__dirname, "/../../demo-overlays"));

		for (const file of overlayFiles) {
			try {
				const overlayRaw = fs.readFileSync(path.join(__dirname, "/../../demo-overlays", file), 'utf8');
				const overlay: Overlay = { ...JSON.parse(overlayRaw), isDemo: true } as Overlay;
				overlay.id = overlay.id || newId();
				this.clearOverlay(overlay);
				await this.persistOverlay(overlay);
			} catch (e) {
				this.log.error(e)
			}
		}
		this.froggiStore.setDemosSyncedVersion(currentFroggiVersion);
		await this.emitOverlayUpdate();
	}

	private async migrateOverlays(): Promise<void> {
		// if (this.isDev) return;
		this.log.info("Migrating overlays");
		const overlays = await this.getOverlays();

		const froggiVersion = this.froggiStore.getFroggiConfig().version ?? "0.0.0";
		let anyChanged = false;
		for (const overlay of Object.values(overlays)) {
			// Demos are fully managed by initDemoOverlays (delete + re-upload from JSON). Re-persisting
			// them here on every version bump was pointless AND piled up duplicate layers.
			if (overlay.isDemo) continue;
			// Only persist when something actually changed. Re-saving every overlay on
			// every startup triggers a full cascade rewrite of all scenes/layers per
			// overlay — slow, and pointless when the overlay is already current.
			let needsSave = false;

			if (!overlay.froggiVersion) {
				overlay.froggiVersion = froggiVersion;
				needsSave = true;
			}
			if (semver.gt("0.9.20-beta.1", overlay.froggiVersion)) {
				this.reverseLayers(overlay);
				needsSave = true;
			}

			// Add any scenes that didn't exist when this overlay was created.
			// Fresh template per overlay so each gets its own scene entity instances.
			const newOverlayTemplate = getNewOverlay();
			for (const key of Object.keys(LiveStatsScene)) {
				if (!isNaN(Number(key))) continue;
				const scene = LiveStatsScene[key as keyof typeof LiveStatsScene];
				if (!overlay[scene]) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(overlay as any)[scene] = newOverlayTemplate[scene];
					needsSave = true;
				}
			}

			if (overlay.froggiVersion !== froggiVersion) {
				overlay.froggiVersion = froggiVersion;
				needsSave = true;
			}

			if (!needsSave) continue;
			this.log.info("Migrating overlay", overlay.id, overlay.froggiVersion);
			await this.persistOverlay(overlay);
			anyChanged = true;
		}
		// Broadcast once after the whole pass, not per overlay.
		if (anyChanged) await this.emitOverlayUpdate();
	}



	private reverseLayers(overlay: Overlay) {
		this.log.info("Reversing layers for overlay", overlay.id);
		for (const key of Object.keys(LiveStatsScene)) {
			if (!isNaN(Number(key))) continue;
			const statsScene = LiveStatsScene[key as keyof typeof LiveStatsScene];
			const scene = overlay[statsScene];
			if (!scene?.layers) continue;
			scene.layers.sort((a, b) => a.index - b.index);
			scene.layers.reverse();
			for (const [index, layer] of scene.layers.entries()) {
				layer.index = index;
			}
		}
	}

	private clearOverlay(overlay: Overlay) {
		for (const key of Object.keys(LiveStatsScene)) {
			if (!isNaN(Number(key))) continue;
			const statsScene = LiveStatsScene[key as keyof typeof LiveStatsScene];
			const scene = overlay[statsScene];
			if (!scene) continue;
			for (const [index, layer] of scene.layers.entries()) {
				delete layer.id;
				layer.index = index;
			}
			delete scene.id;
		}
	}
}
