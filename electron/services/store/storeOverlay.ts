import Store from 'electron-store';
import type { AspectRatio, GridContentItem, Layer, Overlay, OverlayEditor, Scene, SharedOverlay } from '../../../frontend/src/lib/models/types/overlay';
import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { MessageHandler } from '../messageHandler';
import { newId } from '../../utils/functions';
import { TypedEmitter } from '../../../frontend/src/lib/utils/customEventEmitter';
import { BrowserWindow, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { LiveStatsScene } from '../../../frontend/src/lib/models/enum';
import { camelCase, cloneDeep, isNil, kebabCase, startCase } from 'lodash';
import { findFilesStartingWith, getCustomFiles, saveCustomFiles } from '../../utils/fileHandler';
import { COL } from '../../../frontend/src/lib/models/const';
//@ts-ignore
import gridHelp from "../../utils/gridHelp.js"
import { ElectronFroggiStore } from './storeFroggi';
import { SqliteOverlay } from './../sqlite/sqliteOverlay';
import semver from 'semver'
import { OverlayEntity } from 'services/sqlite/entities/overlayEntities';
import { getNewOverlay } from './../../utils/overlayHandler';


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
		if (!value) return;
		const froggiConfig = this.froggiStore.getFroggiConfig();
		const froggiVersion = this.isDev ? "0.0.0" : froggiConfig.version
		const overlay = { ...value, froggiVersion: froggiVersion } as Overlay
		await this.sqliteOverlay.addOrUpdateOverlay(overlay)
		this.emitOverlayUpdate()
	}

	getScene(overlayId: string, statsScene: string): Scene {
		return this.store.get(`obs.layout.overlays.${overlayId}.${statsScene}`) as Scene
	}

	async setScene(overlayId: string, statsScene: LiveStatsScene, scene: Scene) {
		console.log("Set scene", overlayId, statsScene, scene.id);

		for (const [index, layer] of scene.layers.entries()) {
			layer.index = index;
		};

		scene.layers.sort((a, b) => a.index - b.index);

		const updatedScene = await this.sqliteOverlay.addOrUpdateScene(scene);
		this.messageHandler.sendMessage('SceneUpdate', overlayId, statsScene, updatedScene);
	}

	async getOverlayById(overlayId: string): Promise<Overlay | undefined> {
		const overlays = await this.getOverlays()
		return overlays[overlayId]
	}

	async createOverlay(aspectRatio: AspectRatio): Promise<void> {
		let overlay = getNewOverlay(aspectRatio);
		this.setOverlay(overlay)
	}

	removeDuplicateItems(): void {
		let overlays = Object.values(this.getOverlays())
		overlays.forEach(this.removeDuplicateOverlayItems.bind(this))
	}

	async removeDuplicateItemsByOverlayId(overlayId: string): Promise<void> {
		let overlay = await this.getOverlayById(overlayId)
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

	cleanupCustomResources() {
		let overlays = Object.values(this.getOverlays())
		overlays.forEach((overlay) => this.cleanupCustomResourceByOverlayId(overlay.id))
	}

	async cleanupCustomResourceByOverlayId(overlayId: string) {
		const overlay = await this.getOverlayById(overlayId)
		if (isNil(overlay)) return;
		const itemsKebabId = Object.values(LiveStatsScene).map(statsScene => {
			return overlay[statsScene].layers?.map((layer: Layer) => layer.items).flat()
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

		const newOverlay = { ...overlay, id: newId(), title: `${overlay.title} - copy`, isDemo: false }
		Object.keys(LiveStatsScene)
			.filter(key => isNaN(Number(key)))
			.forEach(key => {
				const statsScene = LiveStatsScene[key as keyof typeof LiveStatsScene];
				newOverlay[statsScene].layers.forEach(layer => {
					delete layer.id;
				})
				delete newOverlay[statsScene].id
			})

		this.setOverlay(newOverlay);
		const source = path.join(this.appDir, "public", "custom", overlayId)
		const destination = path.join(this.appDir, "public", "custom", newOverlay.id)
		fs.cp(source, destination, { recursive: true }, (err => this.log.error(err)));
	}

	async uploadOverlay(overlay: Overlay, overlayId: string = newId()): Promise<void> {
		overlay.id = overlayId;
		this.clearOverlay(overlay)
		await this.setOverlay(overlay)
	}

	async deleteOverlay(overlayId: string): Promise<void> {
		this.log.info("Deleting overlay:", overlayId)
		// this.store.delete(`obs.layout.overlays.${overlayId}`)
		await this.sqliteOverlay.deleteOverlayById(overlayId)
		const source = path.join(this.appDir, "public", "custom", overlayId)
		fs.rm(source, { recursive: true }, (err => this.log.error(err)))
		setTimeout(this.emitOverlayUpdate.bind(this))
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

		this.setScene(overlayId, statsScene, overlay[statsScene])
	}

	setCurrentLayerIndex(index: number) {
		this.store.set('obs.layout.current.layerIndex', index);
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
		let scene = await this.sqliteOverlay.getScene(sceneId);
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

		this.clientEmitter.on('OverlayCreate', this.createOverlay.bind(this));

		this.clientEmitter.on('SceneItemDuplicate', this.copySceneLayerItem.bind(this))

		this.clientEmitter.on('LayerDelete', this.deleteLayer.bind(this))

		this.clientEmitter.on('LayerNew', this.addLayer.bind(this))

		this.clientEmitter.on('LayerDuplicate', this.duplicateSceneLayer.bind(this))

		this.clientEmitter.on('LayerMove', this.moveLayer.bind(this))

		this.clientEmitter.on('SelectedItemChange', this.setCurrentItemId.bind(this));

		this.clientEmitter.on('LayerPreviewChange', this.setCurrentLayerIndex.bind(this));

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
			if (canceled) return;
			const sharedOverlay = JSON.parse(fs.readFileSync(filePaths[0], 'utf8')) as SharedOverlay;
			const { customFiles, ...overlay } = sharedOverlay;
			overlay.id = newId()

			const customFileDir = path.join(this.appDir, "public", "custom", overlay.id)
			saveCustomFiles(customFileDir, customFiles)
			this.uploadOverlay(overlay, overlay.id);
		});
	}

	private async initDemoOverlays() {
		const overlayFiles = fs.readdirSync(path.join(__dirname, "/../../demo-overlays"));

		const overlays = await this.getOverlays();

		const currentFroggiVersion = this.froggiStore.getFroggiConfig().version ?? "0.0.0"

		for (const overlay of Object.values(overlays)) {
			if (!overlay.isDemo) continue;
			if (!semver.valid(overlay.froggiVersion)) {
				console.error(`Invalid version: ${overlay.froggiVersion}`);
				continue;
			}

			if (
				semver.satisfies(currentFroggiVersion, `>=${overlay.froggiVersion}`) || this.isDev
			) {
				await this.deleteOverlay(overlay.id);
			}
		}

		for (const file of overlayFiles) {
			try {
				const overlayRaw = fs.readFileSync(path.join(__dirname, "/../../demo-overlays", file), 'utf8');
				const overlay: Overlay = { ...JSON.parse(overlayRaw), isDemo: true } as Overlay;
				await this.uploadOverlay(overlay, overlay.id);
			} catch (e) {
				this.log.error(e)
			}
		}
	}

	private async migrateOverlays(): Promise<void> {
		const jsonOverlays = (this.store.get(`obs.layout.overlays`) ?? {}) as Record<string, Overlay>;

		for (const overlay of Object.values(jsonOverlays)) {
			if (overlay.isDemo) continue;
			this.convertAndClearOverlay(overlay);
			await this.setOverlay(overlay);
		}

		this.store.delete(`obs.layout.overlays`);

		const overlays = this.getOverlays();
		Object.values(overlays).forEach(overlay => {
			if (!overlay.froggiVersion) {
				overlay.froggiVersion = this.froggiStore.getFroggiConfig().version ?? "0.0.0";
			}
			// Migrate overlay
			// Compare version and migrate
		})

	}

	private convertAndClearOverlay(overlay: Overlay) {
		for (const key of Object.keys(LiveStatsScene)) {
			if (!isNaN(Number(key))) continue;

			const oldConventionScene = startCase(camelCase(LiveStatsScene[key as keyof typeof LiveStatsScene])) as LiveStatsScene;
			const newConventionScene = camelCase(oldConventionScene) as LiveStatsScene;

			if (overlay[oldConventionScene] && overlay[oldConventionScene].layers) {
				overlay[newConventionScene] = overlay[oldConventionScene];
				delete overlay[oldConventionScene];
			}

		}
		this.clearOverlay(overlay);
	}

	private clearOverlay(overlay: Overlay) {
		for (const key of Object.keys(LiveStatsScene)) {
			if (!isNaN(Number(key))) continue;
			const statsScene = LiveStatsScene[key as keyof typeof LiveStatsScene];
			const scene = overlay[statsScene];
			for (const [index, layer] of scene.layers.entries()) {
				delete layer.id;
				layer.index = index;
			}
		}
	}
}
