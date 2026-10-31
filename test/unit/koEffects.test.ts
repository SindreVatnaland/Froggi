import { detectKos, koKind, koPlacement, STAR_FRAMES, starEnd, starFlight } from '../../frontend/src/lib/utils/viewer/koEffects';

const view = { xMin: -200, xMax: 200, yMin: -150, yMax: 150 };

describe('KO effects (live viewer)', () => {
	it('side / bottom / top-explosion KOs blast, star KOs are a star, flying into the screen has no effect', () => {
		expect([0, 1, 2, 3].map(koKind)).toEqual(['blast', 'blast', 'blast', 'blast']);
		expect([4, 5].map(koKind)).toEqual(['star', 'star']);
		expect([6, 7, 8, 9, 10, 11, 14, -1, null].map(koKind)).toEqual([null, null, null, null, null, null, null, null, null]);
	});

	it('fires once when a player ENTERS a dead state — not while dead, not when first seen dead', () => {
		const p = (actionStateId: number) => [{ playerIndex: 0, actionStateId, x: 0, y: 0 }];
		expect(detectKos({ 0: 14 }, p(1))).toHaveLength(1);
		expect(detectKos({ 0: 1 }, p(1))).toHaveLength(0); // still dead
		expect(detectKos({}, p(1))).toHaveLength(0); // viewer opened mid-KO
		expect(detectKos({ 0: 4 }, p(6))).toHaveLength(0); // dead → dead
	});

	it("blasts appear at the player's last position (inside the blast zone), aimed by the death state", () => {
		const blast = { xMin: -246, xMax: 246, yMin: -140, yMax: 188 }; // Final Destination
		const at = (state: number, x: number, y: number) => koPlacement({ playerIndex: 0, actionStateId: state, x, y, kind: 'blast' }, view, blast, 0);
		expect(at(1, -244, 40)).toEqual({ x: -244, y: 40, angle: 0 }); // DeadLeft → points right
		expect(at(2, 260, 500)).toEqual({ x: 246, y: 188, angle: 180 }); // DeadRight, kept inside the zone
		expect(at(0, -40, -139)).toEqual({ x: -40, y: -139, angle: 90 }); // DeadDown → points up
		expect(at(3, 10, 187)).toEqual({ x: 10, y: 187, angle: -90 }); // DeadUp (explodes off the top) → points down
		// no blast zone data: kept inside the view
		expect(koPlacement({ playerIndex: 0, actionStateId: 1, x: -999, y: 0, kind: 'blast' }, view, null, 0)).toEqual({ x: -200, y: 0, angle: 0 });
	});

	it('star KOs: the player shrinks into the background, then twinkles where they ended up (kept in view)', () => {
		// Fast at first, slowing to a stop at the end point; shrinking and spinning.
		const start = { x: 10, y: 160 };
		const end = { x: 0, y: 100 };
		const at = (t: number) => starFlight(start, end, t);
		expect(at(0)).toEqual({ x: 10, y: 160, scale: 0.2, angle: 0 }); // already far into the background
		expect(at(STAR_FRAMES / 2).y).toBeCloseTo(160 - 60 * 0.75); // 75 % of the way at half time
		expect(at(STAR_FRAMES / 2).scale).toBeCloseTo(0.05);
		expect(at(STAR_FRAMES)).toEqual({ x: 0, y: 100, scale: 0, angle: 720 });
		expect(starFlight(start, end, 10, -1).angle).toBeLessThan(0); // facing left spins the other way

		// Where it ends: toward the middle (at most 30° from straight down), in the top 30 % of the off-stage zone
		// above its middle — whatever the start.
		const zone = { xMin: -150, xMax: 150, yMin: -80, yMax: 120 }; // middle (0, 20); top 30 % = 80…120
		const right = starEnd({ x: 90, y: 200 }, zone);
		expect(right.y).toBeCloseTo(20 + 100 * 0.85);
		expect(right.x).toBeCloseTo(90 - (200 - right.y) * Math.tan(Math.PI / 6)); // 30° toward the middle
		expect(starEnd({ x: -5, y: 200 }, zone).x).toBe(0); // never past the middle
		expect(starEnd({ x: 400, y: 200 }, zone).x).toBe(150); // kept inside the zone
		expect(koPlacement({ playerIndex: 0, actionStateId: 4, x: 30, y: 71, kind: 'star' }, view, null, 0)).toEqual({ x: 30, y: 71, angle: 0 });
		expect(koPlacement({ playerIndex: 0, actionStateId: 4, x: 500, y: 300, kind: 'star' }, view, null, 0)).toEqual({ x: 200, y: 150, angle: 0 });
	});
});
