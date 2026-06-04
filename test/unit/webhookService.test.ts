import 'reflect-metadata';
import { WebhookService } from '../../electron/services/webhookService';
import type { BingoTile, BingoSession, BingoWinState } from '../../frontend/src/lib/models/types/bingo';
import type { IronManSession } from '../../frontend/src/lib/models/types/ironman';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTile(overrides: Partial<BingoTile> = {}): BingoTile {
	return {
		instanceId: 'tile-0',
		challengeId: 'win_games_total',
		label: 'Win 3 games',
		description: '',
		params: { difficulty: 'medium', target: 3 },
		progress: 0,
		target: 3,
		completed: false,
		completedBy: null,
		hasProgress: true,
		...overrides,
	};
}

function makeWinState(overrides: Partial<BingoWinState> = {}): BingoWinState {
	return {
		localScore: 0, oppScore: null, scoreTarget: 3, scoreUnit: 'lines',
		localWinTileIndices: [], oppWinTileIndices: [],
		hasWon: false, localWinner: false, oppWinner: false,
		localControlledLines: [], oppControlledLines: [],
		...overrides,
	};
}

function makeBingoSession(tiles: BingoTile[], winState?: BingoWinState): BingoSession {
	return {
		board: { id: 'b1', size: 3, tiles, difficulty: 'medium', createdAt: 0 },
		settings: {
			mode: 'lockout', boardSize: 3, difficulty: 'medium', winCondition: 3,
			lines: { rows: true, columns: true, diagonals: true },
			requireQueueAfterGame: false, timer: { enabled: false, durationMinutes: 60 },
			twitchEnabled: false, twitchChannel: '',
		},
		startedAt: 0, localPlayerIndex: 0,
		role: 'host', opponentConnected: true,
		localName: 'Player 1', opponentName: 'Player 2',
		winState,
	};
}

function makeIronManSession(overrides: Partial<IronManSession> = {}): IronManSession {
	return {
		settings: { variant: 'standard', rosterSize: 3, hideOpponent: false, stocksPerChar: 4, charOrder: 'free', charSelection: 'pick', randomSync: 'shared' },
		localRoster: {
			slots: [
				{ characterId: 20, depleted: false, completed: false, stocksRemaining: 4 },
				{ characterId: 2,  depleted: true,  completed: false, stocksRemaining: 0 },
				{ characterId: 9,  depleted: false, completed: false, stocksRemaining: 4 },
			],
			currentIndex: 0,
		},
		opponentRoster: null,
		role: 'solo', localName: 'Player 1', opponentName: null,
		localPlayerIndex: 0, opponentConnected: false,
		startedAt: 0, winner: null, pendingCarryStocks: null,
		...overrides,
	};
}

// ── completedByArray ──────────────────────────────────────────────────────────

describe('WebhookService.completedByArray', () => {
	it('returns [] for null', () => {
		expect(WebhookService.completedByArray(null)).toEqual([]);
	});
	it("returns ['local'] for 'local'", () => {
		expect(WebhookService.completedByArray('local')).toEqual(['local']);
	});
	it("returns ['opponent'] for 'opponent'", () => {
		expect(WebhookService.completedByArray('opponent')).toEqual(['opponent']);
	});
	it("returns ['local','opponent'] for 'both'", () => {
		expect(WebhookService.completedByArray('both')).toEqual(['local', 'opponent']);
	});
});

// ── tileStates ────────────────────────────────────────────────────────────────

describe('WebhookService.tileStates', () => {
	it('returns [] for a normal tile', () => {
		expect(WebhookService.tileStates(makeTile())).toEqual([]);
	});
	it("returns ['frozen'] for a frozen tile", () => {
		expect(WebhookService.tileStates(makeTile({ frozen: true }))).toEqual(['frozen']);
	});
	it('returns [] when frozen is false', () => {
		expect(WebhookService.tileStates(makeTile({ frozen: false }))).toEqual([]);
	});
});

// ── stripBingoBoardState ──────────────────────────────────────────────────────

