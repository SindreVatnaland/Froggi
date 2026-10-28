import { fitRosterGrid, previewIronManRoster, rosterProgress, rosterRemaining } from '../../frontend/src/lib/utils/ironmanElements';

describe('Iron Man elements', () => {
	it('fits the roster grid to the box', () => {
		// Wide box: one row of 8.
		expect(fitRosterGrid(8, 800, 100, 0, 1000)).toEqual({ cols: 8, size: 100 });
		// Square box: 3 columns × 3 rows beats 8 × 1.
		expect(fitRosterGrid(8, 300, 300, 0, 1000)).toEqual({ cols: 3, size: 100 });
		// Capped at the max icon size, gaps taken out.
		expect(fitRosterGrid(8, 2000, 2000, 4, 96).size).toBe(96);
		expect(fitRosterGrid(2, 104, 50, 4, 1000)).toEqual({ cols: 2, size: 50 });
		// At the cap, the layout shaped like the box wins: wide → one row, square → 3 × 3.
		expect(fitRosterGrid(8, 750, 150, 4, 64)).toEqual({ cols: 8, size: 64 });
		expect(fitRosterGrid(8, 300, 300, 4, 64)).toEqual({ cols: 3, size: 64 });
	});

	it('counts progress and remaining per variant', () => {
		const roster = previewIronManRoster(3);
		roster.slots[5].completed = true;
		expect(rosterProgress(roster, 'standard')).toBe(3);
		expect(rosterRemaining(roster, 'standard')).toBe(5);
		expect(rosterProgress(roster, 'full_roster')).toBe(1);
		expect(rosterRemaining(roster, 'challenge')).toBe(7);
		expect(rosterRemaining(null, 'standard')).toBe(0);
	});
});
