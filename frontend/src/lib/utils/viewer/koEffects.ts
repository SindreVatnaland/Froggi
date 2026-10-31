/**
 * KO effects for the live game viewer (GameStateRender), like Melee's. Dead action states:
 *  0–3   DeadDown / DeadLeft / DeadRight / DeadUp   → "blast": a beam of the player's colour fired from the blast zone into the stage
 *  4–5   DeadUpStar / DeadUpStarIce                → "star": the player flies into the background (shrinking) for
 *        STAR_FRAMES, then a star twinkles where they ended up
 *  6–10  DeadUpFall… (flying into the screen)       → no effect
 */
export type KoKind = 'blast' | 'star';

export const koKind = (actionStateId: number | null | undefined): KoKind | null =>
	actionStateId == null || actionStateId < 0 ? null : actionStateId <= 3 ? 'blast' : actionStateId <= 5 ? 'star' : null;

/** Frames a star KO flies into the background before it twinkles. Melee keeps the player in the star state for
 *  176 frames (moving until ~128); 90 + the twinkle (KO_DURATION_MS.star ≈ 42 frames) ends well before the respawn. */
export const STAR_FRAMES = 90;

/** A star-KO'd player is already far into the background when the flight starts: about 20 % of full size. */
export const STAR_START_SCALE = 0.2;

/** Turns (degrees) a star-KO'd player spins like a wheel over the whole flight. */
export const STAR_SPIN = 720;

/**
 * Where a star-KO'd player is drawn `t` frames into the flight, from where they were KO'd to `end`
 * (starEnd): fast at first, slowing to a stop over STAR_FRAMES, while shrinking and spinning slower and slower.
 */
export function starFlight(start: { x: number; y: number }, end: { x: number; y: number }, t: number, facing = 1) {
	const p = Math.min(1, Math.max(0, t / STAR_FRAMES));
	const ease = 1 - (1 - p) * (1 - p);
	return {
		x: start.x + (end.x - start.x) * ease,
		y: start.y + (end.y - start.y) * ease,
		scale: STAR_START_SCALE * (1 - ease),
		angle: STAR_SPIN * ease * (facing < 0 ? -1 : 1),
	};
}

/** The steepest a star KO drifts toward the middle (degrees from straight down). */
export const STAR_MAX_ANGLE = 30;
/** Where a star KO ends: in the top 30 % between the stage's middle and the top of the off-stage zone. */
export const STAR_END_HEIGHT = 0.85;

/**
 * Where a star KO's flight ends (the star twinkles there): like Melee, it drifts toward the middle of the
 * stage — at most STAR_MAX_ANGLE from straight down — and always ends inside the off-stage zone (the inner
 * border), in its top 30 % above the stage's middle. `zone` = the off-stage zone (world space, y up).
 */
export function starEnd(start: { x: number; y: number }, zone: Rect): { x: number; y: number } {
	const midX = (zone.xMin + zone.xMax) / 2;
	const midY = (zone.yMin + zone.yMax) / 2;
	const y = midY + (zone.yMax - midY) * STAR_END_HEIGHT;
	const drop = Math.max(0, start.y - y);
	const reach = drop * Math.tan((STAR_MAX_ANGLE * Math.PI) / 180);
	const x = start.x > midX ? Math.max(midX, start.x - reach) : Math.min(midX, start.x + reach);
	return { x: Math.min(zone.xMax, Math.max(zone.xMin, x)), y };
}

export interface KoPlayer {
	playerIndex: number;
	actionStateId: number;
	x: number;
	y: number;
}

export interface KoStart extends KoPlayer {
	kind: KoKind;
}

/**
 * Players that ENTERED a dead state since the previous frame. A player already dead when first seen
 * (viewer opened mid-KO) does not count — `prev` has no entry for them yet.
 */
export function detectKos(prev: Record<number, number | undefined>, players: KoPlayer[]): KoStart[] {
	const out: KoStart[] = [];
	for (const p of players) {
		const kind = koKind(p.actionStateId);
		const before = prev[p.playerIndex];
		if (kind && before !== undefined && !koKind(before)) out.push({ ...p, kind });
	}
	return out;
}

/** World-space rectangle (y up). */
export interface Rect {
	xMin: number;
	xMax: number;
	yMin: number;
	yMax: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Where an effect is drawn (world space) and which way a blast points (degrees, 0 = right, 90 = up).
 * `ko.x / ko.y` = the player's last position (the frame before the KO). Blast: there (kept inside the
 * stage's blast zones `blast`, else the view), aimed back at the stage — the death state says which side.
 * Star: where the player ended up after flying into the background, kept in view.
 */
export function koPlacement(ko: KoStart, view: Rect, blast?: Rect | null, margin = 0.06): { x: number; y: number; angle: number } {
	const mx = (view.xMax - view.xMin) * margin;
	const my = (view.yMax - view.yMin) * margin;
	const inside = { xMin: view.xMin + mx, xMax: view.xMax - mx, yMin: view.yMin + my, yMax: view.yMax - my };
	if (ko.kind === 'star') return { x: clamp(ko.x, inside.xMin, inside.xMax), y: clamp(ko.y, inside.yMin, inside.yMax), angle: 0 };
	const zone = blast ?? view;
	const at = { x: clamp(ko.x, zone.xMin, zone.xMax), y: clamp(ko.y, zone.yMin, zone.yMax) };
	return { ...at, angle: ko.actionStateId === 0 ? 90 : ko.actionStateId === 1 ? 0 : ko.actionStateId === 3 ? -90 : 180 };
}

/** How long each effect stays on screen (ms). */
export const KO_DURATION_MS: Record<KoKind, number> = { blast: 1100, star: 700 };
