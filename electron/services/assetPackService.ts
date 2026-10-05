import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { app, BrowserWindow, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { MessageHandler } from './messageHandler';
import { NotificationType } from '../../frontend/src/lib/models/enum';
import { BUILTIN_ASSET_PACKS, type AssetPack } from '../../frontend/src/lib/models/types/assetPack';
import { MELEE_CHARACTER_SKINS } from '../../frontend/src/lib/models/constants/meleeCharacterSkins';
import { newId } from '../utils/functions';
import {
	buildFroggiZip,
	FROGGI_EXT,
	hashFiles,
	IMAGE_EXTS,
	normalizeImage,
	readFroggiZip,
	readJsonEntry,
	safeName,
} from '../utils/froggiFile';

type PackManifest = Omit<AssetPack, 'builtIn' | 'builtinFile'>;
export type SlotSource = { filePath?: string; picker?: boolean; base64?: string; url?: string };

/**
 * Character asset packs (see frontend/src/lib/models/types/assetPack.ts). Each custom pack is a folder
 * appData/public/asset-packs/<id>/ with manifest.json + <characterId>/<file>; the folder is the source
 * of truth (no database). Built-in packs are read-only and live in the bundled frontend images.
 */
@singleton()
export class AssetPackService {
	private readonly dir: string;

	constructor(
		@inject('AppDir') private appDir: string,
		@inject('RootDir') private rootDir: string,
		@inject('BrowserWindow') private mainWindow: BrowserWindow,
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
	) {
		this.dir = path.join(this.appDir, 'public', 'asset-packs');
		fs.mkdirSync(this.dir, { recursive: true });
		this.initEventListeners();
		this.log.info('Initializing Asset Pack Service');
	}

	// ── Read ────────────────────────────────────────────────────────────────

	getPacks(): AssetPack[] {
		const packs: AssetPack[] = [];
		for (const id of fs.readdirSync(this.dir)) {
			const manifest = this.readManifest(id);
			if (manifest) packs.push({ ...manifest, builtIn: false });
		}
		return packs.sort((a, b) => a.title.localeCompare(b.title));
	}

	getPack(id: string): AssetPack | undefined {
		return [...BUILTIN_ASSET_PACKS, ...this.getPacks()].find((p) => p.id === id);
	}

	private readManifest(id: string): PackManifest | undefined {
		try {
			const m = JSON.parse(fs.readFileSync(path.join(this.dir, id, 'manifest.json'), 'utf8')) as PackManifest;
			return { ...m, id, slots: m.slots ?? {}, fallback: m.fallback || 'builtin-stock' };
		} catch {
			return undefined;
		}
	}

	private writeManifest(manifest: PackManifest) {
		fs.mkdirSync(path.join(this.dir, manifest.id), { recursive: true });
		fs.writeFileSync(path.join(this.dir, manifest.id, 'manifest.json'), JSON.stringify(manifest, null, 2));
	}

	emitPacks() {
		this.messageHandler.sendMessage('AssetPacks', this.getPacks());
	}

	private customOrError(id: string): PackManifest | { error: string } {
		if (BUILTIN_ASSET_PACKS.some((p) => p.id === id)) return { error: 'Built-in packs are read-only — duplicate it first.' };
		return this.readManifest(id) ?? { error: `No asset pack "${id}"` };
	}

	// ── Write ───────────────────────────────────────────────────────────────

	createPack(title: string, fallback = 'builtin-stock'): AssetPack {
		const manifest: PackManifest = { id: newId(), title: title.trim() || 'New asset pack', slots: {}, fallback, createdAt: new Date().toISOString() };
		this.writeManifest(manifest);
		this.emitPacks();
		return { ...manifest, builtIn: false };
	}

	/** Copies a pack (built-in packs: their bundled images for every character + skin). */
	duplicatePack(id: string): AssetPack | { error: string } {
		const source = this.getPack(id);
		if (!source) return { error: `No asset pack "${id}"` };
		const copy: PackManifest = { id: newId(), title: `${source.title} - copy`, slots: {}, fallback: source.builtIn ? source.id : source.fallback, createdAt: new Date().toISOString() };
		this.writeManifest(copy);
		if (source.builtIn) {
			const base = [path.join(this.rootDir, 'build', 'image', 'characters'), path.join(this.rootDir, 'frontend', 'static', 'image', 'characters')].find((d) => fs.existsSync(d));
			for (const ch of MELEE_CHARACTER_SKINS) {
				ch.skins.forEach((_, skin) => {
					const file = base && path.join(base, String(ch.id), String(skin), source.builtinFile ?? 'stock.png');
					if (!file || !fs.existsSync(file)) return;
					this.storeSlotFile(copy, ch.id, skin, fs.readFileSync(file), path.extname(file));
				});
			}
		} else {
			fs.cpSync(path.join(this.dir, id), path.join(this.dir, copy.id), { recursive: true, filter: (src) => path.basename(src) !== 'manifest.json' });
			copy.slots = JSON.parse(JSON.stringify(source.slots));
		}
		this.writeManifest(copy);
		this.emitPacks();
		return { ...copy, builtIn: false };
	}

	updatePack(id: string, patch: { title?: string; fallback?: string }): AssetPack | { error: string } {
		const m = this.customOrError(id);
		if ('error' in m) return m;
		if (patch.title?.trim()) m.title = patch.title.trim();
		if (patch.fallback && BUILTIN_ASSET_PACKS.some((p) => p.id === patch.fallback)) m.fallback = patch.fallback;
		this.writeManifest(m);
		this.emitPacks();
		return { ...m, builtIn: false };
	}

	deletePack(id: string): boolean {
		const m = this.customOrError(id);
		if ('error' in m) return false;
		fs.rmSync(path.join(this.dir, id), { recursive: true, force: true });
		this.log.info('Deleted asset pack', id);
		this.emitPacks();
		return true;
	}

	private storeSlotFile(manifest: PackManifest, characterId: number, skinId: number, buf: Buffer, ext: string): { error: string } | undefined {
		const normalized = normalizeImage(buf, ext);
		if ('error' in normalized) return normalized;
		const charDir = path.join(this.dir, manifest.id, String(characterId));
		fs.mkdirSync(charDir, { recursive: true });
		const old = manifest.slots[characterId]?.[skinId];
		if (old) fs.rmSync(path.join(charDir, old), { force: true });
		const fileName = `${skinId}${normalized.ext}`;
		fs.writeFileSync(path.join(charDir, fileName), normalized.data);
		manifest.slots[characterId] = { ...(manifest.slots[characterId] ?? {}), [skinId]: fileName };
		return undefined;
	}

	/** Sets one character/skin image from a local file, a Froggi file picker, base64 data or a URL. */
	async setSlot(id: string, characterId: number, skinId: number, source: SlotSource): Promise<{ ok: true; fileName: string } | { error: string } | { canceled: true }> {
		const m = this.customOrError(id);
		if ('error' in m) return m;
		const character = MELEE_CHARACTER_SKINS.find((c) => c.id === characterId);
		if (!character) return { error: `Unknown character id ${characterId} (0–25)` };
		if (skinId < 0 || skinId >= character.skins.length) return { error: `${character.name} has skins 0–${character.skins.length - 1}` };

		let buf: Buffer;
		let ext: string;
		try {
			if (source.url) {
				const res = await fetch(source.url);
				if (!res.ok) return { error: `Download failed: HTTP ${res.status}` };
				buf = Buffer.from(await res.arrayBuffer());
				const ct = (res.headers.get('content-type') ?? '').split(';')[0];
				ext = path.extname(new URL(source.url).pathname) || ({ 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp' } as Record<string, string>)[ct] || '';
			} else if (source.base64) {
				const mime = /^data:([^;]+);base64,/.exec(source.base64)?.[1];
				ext = ({ 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp' } as Record<string, string>)[mime ?? ''] ?? '.png';
				buf = Buffer.from(source.base64.replace(/^data:[^,]*,/, ''), 'base64');
			} else {
				let filePath = source.filePath;
				if (!filePath) {
					this.mainWindow.show();
					this.mainWindow.focus();
					const { canceled, filePaths } = await dialog.showOpenDialog(this.mainWindow, {
						title: `${character.name} — ${character.skins[skinId]} (skin ${skinId})`,
						properties: ['openFile'],
						filters: [{ name: 'Images', extensions: IMAGE_EXTS.map((e) => e.slice(1)) }],
					});
					if (canceled || !filePaths[0]) return { canceled: true };
					filePath = filePaths[0];
				}
				buf = fs.readFileSync(filePath);
				ext = path.extname(filePath);
			}
		} catch (e) {
			return { error: `Could not read image: ${(e as Error).message}` };
		}
		const failed = this.storeSlotFile(m, characterId, skinId, buf, ext);
		if (failed) return failed;
		this.writeManifest(m);
		this.emitPacks();
		return { ok: true, fileName: m.slots[characterId][skinId] };
	}

	removeSlot(id: string, characterId: number, skinId: number) {
		const m = this.customOrError(id);
		if ('error' in m) return;
		const file = m.slots[characterId]?.[skinId];
		if (!file) return;
		fs.rmSync(path.join(this.dir, id, String(characterId), file), { force: true });
		delete m.slots[characterId][skinId];
		if (!Object.keys(m.slots[characterId]).length) delete m.slots[characterId];
		this.writeManifest(m);
		this.emitPacks();
	}

	/** Bulk-fills a pack from a folder laid out as <characterId>/<skinId>.<ext>. */
	async importFolder(id: string) {
		const m = this.customOrError(id);
		if ('error' in m) return this.notify(m.error, NotificationType.Danger);
		const { canceled, filePaths } = await dialog.showOpenDialog(this.mainWindow, {
			title: 'Folder with <characterId>/<skinId>.png',
			properties: ['openDirectory'],
		});
		if (canceled || !filePaths[0]) return;
		let count = 0;
		for (const ch of MELEE_CHARACTER_SKINS) {
			const charDir = path.join(filePaths[0], String(ch.id));
			if (!fs.existsSync(charDir)) continue;
			for (const file of fs.readdirSync(charDir)) {
				const skin = Number(path.parse(file).name);
				if (!Number.isInteger(skin) || skin < 0 || skin >= ch.skins.length) continue;
				if (!this.storeSlotFile(m, ch.id, skin, fs.readFileSync(path.join(charDir, file)), path.extname(file))) count++;
			}
		}
		this.writeManifest(m);
		this.emitPacks();
		this.notify(count ? `Imported ${count} image(s)` : 'No images found — expected <characterId>/<skinId>.png', count ? NotificationType.Success : NotificationType.Warning);
	}

	// ── .froggi sharing ─────────────────────────────────────────────────────

	/** Pack files keyed for a .froggi zip: packs/<id>/manifest.json + packs/<id>/<char>/<file>. */
	packZipFiles(id: string): Record<string, Uint8Array> {
		const m = this.readManifest(id);
		if (!m) return {};
		const files: Record<string, Uint8Array> = { [`packs/${id}/manifest.json`]: Buffer.from(JSON.stringify(m, null, 2)) };
		for (const [ch, skins] of Object.entries(m.slots)) {
			for (const file of Object.values(skins)) {
				const p = path.join(this.dir, id, ch, file);
				if (fs.existsSync(p)) files[`packs/${id}/${ch}/${file}`] = fs.readFileSync(p);
			}
		}
		return files;
	}

	async exportPack(id: string) {
		const m = this.customOrError(id);
		if ('error' in m) return this.notify(m.error, NotificationType.Danger);
		const { canceled, filePath } = await dialog.showSaveDialog(this.mainWindow, {
			defaultPath: `${safeName(m.title)}.${FROGGI_EXT}`,
			filters: [{ name: 'Froggi asset pack', extensions: [FROGGI_EXT] }],
		});
		if (canceled || !filePath) return;
		const zip = buildFroggiZip(
			{ format: 'froggi', version: 1, kind: 'asset-pack', froggiVersion: app.getVersion(), createdAt: new Date().toISOString() },
			this.packZipFiles(id),
		);
		fs.writeFileSync(filePath, zip);
		this.notify(`Exported "${m.title}"`, NotificationType.Success);
	}

	/**
	 * Restores every pack found in .froggi zip files. Same id + identical images → reuse the local pack;
	 * same id but different → import as a new pack ("<title> (2)"), local edits are never overwritten.
	 * Returns old→new id map (for overlays that reference the packs).
	 */
	importPacksFromZip(files: Record<string, Uint8Array>): Record<string, string> {
		const idMap: Record<string, string> = {};
		const packIds = new Set(Object.keys(files).filter((f) => f.startsWith('packs/')).map((f) => f.split('/')[1]));
		for (const packId of packIds) {
			const manifest = readJsonEntry<PackManifest>(files, `packs/${packId}/manifest.json`);
			if (!manifest) continue;
			const incoming: Record<string, Uint8Array> = {};
			for (const [name, data] of Object.entries(files)) {
				if (name.startsWith(`packs/${packId}/`) && !name.endsWith('/manifest.json')) incoming[name.slice(`packs/${packId}/`.length)] = data;
			}
			const local = this.readManifest(packId);
			if (local) {
				const localFiles = Object.fromEntries(
					Object.entries(this.packZipFiles(packId))
						.filter(([n]) => !n.endsWith('/manifest.json'))
						.map(([n, data]) => [n.slice(`packs/${packId}/`.length), data]),
				);
				if (hashFiles(localFiles) === hashFiles(incoming)) {
					idMap[packId] = packId;
					continue;
				}
			}
			const target: PackManifest = {
				id: local ? newId() : safeName(packId) || newId(),
				title: local ? `${manifest.title} (2)` : manifest.title,
				slots: {},
				fallback: manifest.fallback || 'builtin-stock',
				createdAt: new Date().toISOString(),
			};
			for (const [ch, skins] of Object.entries(manifest.slots ?? {})) {
				for (const [skin, file] of Object.entries(skins)) {
					const data = incoming[`${ch}/${file}`];
					if (!data) continue;
					this.storeSlotFile(target, Number(ch), Number(skin), Buffer.from(data), path.extname(file));
				}
			}
			this.writeManifest(target);
			idMap[packId] = target.id;
		}
		this.emitPacks();
		return idMap;
	}

	async importPackFile() {
		const { canceled, filePaths } = await dialog.showOpenDialog(this.mainWindow, {
			properties: ['openFile'],
			filters: [{ name: 'Froggi asset pack', extensions: [FROGGI_EXT] }],
		});
		if (canceled || !filePaths[0]) return;
		try {
			const { manifest, files } = readFroggiZip(fs.readFileSync(filePaths[0]));
			if (manifest.kind !== 'asset-pack') return this.notify('That is an overlay file — import it on the Overlays page.', NotificationType.Warning);
			const map = this.importPacksFromZip(files);
			this.notify(`Imported ${Object.keys(map).length} asset pack(s)`, NotificationType.Success);
		} catch (e) {
			this.log.error('Asset pack import failed:', e);
			this.notify('Import failed — not a valid .froggi asset pack', NotificationType.Danger);
		}
	}

	private notify(message: string, type: NotificationType) {
		this.messageHandler.sendMessage('Notification', message, type);
	}

	private initEventListeners() {
		this.clientEmitter.on('AssetPackCreate', (title: string) => void this.createPack(title));
		this.clientEmitter.on('AssetPackDuplicate', (id: string) => {
			const r = this.duplicatePack(id);
			if ('error' in r) this.notify(r.error, NotificationType.Danger);
		});
		this.clientEmitter.on('AssetPackUpdate', (id: string, title?: string, fallback?: string) => void this.updatePack(id, { title, fallback }));
		this.clientEmitter.on('AssetPackDelete', (id: string) => void this.deletePack(id));
		this.clientEmitter.on('AssetPackSetSlot', async (id: string, characterId: number, skinId: number) => {
			const r = await this.setSlot(id, characterId, skinId, { picker: true });
			if ('error' in r) this.notify(r.error, NotificationType.Danger);
		});
		this.clientEmitter.on('AssetPackRemoveSlot', (id: string, characterId: number, skinId: number) => this.removeSlot(id, characterId, skinId));
		this.clientEmitter.on('AssetPackImportFolder', (id: string) => void this.importFolder(id));
		this.clientEmitter.on('AssetPackExport', (id: string) => void this.exportPack(id));
		this.clientEmitter.on('AssetPackImport', () => void this.importPackFile());
	}
}
