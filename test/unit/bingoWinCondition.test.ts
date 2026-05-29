import { countLines, countControlledLines, hasWon, scoreTarget } from '../../frontend/src/lib/utils/bingoWinCondition';
import type { BingoTile } from '../../frontend/src/lib/models/types/bingo';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTiles(size: number, completedBy: (idx: number) => BingoTile['completedBy'] = () => null): BingoTile[] {
	return Array.from({ length: size * size }, (_, i) => ({
		instanceId: String(i),
		challengeId: 'kill_with_move' as any,
		label: '',
		description: '',
		params: { difficulty: 'medium' as any, target: 1 },
		progress: 0,
		target: 1,
		completed: false,
		completedBy: completedBy(i),
		hasProgress: false,
	}));
}

/** Mark specific indices as completed by a player */
function mark(tiles: BingoTile[], indices: number[], player: 'local' | 'opponent' | 'both'): BingoTile[] {
	return tiles.map((b, i) => indices.includes(i) ? { ...b, completed: true, completedBy: player } : b);
}

/** All tiles completed (for 'full' mode) */
function markAll(tiles: BingoTile[], player: 'local' | 'opponent' | 'both'): BingoTile[] {
	return tiles.map(b => ({ ...b, completed: true, completedBy: player }));
}

// ── countLines ────────────────────────────────────────────────────────────────

describe('countLines (3×3)', () => {
	it('zero lines on empty board', () => {
		const tiles = makeTiles(3);
		expect(countLines(tiles, 3, b => b.completedBy === 'local')).toBe(0);
	});

	it('counts one complete row', () => {
		// Row 0: indices 0,1,2
		const tiles = mark(makeTiles(3), [0, 1, 2], 'local');
		expect(countLines(tiles, 3, b => b.completedBy === 'local')).toBe(1);
	});

	it('counts one complete column', () => {
		// Col 1: indices 1,4,7
		const tiles = mark(makeTiles(3), [1, 4, 7], 'local');
		expect(countLines(tiles, 3, b => b.completedBy === 'local')).toBe(1);
	});

	it('counts main diagonal', () => {
		// Diagonal: 0,4,8
		const tiles = mark(makeTiles(3), [0, 4, 8], 'local');
		expect(countLines(tiles, 3, b => b.completedBy === 'local')).toBe(1);
	});

	it('counts anti-diagonal', () => {
		// Anti-diagonal: 2,4,6
		const tiles = mark(makeTiles(3), [2, 4, 6], 'local');
		expect(countLines(tiles, 3, b => b.completedBy === 'local')).toBe(1);
	});

	it('counts multiple lines independently', () => {
		// Row 0 + col 0 (share index 0)
		const tiles = mark(makeTiles(3), [0, 1, 2, 3, 6], 'local');
		expect(countLines(tiles, 3, b => b.completedBy === 'local')).toBe(2);
	});

	it('partial row does not count', () => {
		const tiles = mark(makeTiles(3), [0, 1], 'local');
		expect(countLines(tiles, 3, b => b.completedBy === 'local')).toBe(0);
	});

	it('opponent lines counted separately by filter', () => {
		const tiles = mark(makeTiles(3), [0, 1, 2], 'opponent');
		expect(countLines(tiles, 3, b => b.completedBy === 'local')).toBe(0);
		expect(countLines(tiles, 3, b => b.completedBy === 'opponent')).toBe(1);
	});

	it('both completedBy counts for either player filter', () => {
		const tiles = mark(makeTiles(3), [0, 1, 2], 'both');
		expect(countLines(tiles, 3, b => b.completedBy === 'local' || b.completedBy === 'both')).toBe(1);
		expect(countLines(tiles, 3, b => b.completedBy === 'opponent' || b.completedBy === 'both')).toBe(1);
	});
});

// ── countControlledLines (row control) ───────────────────────────────────────

