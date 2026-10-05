import "reflect-metadata";
import { buildFroggiZip, hashFiles, isZip, readFroggiZip, readJsonEntry } from '../../electron/utils/froggiFile';
import { resolvePackImage, type AssetPack } from '../../frontend/src/lib/models/types/assetPack';
import { MELEE_CHARACTER_SKINS } from '../../frontend/src/lib/models/constants/meleeCharacterSkins';

const manifest = { format: 'froggi' as const, version: 1 as const, kind: 'asset-pack' as const, froggiVersion: 'test', createdAt: 'now' };

describe('.froggi files', () => {
	it('round-trips manifest, JSON and binary files', () => {
		const png = new Uint8Array([137, 80, 78, 71, 1, 2, 3]);
		const zip = buildFroggiZip(manifest, { 'packs/p1/manifest.json': Buffer.from('{"title":"T"}'), 'packs/p1/2/0.png': png });
		expect(isZip(zip)).toBe(true);
		const { manifest: m, files } = readFroggiZip(zip);
		expect(m.kind).toBe('asset-pack');
		expect(readJsonEntry<{ title: string }>(files, 'packs/p1/manifest.json')?.title).toBe('T');
		expect(Array.from(files['packs/p1/2/0.png'])).toEqual(Array.from(png));
		expect(files['manifest.json']).toBeUndefined();
	});

	it('rejects files that are not .froggi', () => {
		expect(() => readFroggiZip(buildFroggiZip(manifest, {}).slice(0, 4))).toThrow();
	});

	it('hashes identical content equally regardless of key order', () => {
		const a = { 'x/0.png': new Uint8Array([1]), 'y/1.png': new Uint8Array([2]) };
		const b = { 'y/1.png': new Uint8Array([2]), 'x/0.png': new Uint8Array([1]) };
		expect(hashFiles(a)).toBe(hashFiles(b));
		expect(hashFiles(a)).not.toBe(hashFiles({ ...a, 'x/0.png': new Uint8Array([9]) }));
	});
});

describe('resolvePackImage', () => {
	const pack: AssetPack = { id: 'mine', title: 'Mine', builtIn: false, fallback: 'builtin-portrait', slots: { 2: { 0: '0.png', 1: '1.gif' } } };

	it('uses the exact skin when present', () => {
		expect(resolvePackImage([pack], 'mine', 2, 1, 'http://h')).toBe('http://h/public/asset-packs/mine/2/1.gif');
	});
	it('falls back to skin 0 of the same character', () => {
		expect(resolvePackImage([pack], 'mine', 2, 3, 'http://h')).toBe('http://h/public/asset-packs/mine/2/0.png');
	});
	it('falls back to the built-in fallback pack for missing characters', () => {
		expect(resolvePackImage([pack], 'mine', 9, 2)).toBe('/image/characters/9/2/portrait.png');
	});
	it('defaults to built-in stock icons (no pack / unknown pack)', () => {
		expect(resolvePackImage([], undefined, 20, 0)).toBe('/image/characters/20/0/stock.png');
		expect(resolvePackImage([], 'deleted-pack', 20, 0)).toBe('/image/characters/20/0/stock.png');
	});
});

describe('Melee character skins', () => {
	it('covers all 26 characters with 4–6 skins each', () => {
		expect(MELEE_CHARACTER_SKINS).toHaveLength(26);
		for (const c of MELEE_CHARACTER_SKINS) expect(c.skins.length).toBeGreaterThanOrEqual(4);
		expect(MELEE_CHARACTER_SKINS.find((c) => c.name === 'Fox')?.skins).toEqual(['Default', 'Red', 'Blue', 'Green']);
	});
});
