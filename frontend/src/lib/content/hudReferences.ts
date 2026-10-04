/**
 * Reference screenshots of each game's own in-game HUD, so the AI assistant can place extra elements
 * around it or build a custom HUD that replaces it. References are 16:9; 4:3 / 73:60 are derived by a
 * centered crop (the tool re-maps regions and crops the screenshot). Served to Claude by the MCP tool `get_game_hud_reference`.
 *
 * Add a reference: drop the screenshot in frontend/static/image/hud-references/<image> and add an
 * entry here. Regions are approximate, measured from the screenshot, on Froggi's overlay grid of 512 columns ×
 * 288 rows (x/y = top-left, w/h = size; the grid stretches to the overlay's aspect ratio).
 */
export interface HudRegion {
	name: string;
	x: number;
	y: number;
	w: number;
	h: number;
	note?: string;
}

export interface HudReference {
	id: string;
	game: 'melee' | 'ultimate';
	aspectRatio: { width: number; height: number };
	title: string;
	/** File in frontend/static/image/hud-references/ */
	image: string;
	description: string;
	regions: HudRegion[];
}

export const HUD_REFERENCES: HudReference[] = [
	{
		id: 'melee-16x9-default',
		game: 'melee',
		aspectRatio: { width: 16, height: 9 },
		title: 'Melee 16:9 — default HUD placement',
		image: 'melee-16x9-default-hud.png',
		description:
			"Super Smash Bros. Melee in 16:9 (widescreen) with the game's default HUD placement. Timer centered at the top (MM:SS with smaller centiseconds). The player HUDs sit along the bottom in port order from the LEFT: Player 1's panel is around 20% across, Player 2's around 40% (ports 3 and 4 would continue to the right). Each panel = a row of stock icons (up to 4) with the damage percent below it, drawn over a faded character/series emblem. Leave these areas clear or design around them; the middle-right and top corners are free.",
		regions: [
			{ name: 'timer', x: 210, y: 32, w: 102, h: 15, note: 'MM:SS + centiseconds, top center' },
			{ name: 'p1-stocks', x: 79, y: 218, w: 66, h: 13, note: 'up to 4 stock icons, left to right' },
			{ name: 'p1-percent', x: 93, y: 243, w: 75, h: 24, note: 'damage % over the faded character emblem' },
			{ name: 'p2-stocks', x: 170, y: 218, w: 66, h: 13 },
			{ name: 'p2-percent', x: 184, y: 243, w: 75, h: 24 },
		],
	},
	{
		id: 'melee-16x9-centered',
		game: 'melee',
		aspectRatio: { width: 16, height: 9 },
		title: 'Melee 16:9 — centered player HUD (gecko code)',
		image: 'melee-16x9-centered-hud.png',
		description:
			"Super Smash Bros. Melee in 16:9 with a gecko code that centers the player HUD. Timer centered at the top. The two player panels sit side by side around the horizontal center at the bottom: Player 1 just left of center, Player 2 just right of center. Each panel = stock icons (up to 4) with the damage percent below. Slippi online shows a small 'Delay: Nf' readout at the bottom right. The left and right thirds of the bottom are free for overlay elements (e.g. names, ranks, controller displays).",
		regions: [
			{ name: 'timer', x: 215, y: 32, w: 92, h: 15, note: 'MM:SS + centiseconds, top center' },
			{ name: 'p1-stocks', x: 159, y: 216, w: 56, h: 15, note: 'up to 4 stock icons, left to right' },
			{ name: 'p1-percent', x: 177, y: 242, w: 58, h: 23 },
			{ name: 'p2-stocks', x: 276, y: 216, w: 57, h: 15 },
			{ name: 'p2-percent', x: 297, y: 242, w: 57, h: 23 },
			{ name: 'online-delay', x: 384, y: 276, w: 36, h: 6, note: "Slippi online 'Delay: Nf' (netplay only)" },
		],
	},
	{
		id: 'ultimate-16x9-default',
		game: 'ultimate',
		aspectRatio: { width: 16, height: 9 },
		title: 'Ultimate 16:9 — default HUD',
		image: 'ultimate-16x9-default-hud.jpg',
		description:
			"Super Smash Bros. Ultimate in 16:9 with its default HUD. Timer at the TOP-RIGHT (M:SS with smaller centiseconds in this shot). Player panels along the bottom, P1 left of center and P2 right of center; each panel = character portrait on the left, large damage percent (with a small decimal) to its right, the character name in a bar under the percent, and the stock icons as small heads under the portrait/name. A 'P1'/'P2' tag floats above each character in play. The player radar (minimap of off-screen fighters) sits TOP-LEFT here — Froggi's radar element (InGamePlayerRadar) can replace or mirror it. The top-center, the left/right edges, and the area between the two panels are free.",
		regions: [
			{ name: 'timer', x: 443, y: 11, w: 55, h: 16, note: 'M:SS.cc, top-right' },
			{ name: 'radar', x: 12, y: 33, w: 120, h: 69, note: 'player radar / minimap, top-left' },
			{ name: 'p1-panel', x: 102, y: 237, w: 89, h: 46, note: 'portrait + percent + name + stocks' },
			{ name: 'p1-portrait', x: 102, y: 237, w: 41, h: 40 },
			{ name: 'p1-percent', x: 146, y: 241, w: 41, h: 25, note: 'large %, small decimal' },
			{ name: 'p1-name', x: 148, y: 267, w: 42, h: 6 },
			{ name: 'p1-stocks', x: 127, y: 277, w: 14, h: 6, note: 'small stock heads' },
			{ name: 'p2-panel', x: 301, y: 237, w: 86, h: 46 },
			{ name: 'p2-portrait', x: 301, y: 237, w: 34, h: 40 },
			{ name: 'p2-percent', x: 333, y: 241, w: 51, h: 25 },
			{ name: 'p2-name', x: 343, y: 267, w: 37, h: 6 },
			{ name: 'p2-stocks', x: 324, y: 277, w: 14, h: 6 },
		],
	},
	{
		id: 'melee-16x9-no-hud',
		game: 'melee',
		aspectRatio: { width: 16, height: 9 },
		title: 'Melee 16:9 — no HUD',
		image: 'melee-16x9-no-hud.png',
		description:
			'Super Smash Bros. Melee in 16:9 with the game HUD hidden. Use it as the preview backdrop when building a custom HUD that REPLACES the game HUD (place stocks/percent/timer where the default or centered references show them).',
		regions: [],
	},
];
