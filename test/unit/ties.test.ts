import fs from 'fs';
import path from 'path';
import { SlippiGame } from '@slippi/slippi-js/node';
import { nulled } from '../../frontend/src/lib/models/types/slippiTypes';
import { gameWinnerSlot, getGameScore, getWinnerIndex, hasGameBombRain, isSetComplete, isTiedGame } from '../../frontend/src/lib/utils/gamePredicates';
import { getTeamWinnerIndex } from '../../frontend/src/lib/utils/teams';
import type { GameStats } from '../../frontend/src/lib/models/types/slippiData';

/**
 * Ties: a tied game scores for nobody; the game that settles it does. Ranked plays a 1-stock tiebreaker
 * (same game number, tiebreakerNumber + 1) and its winner takes the point. Offline sudden death (bomb rain)
 * games are never stored (storeGames.addMatchGame), so they decide nothing.
 */
const root = path.join(__dirname, '../sample-games');
const replay = (file: string) => {
	const slp = new SlippiGame(path.join(root, file));
	const game = { settings: nulled(slp.getSettings()), gameEnd: nulled(slp.getGameEnd()), lastFrame: nulled(slp.getLatestFrame()), score: [0, 0] } as unknown as GameStats;
	return { slp, game };
};

describe('winners match slippi-js 9 (getWinners) on every sample replay', () => {
	const files = fs.readdirSync(root).flatMap((d) => fs.readdirSync(path.join(root, d)).filter((f) => f.endsWith('.slp')).map((f) => `${d}/${f}`));
	it.each(files)('%s', (file) => {
		const { slp, game } = replay(file);
		// Sudden death: slippi names its winner; Froggi never stores these games (see above).
		if (hasGameBombRain(game)) return;
		const slippi = slp.getWinners().map((w) => w.playerIndex).sort();
		if (game.settings?.isTeams) {
			const team = getTeamWinnerIndex(game);
			const winners = slippi.map((i) => game.settings!.players.find((p) => p.playerIndex === i)?.teamId);
			expect(team === undefined ? slippi : [...new Set(winners)].length).toEqual(team === undefined ? [] : 1);
			return;
		}
		expect(isTiedGame(game) ? [] : [getWinnerIndex(game)]).toEqual(slippi);
	});
});

// Singles game: [port, stocks at the end, percent], who placed first, how it ended (2 = GAME, 1 = TIME).
const game = (
	players: [number, number, number][],
	opts: { first?: number[]; method?: number; tiebreaker?: number; code?: boolean } = {},
): GameStats =>
	({
		gameEnd: {
			gameEndMethod: opts.method ?? 2,
			lrasInitiatorIndex: -1,
			placements: players.map(([idx]) => ({ playerIndex: idx, position: (opts.first ?? []).includes(idx) ? 0 : 1 })),
		},
		lastFrame: { frame: 100, players: Object.fromEntries(players.map(([idx, stocks, percent]) => [idx, { post: { playerIndex: idx, stocksRemaining: stocks, percent } }])) },
		settings: {
			players: players.map(([idx]) => ({ playerIndex: idx, port: idx + 1, connectCode: opts.code ? `P${idx}#1` : '' })),
			matchInfo: { matchId: 'mode.ranked-2026-10-29T10:00:00.00-0', gameNumber: 1, tiebreakerNumber: opts.tiebreaker ?? 0 },
		},
		postGameStats: null,
		score: [0, 0],
		timestamp: null,
	}) as unknown as GameStats;

describe('tied games', () => {
	it('double KO (both lose their last stock on the same frame): a tie — real replay', () => {
		const { game: g } = replay('offline-set-1/Replay 2 [T].slp');
		expect(isTiedGame(g)).toBe(true);
		expect(getWinnerIndex(g)).toBeUndefined();
		expect(getGameScore([g])).toEqual([0, 0]);
	});

	it('double KO: a tie even if a placement says otherwise', () => {
		const g = game([[0, 0, 80], [1, 0, 120]], { first: [0] });
		expect(isTiedGame(g)).toBe(true);
		expect(getGameScore([g])).toEqual([0, 0]);
	});

	it('timeout with the same stocks and percent: a tie', () => {
		const g = game([[0, 2, 45], [1, 2, 45]], { method: 1, first: [0, 1] });
		expect(isTiedGame(g)).toBe(true);
		expect(getGameScore([g])).toEqual([0, 0]);
	});

	it('timeout with the same stocks, lower percent wins', () => {
		const g = game([[0, 2, 30], [1, 2, 90]], { method: 1, first: [0] });
		expect(isTiedGame(g)).toBe(false);
		expect(getGameScore([g])).toEqual([1, 0]);
	});

	it('timeout with more stocks wins', () => {
		const g = game([[0, 1, 10], [1, 3, 140]], { method: 1, first: [1] });
		expect(getGameScore([g])).toEqual([0, 1]);
	});

	it('offline timeout: Melee calls equal stocks a tie (→ sudden death), but the lower shown percent wins', () => {
		const g = game([[0, 2, 30.7], [1, 2, 90.1]], { method: 1, first: [0, 1] });
		expect(isTiedGame(g)).toBe(false);
		expect(getWinnerIndex(g)).toBe(0);
		expect(getGameScore([g])).toEqual([1, 0]);
	});

	it('timeout: only the shown percent counts — 45.2% vs 45.9% is a tie', () => {
		const g = game([[0, 2, 45.2], [1, 2, 45.9]], { method: 1, first: [0] });
		expect(isTiedGame(g)).toBe(true);
		expect(getWinnerIndex(g)).toBeUndefined();
	});
});

