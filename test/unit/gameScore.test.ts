import { findSettingsPlayer, getGameScore, getPlayerSlot, getWinnerIndex, didPlayerWin } from '../../frontend/src/lib/utils/gamePredicates';
import type { GameStats, Player } from '../../frontend/src/lib/models/types/slippiData';

// Minimal GameStats: `players` = [port index, connect code]; the winner is set via placements,
// or `lras` = the port index that quit. Different end stocks so the game is never a tie.
const game = (players: [number, string?][], opts: { winner?: number; lras?: number } = {}): GameStats => ({
	gameEnd: {
		gameEndMethod: opts.lras !== undefined ? 7 : 2,
		lrasInitiatorIndex: opts.lras ?? -1,
		placements: players.map(([idx]) => ({ playerIndex: idx, position: idx === opts.winner ? 0 : 1 })),
	},
	isMock: false,
	isReplay: false,
	lastFrame: {
		frame: 100,
		players: Object.fromEntries(players.map(([idx], i) => [idx, { post: { playerIndex: idx, stocksRemaining: i + 1, percent: 10 * i } }])),
	},
	postGameStats: null,
	score: [0, 0],
	settings: { players: players.map(([idx, code]) => ({ playerIndex: idx, port: idx + 1, connectCode: code ?? '' })), matchInfo: {} },
	timestamp: null,
} as unknown as GameStats);

describe('findSettingsPlayer', () => {
	it('finds by port index, not array position (ports 1 + 3)', () => {
		const players = game([[0], [2]]).settings!.players;
		expect(findSettingsPlayer(players, 2)?.port).toBe(3);
		expect(findSettingsPlayer(players, 1)).toBeUndefined();
	});
});

describe('getWinnerIndex', () => {
	it('returns the winner port index from placements', () => {
		expect(getWinnerIndex(game([[0], [2]], { winner: 2 }))).toBe(2);
	});
	it('LRAS: the player who did not quit wins (ports 1 + 3)', () => {
		expect(getWinnerIndex(game([[0], [2]], { lras: 2 }))).toBe(0);
		expect(getWinnerIndex(game([[0], [2]], { lras: 0 }))).toBe(2);
	});
	it('LRAS: ports 3 + 4', () => {
		expect(getWinnerIndex(game([[2], [3]], { lras: 3 }))).toBe(2);
	});
});

describe('getGameScore — indexed by player slot', () => {
	it('ports 1 + 3: Player 2 (port 3) wins land in slot 1', () => {
		expect(getGameScore([game([[0], [2]], { winner: 2 }), game([[0], [2]], { winner: 2 })])).toEqual([0, 2]);
	});
	it('ports 2 + 4 offline', () => {
		expect(getGameScore([game([[1], [3]], { winner: 1 }), game([[1], [3]], { winner: 3 })])).toEqual([1, 1]);
	});
	it('LRAS counts for the other player', () => {
		expect(getGameScore([game([[0], [2]], { lras: 0 })])).toEqual([0, 1]);
	});
	it('players swapping ports mid-set keep their score (matched by connect code)', () => {
		const g1 = game([[0, 'AAA#1'], [1, 'BBB#2']], { winner: 0 }); // AAA on port 1 wins
		const g2 = game([[0, 'BBB#2'], [1, 'AAA#1']], { winner: 1 }); // AAA now on port 2 wins
		expect(getGameScore([g1, g2])).toEqual([2, 0]);
	});
	it('ties and no-result games do not score', () => {
		expect(getGameScore([game([[0], [1]], {})])).toEqual([0, 0]);
	});
});

describe('getPlayerSlot / didPlayerWin', () => {
	it('slot follows the set reference order', () => {
		const ref = game([[0, 'AAA#1'], [1, 'BBB#2']]).settings!.players;
		expect(getPlayerSlot(game([[0, 'BBB#2'], [1, 'AAA#1']]), 1, ref)).toBe(0);
	});
	it('didPlayerWin uses the slot for ports 1 + 3', () => {
		const g = { ...game([[0], [2]], { winner: 2 }), score: [0, 1] } as GameStats;
		expect(didPlayerWin(g, { playerIndex: 2 } as Player)).toBe(true);
		expect(didPlayerWin(g, { playerIndex: 0 } as Player)).toBe(false);
	});
});
