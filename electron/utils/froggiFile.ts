import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate';
import { nativeImage } from 'electron';
import crypto from 'crypto';
import path from 'path';

/**
 * .froggi — Froggi's share format: a zip with a manifest.json, JSON documents and the raw asset files
 * (no base64). Layout:
 *   manifest.json                      { format:'froggi', version:1, kind:'overlay'|'asset-pack', ... }
 *   overlay.json                       (kind 'overlay')
 *   custom/<sub>/<file>                (overlay custom images/fonts)
 *   packs/<packId>/manifest.json       (asset pack metadata)
 *   packs/<packId>/<characterId>/<file>
 * Legacy overlay .json (base64 customFiles) is still accepted on import.
 */
export const FROGGI_EXT = 'froggi';
export type FroggiKind = 'overlay' | 'asset-pack' | 'flow';

/** Each importer only accepts its own kind (nothing is written otherwise) — this says where it goes. */
export const wrongKindMessage = (kind: string): string =>
	kind === 'overlay' ? 'That is an overlay — import it on the Overlays page.'
	: kind === 'asset-pack' ? 'That is an asset pack — import it on Overlays → Assets.'
	: kind === 'flow' ? 'That is a flow — import it on OBS → Flows.'
	: 'That is not a Froggi file this version understands.';
export interface FroggiManifest {
	format: 'froggi';
	version: 1;
	kind: FroggiKind;
	froggiVersion: string;
	createdAt: string;
}

export const buildFroggiZip = (manifest: FroggiManifest, files: Record<string, Uint8Array>): Uint8Array => {
	const entries: Zippable = { 'manifest.json': strToU8(JSON.stringify(manifest, null, 2)) };
	for (const [name, data] of Object.entries(files)) {
		// Images are already compressed — store them; deflate JSON/text.
		entries[name] = /\.(png|jpe?g|gif|webp|woff2?)$/i.test(name) ? [data, { level: 0 }] : data;
	}
	return zipSync(entries, { level: 6 });
};

export const readFroggiZip = (data: Uint8Array): { manifest: FroggiManifest; files: Record<string, Uint8Array> } => {
	const files = unzipSync(data);
	const raw = files['manifest.json'];
	if (!raw) throw new Error('Not a .froggi file (manifest.json missing)');
	const manifest = JSON.parse(strFromU8(raw)) as FroggiManifest;
	if (manifest.format !== 'froggi') throw new Error('Not a .froggi file');
	delete files['manifest.json'];
	return { manifest, files };
};

export const isZip = (data: Uint8Array) => data[0] === 0x50 && data[1] === 0x4b;

export const readJsonEntry = <T>(files: Record<string, Uint8Array>, name: string): T | undefined =>
	files[name] ? (JSON.parse(strFromU8(files[name])) as T) : undefined;

export const hashFiles = (files: Record<string, Uint8Array>): string => {
	const h = crypto.createHash('sha1');
	for (const name of Object.keys(files).sort()) {
		h.update(name);
		h.update(files[name]);
	}
	return h.digest('hex');
};

export const MAX_IMAGE_SIDE = 1024;
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

/**
 * Validates an image and downsamples it so its longest side is ≤ 1024px (re-encoded as PNG).
 * GIF (may be animated) and WebP (not decodable by nativeImage) are kept as-is, size-capped.
 */
export const normalizeImage = (buf: Buffer, ext: string): { data: Buffer; ext: string } | { error: string } => {
	ext = ext.toLowerCase() === '.jpeg' ? '.jpg' : ext.toLowerCase();
	if (!IMAGE_EXTS.includes(ext)) return { error: `Unsupported image type ${ext} — use PNG, JPG, GIF or WebP` };
	if (!buf.length) return { error: 'Image is empty' };
	if (buf.length > MAX_IMAGE_BYTES) return { error: 'Image too large (>15MB)' };
	if (ext === '.gif' || ext === '.webp') return { data: buf, ext };
	const img = nativeImage.createFromBuffer(buf);
	if (img.isEmpty()) return { error: 'Could not read the image' };
	const { width, height } = img.getSize();
	if (Math.max(width, height) <= MAX_IMAGE_SIDE) return { data: buf, ext };
	const scale = MAX_IMAGE_SIDE / Math.max(width, height);
	const resized = img.resize({ width: Math.round(width * scale), height: Math.round(height * scale), quality: 'best' });
	return { data: resized.toPNG(), ext: '.png' };
};

export const safeName = (name: string) => path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