describe('countControlledLines (3×3, required=2)', () => {
	it('zero on empty board', () => {
		const tiles = makeTiles(3);
		expect(countControlledLines(tiles, 3, 'local')).toBe(0);
	});

	it('controls a row with 2/3 tiles', () => {
		// Row 1: indices 3,4,5 — local has 3,4
		const tiles = mark(makeTiles(3), [3, 4], 'local');
		expect(countControlledLines(tiles, 3, 'local')).toBe(1);
	});

	it('does not control row with only 1/3 tiles', () => {
		const tiles = mark(makeTiles(3), [3], 'local');
		expect(countControlledLines(tiles, 3, 'local')).toBe(0);
	});

	it('controls a column with 2/3 tiles', () => {
		// Col 2: indices 2,5,8 — local has 2,5
		const tiles = mark(makeTiles(3), [2, 5], 'local');
		expect(countControlledLines(tiles, 3, 'local')).toBe(1);
	});

	it('counts main diagonal when controlled', () => {
		// Main diagonal: 0,4,8 — local has all 3 (>= 2 required)
		const tiles = mark(makeTiles(3), [0, 4, 8], 'local');
		expect(countControlledLines(tiles, 3, 'local')).toBe(1);
	});

	it('counts anti-diagonal when controlled', () => {
		// Anti-diagonal: 2,4,6 — local has 2 of 3
		const tiles = mark(makeTiles(3), [2, 4], 'local');
		expect(countControlledLines(tiles, 3, 'local')).toBe(1);
	});

	it('partial diagonal (1/3 tiles) does not count', () => {
		const tiles = mark(makeTiles(3), [0], 'local'); // only top-left of main diagonal
		expect(countControlledLines(tiles, 3, 'local')).toBe(0);
	});

	it('opponent independently controlled', () => {
		const tiles = mark(makeTiles(3), [0, 1], 'opponent');
		expect(countControlledLines(tiles, 3, 'local')).toBe(0);
		expect(countControlledLines(tiles, 3, 'opponent')).toBe(1);
	});

	it('both completedBy counts for each player', () => {
		const tiles = mark(makeTiles(3), [0, 1], 'both');
		expect(countControlledLines(tiles, 3, 'local')).toBe(1);
		expect(countControlledLines(tiles, 3, 'opponent')).toBe(1);
	});
});

describe('countControlledLines (4×4, required=3)', () => {
	it('needs 3/4 tiles to control a row', () => {
		// Row 0: indices 0,1,2,3 — local has 0,1,2
		const tiles = mark(makeTiles(4), [0, 1, 2], 'local');
		expect(countControlledLines(tiles, 4, 'local')).toBe(1);
	});

	it('2/4 tiles is not enough', () => {
		const tiles = mark(makeTiles(4), [0, 1], 'local');
		expect(countControlledLines(tiles, 4, 'local')).toBe(0);
	});
});

// ── hasWon ────────────────────────────────────────────────────────────────────

describe('hasWon — n_lines (1 line)', () => {
	it('no win on empty board', () => {
		expect(hasWon(makeTiles(3), 3, 1)).toBe(false);
	});

	it('local wins with one row', () => {
		const tiles = mark(makeTiles(3), [0, 1, 2], 'local');
		expect(hasWon(tiles, 3, 1)).toBe(true);
	});

	it('opponent wins with one row', () => {
		const tiles = mark(makeTiles(3), [3, 4, 5], 'opponent');
		expect(hasWon(tiles, 3, 1)).toBe(true);
	});

	it('partial line is not a win', () => {
		const tiles = mark(makeTiles(3), [0, 1], 'local');
		expect(hasWon(tiles, 3, 1)).toBe(false);
	});
});

describe('hasWon — n_lines (2 lines)', () => {
	it('needs 2 complete lines', () => {
		const tiles = mark(makeTiles(3), [0, 1, 2], 'local'); // 1 line
		expect(hasWon(tiles, 3, 2)).toBe(false);
	});

	it('wins with 2 complete lines', () => {
		// Row 0 + row 1
		const tiles = mark(makeTiles(3), [0, 1, 2, 3, 4, 5], 'local');
		expect(hasWon(tiles, 3, 2)).toBe(true);
	});
});

describe('hasWon — full board', () => {
	it('no win with partial board', () => {
		const tiles = mark(makeTiles(3), [0, 1, 2, 3, 4, 5, 6, 7], 'local');
		expect(hasWon(tiles, 3, 'full')).toBe(false);
	});

	it('wins when every tile is completed', () => {
		const tiles = markAll(makeTiles(3), 'local');
		expect(hasWon(tiles, 3, 'full')).toBe(true);
	});

	it('wins with mixed completedBy (full is board-level)', () => {
		// all 9 marked, some by each player
		let tiles = markAll(makeTiles(3), 'local');
		tiles = tiles.map((b, i) => i % 2 === 0 ? { ...b, completedBy: 'opponent' } : b);
		expect(hasWon(tiles, 3, 'full')).toBe(true);
	});
});