describe('offline: the sudden death (bomb rain) game never counts', () => {
	const bombRain = (winner: number) => {
		const g = game([[0, winner === 0 ? 1 : 0, 300], [1, winner === 1 ? 1 : 0, 300]], { first: [winner] });
		(g.settings as unknown as { gameInfoBlock: { bombRainEnabled: boolean } }).gameInfoBlock = { bombRainEnabled: true };
		return g;
	};

	it('timeout won on percent, then sudden death: the timeout winner keeps the point', () => {
		const timeout = game([[0, 2, 30], [1, 2, 90]], { method: 1, first: [0, 1] });
		expect(getGameScore([timeout, bombRain(1)])).toEqual([1, 0]);
	});

	it('tied timeout, then sudden death: nobody scores — the next game counts', () => {
		const tie = game([[0, 2, 45], [1, 2, 45]], { method: 1, first: [0, 1] });
		const next = game([[0, 0, 120], [1, 1, 40]], { first: [1] });
		expect(getGameScore([tie, bombRain(0)])).toEqual([0, 0]);
		expect(getGameScore([tie, bombRain(0), next])).toEqual([0, 1]);
	});
});

describe('ranked: tie → 1-stock tiebreaker', () => {
	const tie = game([[0, 0, 100], [1, 0, 100]], { code: true });
	const tiebreakerP2 = game([[0, 0, 60], [1, 1, 20]], { first: [1], tiebreaker: 1, code: true });

	it('the tiebreaker winner gets the point; the tie itself scores nothing', () => {
		expect(getGameScore([tie])).toEqual([0, 0]);
		expect(getGameScore([tie, tiebreakerP2])).toEqual([0, 1]);
	});

	it('Bo3: tie + tiebreaker count as one game won — the set needs two more wins', () => {
		const g2 = game([[0, 0, 0], [1, 2, 50]], { first: [1], code: true });
		const g2Score = getGameScore([tie, tiebreakerP2, g2]);
		expect(g2Score).toEqual([0, 2]);
		expect(isSetComplete(getGameScore([tie, tiebreakerP2]), 3)).toBe(false);
		expect(isSetComplete(g2Score, 3)).toBe(true);
	});

	it('per-game summaries: the tie has no winner, the tiebreaker shows Player 2', () => {
		const games = [tie, tiebreakerP2].map((g, i, all) => ({ ...g, score: getGameScore(all.slice(0, i + 1)) }));
		expect(gameWinnerSlot(games, 0)).toBeUndefined();
		expect(gameWinnerSlot(games, 1)).toBe(1);
	});

	it('two ties in a row, then the second tiebreaker decides', () => {
		const tie2 = game([[0, 0, 0], [1, 0, 0]], { tiebreaker: 1, code: true });
		const tiebreakerP1 = game([[0, 1, 5], [1, 0, 70]], { first: [0], tiebreaker: 2, code: true });
		expect(getGameScore([tie, tie2, tiebreakerP1])).toEqual([1, 0]);
	});
});

describe('ranked: Slippi replays a tie as a tiebreaker game (same game number)', () => {
	// The replay spec: one session, game numbers from 1, tiebreaker number 0 unless it's a tiebreaker.
	const inSession = (g: GameStats, session: string, gameNumber: number, tiebreaker = 0) => {
		g.settings!.matchInfo = { ...g.settings!.matchInfo!, sessionId: session, gameNumber, tiebreakerNumber: tiebreaker };
		return g;
	};
	// Froggi's rule gives this timeout to port 1 (30% vs 31.5%) — but Slippi saw a tie and played a tiebreaker.
	const timeout = () => inSession(game([[0, 2, 30], [1, 2, 31.5]], { method: 1, first: [0, 1], code: true }), 'S1', 1);
	const tiebreakerP2 = () => inSession(game([[0, 0, 60], [1, 1, 20]], { first: [1], code: true }), 'S1', 1, 1);

	it('the game the tiebreaker settles scores nothing; the tiebreaker winner gets the point', () => {
		expect(getGameScore([timeout()])).toEqual([1, 0]); // no tiebreaker (yet): Froggi's rule
		expect(getGameScore([timeout(), tiebreakerP2()])).toEqual([0, 1]);
	});

	it("per-game scores see the whole set (the store's prefixes): the tied game's own score is corrected", () => {
		const games = [timeout(), tiebreakerP2()];
		expect(getGameScore(games.slice(0, 1), games)).toEqual([0, 0]);
	});

	it('only the same session + game number: another session’s tiebreaker, or offline games, change nothing', () => {
		const otherSession = inSession(game([[0, 0, 60], [1, 1, 20]], { first: [1], code: true }), 'S2', 1, 1);
		expect(getGameScore([timeout(), otherSession])).toEqual([1, 1]);
		const offline = game([[0, 2, 30], [1, 2, 31.5]], { method: 1, first: [0, 1] }); // no session id
		expect(getGameScore([offline, game([[0, 0, 60], [1, 1, 20]], { first: [1], tiebreaker: 1 })])).toEqual([1, 1]);
	});
});
