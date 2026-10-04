/**
 * Reference screenshots of each game's own in-game HUD, so the AI assistant can place extra elements
 * around it or build a custom HUD that replaces it. References are 16:9; 4:3 / 73:60 are derived by a
 * centered crop (the tool re-maps regions and crops the screenshot). Served to Claude by the MCP tool `get_game_hud_reference`.
 *
 * Add a reference: drop the screenshot in frontend/static/image/hud-references/<image> and add an
 * entry here. Regions are approximate, measured from the screenshot, on Froggi's 512×512 overlay grid
 * (x/y = top-left, w/h = size; the grid stretches to the overlay's aspect ratio).
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
			{ name: 'timer', x: 210, y: 56, w: 102, h: 26, note: 'MM:SS + centiseconds, top center' },
			{ name: 'p1-stocks', x: 79, y: 387, w: 66, h: 23, note: 'up to 4 stock icons, left to right' },
			{ name: 'p1-percent', x: 93, y: 432, w: 75, h: 42, note: 'damage % over the faded character emblem' },
			{ name: 'p2-stocks', x: 170, y: 387, w: 66, h: 23 },
			{ name: 'p2-percent', x: 184, y: 432, w: 75, h: 42 },
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
			{ name: 'timer', x: 215, y: 56, w: 92, h: 26, note: 'MM:SS + centiseconds, top center' },
			{ name: 'p1-stocks', x: 159, y: 384, w: 56, h: 26, note: 'up to 4 stock icons, left to right' },
			{ name: 'p1-percent', x: 177, y: 430, w: 58, h: 41 },
			{ name: 'p2-stocks', x: 276, y: 384, w: 57, h: 26 },
			{ name: 'p2-percent', x: 297, y: 430, w: 57, h: 41 },
			{ name: 'online-delay', x: 384, y: 491, w: 36, h: 11, note: "Slippi online 'Delay: Nf' (netplay only)" },
		],
	},
];