describe('WebhookService.stripBingoBoardState', () => {
	it('assigns correct index, row, col for a 3×3 board', () => {
		const tiles = Array.from({ length: 9 }, (_, i) => makeTile({ instanceId: `t${i}` }));
		const session = makeBingoSession(tiles);
		const { tiles: out } = WebhookService.stripBingoBoardState(session);
		expect(out[0]).toMatchObject({ index: 0, row: 0, col: 0 });
		expect(out[4]).toMatchObject({ index: 4, row: 1, col: 1 });
		expect(out[8]).toMatchObject({ index: 8, row: 2, col: 2 });
	});

	it('normalises completedBy on all tiles', () => {
		const tiles = [
			makeTile({ instanceId: 't0', completedBy: null }),
			makeTile({ instanceId: 't1', completedBy: 'local' }),
			makeTile({ instanceId: 't2', completedBy: 'opponent' }),
			makeTile({ instanceId: 't3', completedBy: 'both' }),
			...Array.from({ length: 5 }, (_, i) => makeTile({ instanceId: `t${i + 4}` })),
		];
		const { tiles: out } = WebhookService.stripBingoBoardState(makeBingoSession(tiles));
		expect(out[0].completedBy).toEqual([]);
		expect(out[1].completedBy).toEqual(['local']);
		expect(out[2].completedBy).toEqual(['opponent']);
		expect(out[3].completedBy).toEqual(['local', 'opponent']);
	});

	it('maps frozen to states array', () => {
		const tiles = [
			makeTile({ instanceId: 't0', frozen: true }),
			makeTile({ instanceId: 't1', frozen: false }),
			...Array.from({ length: 7 }, (_, i) => makeTile({ instanceId: `t${i + 2}` })),
		];
		const { tiles: out } = WebhookService.stripBingoBoardState(makeBingoSession(tiles));
		expect(out[0].states).toEqual(['frozen']);
		expect(out[1].states).toEqual([]);
	});

	it('strips frozen/frozenUntil/frozenForOpponent from output', () => {
		const tiles = [makeTile({ frozen: true, frozenUntil: 9999, frozenForOpponent: true }),
			...Array.from({ length: 8 }, (_, i) => makeTile({ instanceId: `t${i + 1}` }))];
		const { tiles: out } = WebhookService.stripBingoBoardState(makeBingoSession(tiles));
		expect(out[0]).not.toHaveProperty('frozen');
		expect(out[0]).not.toHaveProperty('frozenUntil');
		expect(out[0]).not.toHaveProperty('frozenForOpponent');
	});

	it('passes through new BingoTile fields automatically', () => {
		const tile = { ...makeTile(), customField: 'test' } as BingoTile & { customField: string };
		const tiles = [tile, ...Array.from({ length: 8 }, (_, i) => makeTile({ instanceId: `t${i + 1}` }))];
		const { tiles: out } = WebhookService.stripBingoBoardState(makeBingoSession(tiles as BingoTile[]));
		expect((out[0] as any).customField).toBe('test');
	});

	it('derives winner from winState', () => {
		const tiles = Array.from({ length: 9 }, (_, i) => makeTile({ instanceId: `t${i}` }));
		const localWins = WebhookService.stripBingoBoardState(
			makeBingoSession(tiles, makeWinState({ localWinner: true, hasWon: true }))
		);
		const oppWins = WebhookService.stripBingoBoardState(
			makeBingoSession(tiles, makeWinState({ oppWinner: true, hasWon: true }))
		);
		const noWinner = WebhookService.stripBingoBoardState(makeBingoSession(tiles));
		expect(localWins.winner).toBe('local');
		expect(oppWins.winner).toBe('opponent');
		expect(noWinner.winner).toBeNull();
	});

	it('includes localScore, oppScore, localName, opponentName', () => {
		const tiles = Array.from({ length: 9 }, (_, i) => makeTile({ instanceId: `t${i}` }));
		const session = makeBingoSession(tiles, makeWinState({ localScore: 2, oppScore: 1 }));
		const out = WebhookService.stripBingoBoardState(session);
		expect(out.localScore).toBe(2);
		expect(out.oppScore).toBe(1);
		expect(out.localName).toBe('Player 1');
		expect(out.opponentName).toBe('Player 2');
	});
});

// ── stripIronManUpdate ────────────────────────────────────────────────────────

describe('WebhookService.stripIronManUpdate', () => {
	it('marks the slot at currentIndex as active', () => {
		const session = makeIronManSession({ localRoster: { slots: [
			{ characterId: 20, depleted: false, completed: false, stocksRemaining: 4 },
			{ characterId: 2,  depleted: false, completed: false, stocksRemaining: 4 },
		], currentIndex: 1 } });
		const { roster } = WebhookService.stripIronManUpdate(session);
		expect(roster[0].isActive).toBe(false);
		expect(roster[1].isActive).toBe(true);
	});

	it('includes characterName on roster slots', () => {
		const { roster } = WebhookService.stripIronManUpdate(makeIronManSession());
		expect(roster[0].characterName).toBe('Falco');   // id 20
		expect(roster[1].characterName).toBe('Fox');     // id 2
		expect(roster[2].characterName).toBe('Marth');   // id 9
	});

	it('sets currentCharacter to the active slot', () => {
		const { currentCharacter } = WebhookService.stripIronManUpdate(makeIronManSession());
		expect(currentCharacter?.characterId).toBe(20);
		expect(currentCharacter?.characterName).toBe('Falco');
	});

	it('sets currentCharacter to null when currentIndex is past end', () => {
		const session = makeIronManSession({ localRoster: { slots: [], currentIndex: 0 } });
		expect(WebhookService.stripIronManUpdate(session).currentCharacter).toBeNull();
	});

	it('passes through all IronManCharSlot fields', () => {
		const { roster } = WebhookService.stripIronManUpdate(makeIronManSession());
		expect(roster[1]).toMatchObject({ characterId: 2, depleted: true, completed: false, stocksRemaining: 0 });
	});

	it('includes opponentRoster when present', () => {
		const session = makeIronManSession({
			opponentRoster: { slots: [{ characterId: 9, depleted: false, completed: false, stocksRemaining: 4 }], currentIndex: 0 },
		});
		const { opponentRoster } = WebhookService.stripIronManUpdate(session);
		expect(opponentRoster).not.toBeNull();
		expect(opponentRoster![0].characterName).toBe('Marth');
		expect(opponentRoster![0].isActive).toBe(true);
	});

	it('returns null opponentRoster for solo sessions', () => {
		expect(WebhookService.stripIronManUpdate(makeIronManSession()).opponentRoster).toBeNull();
	});

	it('includes winner, pendingCarryStocks, variant, role', () => {
		const session = makeIronManSession({ winner: 'local', pendingCarryStocks: 2 });
		const out = WebhookService.stripIronManUpdate(session);
		expect(out.winner).toBe('local');
		expect(out.pendingCarryStocks).toBe(2);
		expect(out.variant).toBe('standard');
		expect(out.role).toBe('solo');
	});
});
