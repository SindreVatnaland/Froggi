import type { IronManRoster, IronManSettings, IronManVariant } from '../models/types/ironman';

/**
 * Iron Man overlay elements (9011–9018): Player 1 = this Froggi's player, Player 2 = the opponent.
 * The roster grid fits its element box: the column count that gives the biggest icons, capped at `maxIcon`.
 * When several layouts reach the cap, the one shaped most like the box with the fewest gaps wins.
 */
export function fitRosterGrid(count: number, width: number, height: number, gap: number, maxIcon: number): { cols: number; size: number } {
	const n = Math.max(1, count);
	// Lower = better: grid shape vs box shape, plus empty cells (7 + 1 on two rows loses to 8 on one).
	const shape = (cols: number) => {
		const rows = Math.ceil(n / cols);
		return Math.abs(Math.log(cols / rows) - Math.log(Math.max(1, width) / Math.max(1, height))) + (cols * rows - n) / n;
	};
	let best = { cols: n, size: 0 };
	for (let cols = 1; cols <= n; cols++) {
		const rows = Math.ceil(n / cols);
		const size = Math.floor(Math.min((width - gap * (cols - 1)) / cols, (height - gap * (rows - 1)) / rows, maxIcon));
		if (size > best.size || (size === best.size && size > 0 && shape(cols) < shape(best.cols))) best = { cols, size };
	}
	return { cols: best.cols, size: Math.max(0, best.size) };
}

/** Characters done: Standard counts depleted ones, Full Roster / Challenge completed ones. */
export const rosterProgress = (roster: IronManRoster | null | undefined, variant: IronManVariant) =>
	roster ? roster.slots.filter((s) => (variant === 'standard' ? s.depleted : s.completed)).length : 0;

/** Characters still to go: Standard = not depleted, Full Roster / Challenge = not completed. */
export const rosterRemaining = (roster: IronManRoster | null | undefined, variant: IronManVariant) =>
	roster ? roster.slots.length - rosterProgress(roster, variant) : 0;

export const PREVIEW_IRONMAN_SETTINGS: IronManSettings = {
	variant: 'standard',
	rosterSize: 8,
	hideOpponent: false,
	stocksPerChar: 4,
	charOrder: 'fixed',
	charSelection: 'pick',
	randomSync: 'shared',
};

/** Editor placeholder roster: 8 characters, the first `depleted` out. */
export const previewIronManRoster = (depleted: number): IronManRoster => ({
	slots: [2, 20, 9, 15, 0, 19, 12, 1].map((characterId, i) => ({ characterId, depleted: i < depleted, completed: false, stocksRemaining: 4 })),
	currentIndex: depleted,
});
