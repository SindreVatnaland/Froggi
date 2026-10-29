import path from 'path';
import { SlippiGame } from '@slippi/slippi-js/node';
import { analyzeMatch } from '../../electron/utils/analyzeMatch';
import type { GameStats } from '../../frontend/src/lib/models/types/slippiData';
import { nulled } from '../../frontend/src/lib/models/types/slippiTypes';

const load = (dir: string, file: string) => {
	const slp = new SlippiGame(path.join(__dirname, '../sample-games', dir, file));
	return { settings: nulled(slp.getSettings()), postGameStats: nulled(slp.getStats()) } as unknown as GameStats;
};

describe('analyzeMatch', () => {
	const set = ['Replay 1 [W].slp', 'Replay 2 [W].slp', 'Replay 3 [L].slp', 'Replay 4 [W].slp'].map((f) => load('direct-set-1', f));

	it('sums each player over the set', () => {
		const match = analyzeMatch(set)!;
		for (const o of match.overall) {
			const code = set[0].settings!.players.find((p) => p.playerIndex === o.playerIndex)!.connectCode;
			const expected = set.reduce((n, g) => {
				const idx = g.settings!.players.find((p) => p.connectCode === code)!.playerIndex;
				return n + g.postGameStats!.overall.find((x) => x.playerIndex === idx)!.killCount;
			}, 0);
			expect(o.killCount).toBe(expected);
		}
	});

	it('a player keeps their totals when ports swap between games', () => {
		const swapped = set.map((g, i) =>
			i % 2
				? ({
						...g,
						settings: { ...g.settings, players: g.settings!.players.map((p) => ({ ...p, playerIndex: 1 - p.playerIndex })) },
						postGameStats: { ...g.postGameStats, overall: g.postGameStats!.overall.map((o) => ({ ...o, playerIndex: 1 - o.playerIndex })), actionCounts: g.postGameStats!.actionCounts.map((a) => ({ ...a, playerIndex: 1 - a.playerIndex })) },
					} as unknown as GameStats)
				: g,
		);
		const total = (m: ReturnType<typeof analyzeMatch>, code: string, games: GameStats[]) =>
			m!.overall.find((o) => games.at(-1)!.settings!.players.find((p) => p.playerIndex === o.playerIndex)!.connectCode === code)!.totalDamage;
		const code = set[0].settings!.players[0].connectCode;
		expect(total(analyzeMatch(swapped), code, swapped)).toBeCloseTo(total(analyzeMatch(set), code, set));
	});

	it('doubles: all four players', () => {
		const match = analyzeMatch([load('direct-doubles-set-1', 'Replay 1 [W].slp')])!;
		expect(match.overall.map((o) => o.playerIndex).sort()).toEqual([0, 1, 2, 3]);
	});
});

describe('set edgeguards', () => {
	// Real games of one set, with edgeguard stats attached the way statsDisplay does (null = not computed).
	const withEdgeguards = (file: string, eg: ([number, number] | null)[]) => {
		const game = load('direct-set-1', file);
		const stats = game.postGameStats!;
		stats.overall = stats.overall.map((o, i) => ({
			...o,
			edgeGuard: eg[i] ? { totalAttempts: eg[i]![0], successfulAttempts: eg[i]![1] } : undefined,
		})) as never;
		return game;
	};
	it('sums attempts and successes per player over the set; games without the stat are skipped', () => {
		const match = analyzeMatch([
			withEdgeguards('Replay 1 [W].slp', [[4, 2], [3, 1]]),
			withEdgeguards('Replay 2 [W].slp', [null, [5, 2]]),
			withEdgeguards('Replay 3 [L].slp', [[6, 3], [1, 0]]),
		])!;
		const eg = (i: number) => (match.overall[i] as unknown as { edgeGuard: Record<string, number> }).edgeGuard;
		expect(eg(0)).toMatchObject({ totalAttempts: 10, successfulAttempts: 5, successfulAttemptsPercent: 50 });
		expect(eg(1)).toMatchObject({ totalAttempts: 9, successfulAttempts: 3 });
	});
});
