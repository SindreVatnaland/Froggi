import { unzipSync, strFromU8 } from 'fflate';

/**
 * Per-character animation data, ported from SlippiLab (MIT).
 * https://github.com/frankborden/slippilab
 *
 * Each character has a zip of `{AnimationName}.json` files; each JSON is an
 * array of SVG path `d` strings (one per animation frame). Some frames are
 * "frameN" references that point back to an earlier identical frame to save
 * space (resolved in renderData).
 *
 * The zips are vendored under `frontend/static/animations/` and served at
 * `/animations/*.zip` (local Express static server + Vite dev). Loaded lazily
 * per character and cached for the session.
 */

export type AnimationFrames = string[];
export interface CharacterAnimations {
	[animationName: string]: AnimationFrames;
}

const animationsCache = new Map<number, CharacterAnimations>();
const inFlight = new Map<number, Promise<CharacterAnimations>>();

// Indexed by external character id (same order as characterNameByExternalId).
const characterZipUrlByExternalId = [
	'/animations/captainFalcon.zip',
	'/animations/donkeyKong.zip',
	'/animations/fox.zip',
	'/animations/mrGameAndWatch.zip',
	'/animations/kirby.zip',
	'/animations/bowser.zip',
	'/animations/link.zip',
	'/animations/luigi.zip',
	'/animations/mario.zip',
	'/animations/marth.zip',
	'/animations/mewtwo.zip',
	'/animations/ness.zip',
	'/animations/peach.zip',
	'/animations/pikachu.zip',
	'/animations/iceClimbers.zip',
	'/animations/jigglypuff.zip',
	'/animations/samus.zip',
	'/animations/yoshi.zip',
	'/animations/zelda.zip',
	'/animations/sheik.zip',
	'/animations/falco.zip',
	'/animations/youngLink.zip',
	'/animations/doctorMario.zip',
	'/animations/roy.zip',
	'/animations/pichu.zip',
	'/animations/ganondorf.zip',
];

/**
 * Warm the cache for the given external character ids (fire-and-forget).
 * Call on GameStart so the one-time unzip happens before gameplay, not during.
 */
export function prefetchAnimations(externalCharacterIds: number[]): void {
	for (const id of externalCharacterIds) {
		if (id >= 0 && !animationsCache.has(id)) void fetchAnimations(id).catch(() => undefined);
	}
}

/** Lazily fetch + cache a character's animation data by external character id. */
export async function fetchAnimations(externalCharacterId: number): Promise<CharacterAnimations> {
	const cached = animationsCache.get(externalCharacterId);
	if (cached) return cached;

	const pending = inFlight.get(externalCharacterId);
	if (pending) return pending;

	const url = characterZipUrlByExternalId[externalCharacterId];
	if (!url) return {};

	const promise = load(url)
		.then((animations) => {
			animationsCache.set(externalCharacterId, animations);
			inFlight.delete(externalCharacterId);
			return animations;
		})
		.catch((err) => {
			inFlight.delete(externalCharacterId);
			throw err;
		});
	inFlight.set(externalCharacterId, promise);
	return promise;
}

async function load(url: string): Promise<CharacterAnimations> {
	const response = await fetch(url);
	const buffer = new Uint8Array(await response.arrayBuffer());
	const fileBuffers = unzipSync(buffer);
	return Object.fromEntries(
		Object.entries(fileBuffers).map(([name, bytes]) => [
			name.replace('.json', ''),
			JSON.parse(strFromU8(bytes)),
		]),
	);
}