describe('hasWon — lockout (3×3 = 9 tiles, majority = 5)', () => {
	it('no win with 4 tiles each', () => {
		let tiles = makeTiles(3);
		tiles = mark(tiles, [0, 1, 2, 3], 'local');
		tiles = mark(tiles, [5, 6, 7, 8], 'opponent');
		expect(hasWon(tiles, 3, 'lockout')).toBe(false);
	});

	it('local wins with 5 tiles', () => {
		const tiles = mark(makeTiles(3), [0, 1, 2, 3, 4], 'local');
		expect(hasWon(tiles, 3, 'lockout')).toBe(true);
	});

	it('opponent wins with 5 tiles', () => {
		const tiles = mark(makeTiles(3), [0, 1, 2, 3, 4], 'opponent');
		expect(hasWon(tiles, 3, 'lockout')).toBe(true);
	});

	it('4×4 lockout: majority = 9 of 16', () => {
		// 8 local tiles — not yet majority
		const tiles = mark(makeTiles(4), [0,1,2,3,4,5,6,7], 'local');
		expect(hasWon(tiles, 4, 'lockout')).toBe(false);
	});

	it('4×4 lockout wins at 9 tiles', () => {
		const tiles = mark(makeTiles(4), [0,1,2,3,4,5,6,7,8], 'local');
		expect(hasWon(tiles, 4, 'lockout')).toBe(true);
	});
});

describe('hasWon — rowcontrol (5×5, needs 3 controlled lines)', () => {
	// 5×5: required = floor(5/2)+1 = 3 tiles per line to control
	it('no win with 2 controlled lines', () => {
		// Control row 0 (3/5) and row 1 (3/5)
		const tiles = mark(makeTiles(5), [0, 1, 2, 5, 6, 7], 'local');
		expect(hasWon(tiles, 5, 'rowcontrol')).toBe(false);
	});

	it('local wins with 3 controlled lines', () => {
		// Rows 0, 1, 2 each with 3/5 tiles
		const tiles = mark(makeTiles(5), [0,1,2, 5,6,7, 10,11,12], 'local');
		expect(hasWon(tiles, 5, 'rowcontrol')).toBe(true);
	});

	it('opponent wins with 3 controlled lines', () => {
		const tiles = mark(makeTiles(5), [0,1,2, 5,6,7, 10,11,12], 'opponent');
		expect(hasWon(tiles, 5, 'rowcontrol')).toBe(true);
	});

	it('3×3 rowcontrol: wins with 3+ controlled lines (rows, cols, or diagonals)', () => {
		// [0,1,3,4]: row0[0,1]=2✓, row1[3,4]=2✓, col0[0,3]=2✓, col1[1,4]=2✓, diag[0,4]=2✓ → 5 lines
		const tiles = mark(makeTiles(3), [0, 1, 3, 4], 'local');
		expect(hasWon(tiles, 3, 'rowcontrol')).toBe(true);
	});

	it('3×3 rowcontrol: 2 controlled lines not enough', () => {
		// [0,1,2,3]: row0[0,1,2]=3✓, col0[0,3]=2✓, everything else <2 → 2 lines total
		const tiles = mark(makeTiles(3), [0, 1, 2, 3], 'local');
		expect(hasWon(tiles, 3, 'rowcontrol')).toBe(false);
	});
});

// ── scoreTarget ───────────────────────────────────────────────────────────────

describe('scoreTarget', () => {
	it('rowcontrol always 3', () => {
		expect(scoreTarget(makeTiles(3), 3, 'rowcontrol')).toBe(3);
		expect(scoreTarget(makeTiles(5), 5, 'rowcontrol')).toBe(3);
	});

	it('lockout 3×3 = 5', () => {
		expect(scoreTarget(makeTiles(3), 3, 'lockout')).toBe(5);
	});

	it('lockout 4×4 = 9', () => {
		expect(scoreTarget(makeTiles(4), 4, 'lockout')).toBe(9);
	});

	it('full = total tiles', () => {
		expect(scoreTarget(makeTiles(3), 3, 'full')).toBe(9);
		expect(scoreTarget(makeTiles(5), 5, 'full')).toBe(25);
	});

	it('n_lines returns n', () => {
		expect(scoreTarget(makeTiles(3), 3, 2)).toBe(2);
		expect(scoreTarget(makeTiles(5), 5, 4)).toBe(4);
	});
});
