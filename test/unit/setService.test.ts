import "reflect-metadata";
import { EventEmitter } from 'events';
import { ElectronSetService, DEFAULT_COUNTERPICKS, DEFAULT_STARTERS } from '../../electron/services/setService';
import type { StrikeState } from '../../frontend/src/lib/models/types/stageStriking';
import type { GameStats } from '../../frontend/src/lib/models/types/slippiData';
import { stageStatus } from '../../frontend/src/lib/utils/strikeStageStatus';
import { isAllowedUnauthenticated } from '../../frontend/src/lib/utils/websocketAuthentication';
import { LiveStatsScene } from '../../frontend/src/lib/models/enum';
import { nulled } from '../../frontend/src/lib/models/types/slippiTypes';

const log = { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() };

function setup(persisted?: StrikeState, recentGames: GameStats[] = [], gameSettings?: unknown) {
	const clientEmitter = new EventEmitter();
	const localEmitter = new EventEmitter();
	let stored = persisted;
	let tokens: { 1: string; 2: string } | undefined = { 1: 'a'.repeat(24), 2: 'b'.repeat(24) };
	const strikeStore = {
		getStrikeState: () => stored,
		setStrikeState: (s: StrikeState) => { stored = s; },
		getPlayerTokens: () => tokens,
		setPlayerTokens: (t: { 1: string; 2: string }) => { tokens = t; },
	};
	const storeGames = { getRecentGames: async () => recentGames, clearRecentGames: async () => undefined };
	let scene = LiveStatsScene.Menu;
	const setStatsScene = jest.fn((x) => { scene = x; });
	const storeLiveStats = { setStatsScene, autoScene: setStatsScene, getStatsScene: () => scene, getGameSettings: () => gameSettings };
	const messageHandler = { sendHostMessage: jest.fn() };
	const service = new ElectronSetService(log as never, clientEmitter as never, localEmitter as never, strikeStore as never, storeGames as never, storeLiveStats as never, messageHandler as never);
	return { service, clientEmitter, localEmitter, state: () => service.getState(), scene: () => scene, setScene: (x: LiveStatsScene) => { scene = x; }, messageHandler, tokens: () => tokens! };
}

/** Play game 1 through to 'playing': chars → RPS (P1 wins) → P1 strikes first. */
function toGame1(service: ElectronSetService, bestOf: 3 | 5 = 3, allowAgreement = true, names: [string, string] = ['A', 'B']) {
	service.startSet(names[0], names[1], bestOf, allowAgreement);
	service.playerConnect(1);
	service.playerConnect(2);
	service.selectCharacter(1, 2);
	service.selectCharacter(2, 20);
	service.rpsChoice(1, 'rock');
	service.rpsChoice(2, 'scissors');
	service.rpsWinnerOrder(1);
	const [a, b, c, d] = DEFAULT_STARTERS;
	service.strikeStage(a); // P1 strikes 1
	service.strikeStage(b); // P2 strikes 2
	service.strikeStage(c);
	service.strikeStage(d); // P1 strikes 1 → 1 left
}

const slippiGame = (winnerPort: number, stageId = 31, ports: [number, number] = [0, 1]): GameStats => ({
	gameEnd: { gameEndMethod: 2, lrasInitiatorIndex: -1, placements: ports.map((p) => ({ playerIndex: p, position: p === winnerPort ? 0 : 1 })) },
	isMock: false, isReplay: false, postGameStats: null, score: [0, 0], timestamp: null,
	lastFrame: { frame: 1, players: Object.fromEntries(ports.map((p, i) => [p, { post: { stocksRemaining: i + 1, percent: i * 10 } }])) },
	settings: { stageId, players: ports.map((p) => ({ playerIndex: p, port: p + 1, connectCode: '' })), matchInfo: {} },
} as unknown as GameStats);

afterEach(() => jest.useRealTimers());

describe('Stage striking — ruleset', () => {
	it('uses the current singles stage list', () => {
		expect(DEFAULT_STARTERS).toEqual([2, 8, 28, 31, 32]);
		expect(DEFAULT_COUNTERPICKS).toEqual([3]);
	});

	it('game 1: characters first, then RPS, then the winner chooses strike order', () => {
		const { service, state } = setup();
		service.startSet('A', 'B', 3);
		expect(state().phase).toBe('charSelect');
		service.selectCharacter(1, 2);
		expect(state().phase).toBe('charSelect');
		service.selectCharacter(2, 20);
		expect(state().phase).toBe('rps');
		service.rpsChoice(1, 'paper');
		service.rpsChoice(2, 'scissors');
		expect(state().phase).toBe('rpsResult');
		expect(state().currentStriker).toBe(2);
		service.rpsWinnerOrder(1); // P2 won RPS and lets P1 strike first
		expect(state().phase).toBe('striking');
		expect(state().currentStriker).toBe(1);
		expect(state().strikeOrder).toEqual([[1, 1], [2, 2], [1, 1]]);
	});

	it('striking 1-2-1 leaves one starter and goes straight to playing', () => {
		const { service, state } = setup();
		toGame1(service);
		expect(state().phase).toBe('playing');
		expect(state().finalStageId).toBe(DEFAULT_STARTERS[4]);
		expect(state().characters).toEqual({ p1: 2, p2: 20 });
	});

	it('game 2 (Bo3): winner bans 1, loser picks (minus DSR), winner then loser pick characters', () => {
		const { service, state } = setup();
		toGame1(service);
		service.reportWinner(1);
		expect(state().phase).toBe('stageBan');
		expect(state().currentStriker).toBe(1);
		expect(state().stages.sort()).toEqual([...DEFAULT_STARTERS, ...DEFAULT_COUNTERPICKS].sort());
		service.strikeStage(3);
		expect(state().phase).toBe('stagePick');
		expect(state().currentStriker).toBe(2);
		expect(state().stages).not.toContain(3);
		service.pickStage(31);
		expect(state().phase).toBe('charLock');
		service.selectCharacter(2, 9); // loser can't lock first
		expect(state().phase).toBe('charLock');
		service.selectCharacter(1, 2);
		service.selectCharacter(2, 9);
		expect(state().phase).toBe('playing');
	});

	it('DSR: the loser cannot pick a stage they already won on', () => {
		const { service, state } = setup();
		toGame1(service);
		service.reportWinner(2); // P2 wins on the struck stage
		service.strikeStage(8);
		service.pickStage(31);
		service.selectCharacter(2, 20);
		service.selectCharacter(1, 2);
		service.reportWinner(1); // P1 wins on Battlefield → P2 (loser) may not pick their win stage
		expect(state().stages).not.toContain(DEFAULT_STARTERS[4]);
		expect(state().stages).toContain(31);
	});

	it('Bo5: no winner ban — loser picks straight away', () => {
		const { service, state } = setup();
		toGame1(service, 5);
		service.reportWinner(1);
		expect(state().phase).toBe('stagePick');
		expect(state().currentStriker).toBe(2);
	});

	it('set completes at the required wins', () => {
		const { service, state } = setup();
		toGame1(service);
		service.reportWinner(1);
		service.strikeStage(3);
		service.pickStage(31);
		service.selectCharacter(1, 2);
		service.selectCharacter(2, 20);
		service.reportWinner(1);
		expect(state().phase).toBe('setComplete');
		expect(state().score).toEqual({ p1: 2, p2: 0 });
	});

	it('warmup on game 1 re-picks characters on the same stage without re-striking', () => {
		const { service, state } = setup();
		toGame1(service);
		const stage = state().finalStageId;
		service.markWarmup();
		expect(state().phase).toBe('charSelect');
		service.selectCharacter(1, 9);
		service.selectCharacter(2, 9);
		expect(state().phase).toBe('playing');
		expect(state().finalStageId).toBe(stage);
	});

	it('undo restores the previous game', () => {
		const { service, state } = setup();
		toGame1(service);
		service.reportWinner(1);
		service.undoLastGame();
		expect(state().phase).toBe('playing');
		expect(state().score).toEqual({ p1: 0, p2: 0 });
		expect(state().dsrStages.p1).toEqual([]);
	});
});

describe('Stage striking — Slippi auto-report', () => {
	it('reports the winner by slot (ports 1 + 3) and records the played stage for DSR', async () => {
		const { service, state } = setup(undefined, [slippiGame(2, 8, [0, 2])]);
		toGame1(service);
		await service.reportFromGame(slippiGame(2, 8, [0, 2]));
		expect(state().score).toEqual({ p1: 0, p2: 1 });
		expect(state().dsrStages.p2).toEqual([8]);
	});

	it('ignores games outside the playing phase and ties', async () => {
		const { service, state } = setup();
		service.startSet('A', 'B', 3);
		await service.reportFromGame(slippiGame(0));
		expect(state().score).toEqual({ p1: 0, p2: 0 });
		toGame1(service);
		await service.reportFromGame(slippiGame(-1));
		expect(state().score).toEqual({ p1: 0, p2: 0 });
	});


	it('a manual report after the auto-report does not double count', async () => {
		const { service, state } = setup();
		toGame1(service);
		await service.reportFromGame(slippiGame(0));
		service.reportWinner(1);
		expect(state().score).toEqual({ p1: 1, p2: 0 });
	});
});

describe('Stage striking — RPS timer', () => {
	it('resumes an expired countdown after a restart and auto-picks', () => {
		jest.useFakeTimers();
		const persisted = { ...setup().service.getState(), phase: 'rps', rpsDeadline: Date.now() - 1000, rps: { p1: 'rock', p2: null, winner: null } } as StrikeState;
		const { state } = setup(persisted);
		jest.runAllTimers();
		expect(state().rps.p2).not.toBeNull();
		expect(['rpsResult', 'rps']).toContain(state().phase); // tie → new round
	});
});

const P1 = 'a'.repeat(24);
const P2 = 'b'.repeat(24);

describe('Stage striking — phone tokens', () => {
	it('unauthenticated clients may only send striking actions that carry a token', () => {
		expect(isAllowedUnauthenticated('StrikeStage', [31, P1])).toBe(true);
		expect(isAllowedUnauthenticated('StrikeStage', [31])).toBe(false);
		expect(isAllowedUnauthenticated('ReportWinner', [1, P1])).toBe(false);
		expect(isAllowedUnauthenticated('ResetSet', [])).toBe(false);
		expect(isAllowedUnauthenticated('Ping', [])).toBe(true);
	});

	it('a phone may act only as its own player and only on its turn; the host may do anything', () => {
		const { clientEmitter, state, service } = setup();
		service.startSet('A', 'B', 3);
		clientEmitter.emit('SelectCharacter', 1, 2, P2); // P2's token picking for P1 → rejected
		expect(state().characters.p1).toBeNull();
		clientEmitter.emit('SelectCharacter', 1, 2, P1);
		clientEmitter.emit('SelectCharacter', 2, 20, P2);
		clientEmitter.emit('RpsChoice', 1, 'rock', P1);
		clientEmitter.emit('RpsChoice', 2, 'scissors', P2);
		clientEmitter.emit('RpsWinnerOrder', 2, P2); // only the RPS winner (P1) chooses
		expect(state().phase).toBe('rpsResult');
		clientEmitter.emit('RpsWinnerOrder', 1, P1);
		clientEmitter.emit('StrikeStage', 2, P2); // not P2's turn
		expect(state().strikes).toEqual([]);
		clientEmitter.emit('StrikeStage', 2, 'x'.repeat(24)); // unknown token
		expect(state().strikes).toEqual([]);
		clientEmitter.emit('StrikeStage', 2, P1);
		expect(state().strikes).toEqual([2]);
		clientEmitter.emit('StrikeStage', 8); // host (no token) may strike for anyone
		expect(state().strikes).toEqual([2, 8]);
	});

	it('reset makes new links', () => {
		const { clientEmitter, tokens, messageHandler } = setup();
		const before = tokens()[1];
		clientEmitter.emit('ResetSet');
		expect(tokens()[1]).not.toBe(before);
		expect(messageHandler.sendHostMessage).toHaveBeenCalledWith('StrikePlayerTokens', tokens());
	});
});

describe('Stage striking — stage status (overlay conditions)', () => {
	it('game 1: starters available, counterpick locked, struck → struck, last → picked', () => {
		const { service, state } = setup();
		service.startSet('A', 'B', 3);
		expect(stageStatus(state(), 3)).toBe('locked');
		expect(stageStatus(state(), 31)).toBe('available');
		expect(stageStatus(state(), 999)).toBe('locked');
		toGame1(service);
		expect(stageStatus(state(), DEFAULT_STARTERS[0])).toBe('struck');
		expect(stageStatus(state(), DEFAULT_STARTERS[4])).toBe('picked');
	});

	it('game 2: winner ban → struck (kept for the game), loser DSR → dsr, picked → picked', () => {
		const { service, state } = setup();
		toGame1(service);
		const won = DEFAULT_STARTERS[4];
		service.reportWinner(2); // P2 wins on the struck-to stage → P1 picks next, P2's DSR is irrelevant to P1
		expect(stageStatus(state(), 3)).toBe('available'); // counterpick unlocked
		service.strikeStage(31); // P2 bans BF
		expect(stageStatus(state(), 31)).toBe('struck');
		service.pickStage(8);
		expect(stageStatus(state(), 8)).toBe('picked');
		expect(stageStatus(state(), 31)).toBe('struck');
		service.selectCharacter(2, 20);
		service.selectCharacter(1, 2);
		service.reportWinner(1); // P1 wins on YS → P2 picks; P2 already won on `won`
		expect(stageStatus(state(), won)).toBe('dsr');
		expect(stageStatus(state(), 31)).toBe('available'); // last game's ban is gone
	});
});

describe('Stage striking — agreement on a DSR stage', () => {
	const toDsrPick = (service: ElectronSetService, allowAgreement = true) => {
		toGame1(service, 3, allowAgreement);
		service.reportWinner(2); // P2 wins game 1 on the last starter
		service.strikeStage(31);
		service.pickStage(8);
		service.selectCharacter(2, 20);
		service.selectCharacter(1, 2);
		service.reportWinner(1); // P2 lost → P2 picks after P1 bans; P2's won stage is DSR for P2
		service.strikeStage(28);
	};

	it('both confirm → the blocked stage is played', () => {
		const { service, state } = setup();
		toDsrPick(service);
		const blocked = DEFAULT_STARTERS[4];
		expect(state().phase).toBe('stagePick');
		service.requestAgreement(2, blocked);
		expect(state().agreement).toEqual({ stageId: blocked, requestedBy: 2 });
		service.answerAgreement(2, true); // requester can't accept their own request
		expect(state().phase).toBe('stagePick');
		service.answerAgreement(1, true);
		expect(state().finalStageId).toBe(blocked);
		expect(state().phase).toBe('charLock');
	});

	it('decline, or the option turned off, keeps DSR', () => {
		const { service, state } = setup();
		toDsrPick(service);
		service.requestAgreement(2, DEFAULT_STARTERS[4]);
		service.answerAgreement(1, false);
		expect(state().agreement).toBeNull();
		expect(state().phase).toBe('stagePick');

		const off = setup();
		toDsrPick(off.service, false);
		off.service.requestAgreement(2, DEFAULT_STARTERS[4]);
		expect(off.state().agreement ?? null).toBeNull();
	});
});

describe('Stage striking — set rules', () => {
	it('end match with a winner completes the set with that result; without one it cancels', () => {
		const { service, state } = setup();
		toGame1(service);
		service.endMatch(2);
		expect(state().phase).toBe('setComplete');
		expect(state().setWinner).toBe(2);
		service.endMatch(null);
		expect(state().phase).toBe('lobby');
	});

	it('ranked/unranked games and games with other players never count', async () => {
		const { service, state } = setup();
		toGame1(service);
		const ranked = slippiGame(0);
		(ranked.settings as any).matchInfo = { mode: 'ranked' };
		await service.reportFromGame(ranked);
		expect(state().score).toEqual({ p1: 0, p2: 0 });

		const g1 = slippiGame(0);
		(g1.settings as any).players = [{ playerIndex: 0, connectCode: 'AAA#1' }, { playerIndex: 1, connectCode: 'BBB#2' }];
		await service.reportFromGame(g1);
		expect(state().score).toEqual({ p1: 1, p2: 0 });
		service.strikeStage(31); service.pickStage(8); service.selectCharacter(1, 2); service.selectCharacter(2, 20);
		const stranger = slippiGame(0);
		(stranger.settings as any).players = [{ playerIndex: 0, connectCode: 'AAA#1' }, { playerIndex: 1, connectCode: 'ZZZ#9' }];
		await service.reportFromGame(stranger);
		expect(state().score).toEqual({ p1: 1, p2: 0 });
	});

	it('a set idle for over 3 hours ends on startup', () => {
		const old = { ...setup().service.getState(), phase: 'stageBan', updatedAt: Date.now() - 4 * 3600_000 } as StrikeState;
		expect(setup(old).state().phase).toBe('lobby');
		const recent = { ...old, updatedAt: Date.now() - 60_000 } as StrikeState;
		expect(setup(recent).state().phase).toBe('stageBan');
	});

	it('striking actions on a phone are announced to flows (the scene flow shows Stage Striking); rejected ones are not', () => {
		const { service, state, clientEmitter, localEmitter } = setup();
		const actions: unknown[] = [];
		localEmitter.on('StrikePlayerAction', (a: unknown) => actions.push(a));
		toGame1(service);
		service.reportWinner(1);
		clientEmitter.emit('StrikeStage', 31, P1); // P1 (winner) bans
		expect(state().bans).toEqual([31]);
		expect(actions).toEqual([{ event: 'ban', player: 1, playerName: 'A', phase: 'stagePick', stage: 'Battlefield', character: null, rps: null }]);
		clientEmitter.emit('StrikeStage', 32, P1); // not P1's turn any more → rejected
		expect(actions).toHaveLength(1);
		// the set's stage log: the ban, by the winner, in game 2
		expect(state().stageLog?.at(-1)).toEqual({ game: 2, action: 'ban', stageId: 31, player: 1 });
	});

	it('changes that are no player\'s choice (a reported game…) reach flows once, as event "change"', async () => {
		const { service, localEmitter } = setup();
		const events: string[] = [];
		localEmitter.on('StrikePlayerAction', (a: { event: string }) => events.push(a.event));
		toGame1(service);
		await Promise.resolve();
		events.length = 0;
		service.reportWinner(1);
		await Promise.resolve();
		expect(events).toEqual(['change']);
	});

	it('starting a set from the Dashboard is announced to flows', async () => {
		const { clientEmitter, localEmitter } = setup();
		const started = new Promise((resolve) => localEmitter.on('SetStarted', resolve));
		clientEmitter.emit('StartSet', 'A', 'B', 3);
		expect(await started).toMatchObject({ p1Name: 'A', p2Name: 'B', bestOf: 3, ruleset: 'singles' });
	});
});

describe('Stage striking — names and agreement cancel', () => {
	it('default names take the players\' tags from the first game', async () => {
		const { service, state } = setup();
		toGame1(service, 3, true, ['', '']); // empty → 'Player 1' / 'Player 2'
		const g = slippiGame(0);
		(g.settings as any).players = [{ playerIndex: 0, displayName: 'Mango', connectCode: 'MANG#0' }, { playerIndex: 1, displayName: '', connectCode: 'ZAIN#1' }];
		await service.reportFromGame(g);
		expect(state().p1Name).toBe('Mango');
		expect(state().p2Name).toBe('ZAIN#1');
	});

	it('names typed by the host are kept', async () => {
		const { service, state } = setup();
		toGame1(service); // starts as 'A' vs 'B'
		const g = slippiGame(0);
		(g.settings as any).players = [{ playerIndex: 0, displayName: 'Mango' }, { playerIndex: 1, displayName: 'Zain' }];
		await service.reportFromGame(g);
		expect([state().p1Name, state().p2Name]).toEqual(['A', 'B']);
	});

	it('the requester can withdraw a request', () => {
		const { service, state } = setup();
		toGame1(service);
		service.reportWinner(2);
		service.strikeStage(31); service.pickStage(8); service.selectCharacter(2, 20); service.selectCharacter(1, 2);
		service.reportWinner(1);
		service.strikeStage(28);
		service.requestAgreement(2, DEFAULT_STARTERS[4]);
		service.answerAgreement(2, false);
		expect(state().agreement).toBeNull();
		expect(state().phase).toBe('stagePick');
	});
});

describe('Stage striking — host controls', () => {
	it('undo steps back one real action; rejected actions are not recorded', () => {
		const { clientEmitter, state, service } = setup();
		service.startSet('A', 'B', 3);
		clientEmitter.emit('SelectCharacter', 1, 2, P1);
		clientEmitter.emit('SelectCharacter', 1, 9, P2); // rejected (wrong player) — not recorded
		clientEmitter.emit('SelectCharacter', 2, 20, P2);
		expect(state().phase).toBe('rps');
		clientEmitter.emit('StrikeUndoAction');
		expect(state().characters).toEqual({ p1: 2, p2: null });
		expect(state().phase).toBe('charSelect');
		clientEmitter.emit('StrikeUndoAction');
		expect(state().characters).toEqual({ p1: null, p2: null });
	});

	it('restart step: game 1 strikes start over; game 2 ban + pick start over', () => {
		const { service, state, clientEmitter } = setup();
		service.startSet('A', 'B', 3);
		service.selectCharacter(1, 2); service.selectCharacter(2, 20);
		service.rpsChoice(1, 'rock'); service.rpsChoice(2, 'scissors'); service.rpsWinnerOrder(1);
		service.strikeStage(2); service.strikeStage(8);
		clientEmitter.emit('StrikeRestartStep');
		expect(state().strikes).toEqual([]);
		expect(state().currentStriker).toBe(1);
		clientEmitter.emit('StrikeUndoAction'); // undo the restart
		expect(state().strikes).toEqual([2, 8]);

		toGame1(service);
		service.reportWinner(1);
		service.strikeStage(31); service.pickStage(8);
		clientEmitter.emit('StrikeRestartStep');
		expect(state().phase).toBe('stageBan');
		expect(state().bans).toEqual([]);
		expect(state().stages).toContain(31);
	});

	it('pause blocks phones but not the host', () => {
		const { clientEmitter, state, service } = setup();
		service.startSet('A', 'B', 3);
		clientEmitter.emit('StrikePause', true);
		clientEmitter.emit('SelectCharacter', 1, 2, P1);
		expect(state().characters.p1).toBeNull();
		clientEmitter.emit('SelectCharacter', 1, 2); // host
		expect(state().characters.p1).toBe(2);
		clientEmitter.emit('StrikePause', false);
		clientEmitter.emit('SelectCharacter', 2, 20, P2);
		expect(state().characters.p2).toBe(20);
	});
});

describe('Stage striking — doubles ruleset', () => {
	it('doubles: BF, DL, FD, PS, YS starters, no counterpicks, FoD locked, team names default', () => {
		const { service, state } = setup();
		service.startSet('', '', 3, true, 'doubles');
		expect([...state().starters].sort((a, b) => a - b)).toEqual([3, 8, 28, 31, 32]);
		expect(state().counterpicks).toEqual([]);
		expect([state().p1Name, state().p2Name]).toEqual(['Team 1', 'Team 2']);
		expect(stageStatus(state(), 2)).toBe('locked'); // Fountain of Dreams is not in doubles
		expect(stageStatus(state(), 3)).toBe('available'); // Pokémon Stadium is a starter
	});
});

describe('Stage striking — doubles teams', () => {
	// ports 1-4: blue, red, red, blue → Team 1 = red (ports 2+3), Team 2 = blue (ports 1+4)
	const teamsSettings = {
		isTeams: true,
		players: [
			{ playerIndex: 0, port: 1, teamId: 1, connectCode: '', displayName: 'Cody' },
			{ playerIndex: 1, port: 2, teamId: 0, connectCode: '', displayName: 'Mango' },
			{ playerIndex: 2, port: 3, teamId: 0, connectCode: '', displayName: '' },
			{ playerIndex: 3, port: 4, teamId: 1, connectCode: '', displayName: 'aMSa' },
		],
	};

	it('phones show each team\'s players by tag, else "Port N", lower port first', () => {
		const { service, state } = setup(undefined, [], teamsSettings);
		service.startSet('', '', 3, true, 'doubles');
		expect(state().teamMembers).toEqual({ p1: ['Cody', 'aMSa'], p2: ['Mango', 'Port 3'] }); // Team 1 = the team with port 1
	});

	it('a team picks both characters at once; one pick alone is rejected', () => {
		const { service, state } = setup(undefined, [], teamsSettings);
		service.startSet('', '', 3, true, 'doubles');
		service.selectCharacter(1, 2);
		expect(state().characters.p1).toBeNull();
		service.selectCharacter(1, 2, 20);
		service.selectCharacter(2, 9, 15);
		expect(state().characters).toEqual({ p1: 2, p2: 9 });
		expect(state().partnerCharacters).toEqual({ p1: 20, p2: 15 });
		expect(state().phase).toBe('rps');
	});

	it('the doubles game winner is reported by team', async () => {
		const { service, state } = setup(undefined, [], teamsSettings);
		service.startSet('', '', 3, true, 'doubles');
		service.playerConnect(1);
		service.playerConnect(2);
		service.selectCharacter(1, 2, 20);
		service.selectCharacter(2, 9, 15);
		service.rpsChoice(1, 'rock');
		service.rpsChoice(2, 'scissors');
		service.rpsWinnerOrder(1);
		for (const id of state().starters.slice(0, 4)) service.strikeStage(id);
		expect(state().phase).toBe('playing');
		const game = {
			gameEnd: { gameEndMethod: 2, lrasInitiatorIndex: -1, placements: [0, 1, 2, 3].map((i) => ({ playerIndex: i, position: i === 3 ? 0 : 1 })) },
			isMock: false, isReplay: false, postGameStats: null, score: [0, 0], timestamp: null, lastFrame: null,
			settings: { ...teamsSettings, stageId: 31, matchInfo: {} },
		} as unknown as GameStats;
		await service.reportFromGame(game); // aMSa (port 4, Cody's team = Team 1) placed first
		expect(state().score).toEqual({ p1: 1, p2: 0 });
		expect(state().games[0]).toMatchObject({ p1Char: 2, p2Char: 9, p1PartnerChar: 20, p2PartnerChar: 15 });
	});
});

describe('Stage striking — loading previous games', () => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { SlippiGame } = require('@slippi/slippi-js/node');
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const path = require('path');
	const load = (dir: string, file: string) => {
		const slp = new SlippiGame(path.join(__dirname, '../sample-games', dir, file));
		return { settings: nulled(slp.getSettings()), gameEnd: nulled(slp.getGameEnd()), lastFrame: nulled(slp.getLatestFrame()), postGameStats: null } as unknown as GameStats;
	};
	const set1 = ['Replay 1 [W].slp', 'Replay 2 [W].slp', 'Replay 3 [L].slp'].map((f) => load('direct-set-1', f));

	it('3 games into a Bo5: score, DSR, records and the next step as if reported live', () => {
		const { service, state } = setup();
		service.startSet('A', 'B', 5);
		service.loadGames(set1);
		expect(state().games).toHaveLength(3);
		expect(state().score.p1 + state().score.p2).toBe(3);
		expect(state().gameNum).toBe(4);
		expect(state().phase).toBe('stagePick'); // Bo5: no ban, the loser picks
		const lastWinner = state().games[2].winner!;
		expect(state().currentStriker).toBe(lastWinner === 1 ? 2 : 1);
		for (const g of state().games) expect(state().dsrStages[g.winner === 1 ? 'p1' : 'p2']).toContain(g.stageId);
		expect(state().games.every((g) => g.p1Char !== null && g.p2Char !== null)).toBe(true);
	});

	it('the same result whichever way it is fed: live reports == loaded games', async () => {
		const live = setup();
		live.service.startSet('A', 'B', 5);
		for (const g of set1) {
			(live.service as unknown as { state: StrikeState }).state = { ...live.state(), phase: 'playing' }; // skip the phone steps
			await live.service.reportFromGame(g);
		}
		const loaded = setup();
		loaded.service.startSet('A', 'B', 5);
		loaded.service.loadGames(set1);
		expect(loaded.state().score).toEqual(live.state().score);
		expect(loaded.state().dsrStages).toEqual(live.state().dsrStages);
	});

	it('a finished set stops at the winning game; nothing loads without a running set', () => {
		const all = [...set1, load('direct-set-1', 'Replay 4 [W].slp')];
		const { service, state } = setup();
		service.startSet('A', 'B', 3);
		service.loadGames(all);
		expect(state().phase).toBe('setComplete');
		expect(Math.max(state().score.p1, state().score.p2)).toBe(2);

		const idle = setup();
		idle.service.loadGames(all);
		expect(idle.state().games).toHaveLength(0);
	});

	it('doubles replay: the red team (Team 2, ports 2 + 3) wins and both teams\' characters are recorded', () => {
		const { service, state } = setup();
		service.startSet('', '', 3, true, 'doubles');
		service.loadGames([load('direct-doubles-set-1', 'Replay 1 [W].slp')]);
		expect(state().score).toEqual({ p1: 0, p2: 1 });
		const g = state().games[0];
		expect([g.p1Char, g.p2Char, g.p1PartnerChar, g.p2PartnerChar].every((c) => c !== null)).toBe(true);
		expect(state().teamMembers).not.toBeNull();
	});
});

describe('Stage striking — names from phones', () => {
	it('a phone renames only its own side; the host can overwrite either; empty = default', () => {
		const { service, clientEmitter, state, tokens } = setup();
		service.startSet('', '', 3);
		clientEmitter.emit('StrikeSetName', 1, '  Mango  ', tokens()[1]);
		clientEmitter.emit('StrikeSetName', 2, 'Hacker', tokens()[1]); // P1's token can't rename P2
		expect([state().p1Name, state().p2Name]).toEqual(['Mango', 'Player 2']);
		clientEmitter.emit('StrikeSetName', 2, 'Zain'); // host (no token)
		clientEmitter.emit('StrikeSetName', 1, 'Mango (TO fix)');
		expect([state().p1Name, state().p2Name]).toEqual(['Mango (TO fix)', 'Zain']);
		clientEmitter.emit('StrikeSetName', 2, '   ', tokens()[2]);
		expect(state().p2Name).toBe('Player 2');
	});
});

describe('Stage striking — timeline', () => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { strikeTimeline } = require('../../frontend/src/lib/utils/strikeStageStatus');
	it('game 1: 1-2-1 strikes with the striker, then the stage left over', () => {
		const { service, state } = setup();
		service.startSet('A', 'B', 3);
		expect(strikeTimeline(state())).toEqual([]);
		service.selectCharacter(1, 2);
		service.selectCharacter(2, 20);
		service.rpsChoice(1, 'rock');
		service.rpsChoice(2, 'scissors');
		service.rpsWinnerOrder(2); // B strikes first
		const [a, b] = DEFAULT_STARTERS;
		service.strikeStage(a);
		service.strikeStage(b);
		const t = strikeTimeline(state());
		expect(t.map((s: { kind: string; player: number | null }) => `${s.kind}:${s.player}`)).toEqual(['strike:2', 'strike:1', 'strike:1', 'strike:2', 'final:null']);
		expect(t.map((s: { stageId: number | null }) => s.stageId)).toEqual([a, b, null, null, null]);
		expect(t.findIndex((s: { current: boolean }) => s.current)).toBe(2);
	});

	it('game 2 (Bo3): the winner bans, then the loser picks; no ban in Bo5', () => {
		const { service, state } = setup();
		toGame1(service);
		service.reportWinner(1);
		let t = strikeTimeline(state());
		expect(t.map((s: { kind: string; player: number | null }) => `${s.kind}:${s.player}`)).toEqual(['ban:1', 'pick:2']);
		expect(t[0].current).toBe(true);
		const bo5 = setup();
		toGame1(bo5.service, 5);
		bo5.service.reportWinner(2);
		t = strikeTimeline(bo5.state());
		expect(t.map((s: { kind: string; player: number | null }) => `${s.kind}:${s.player}`)).toEqual(['pick:1']);
	});
});

describe('Stage striking — the set follows its games list', () => {
	it('adding, changing and removing games in the list rebuilds score and DSR; same results = no change', () => {
		const { service, state } = setup();
		toGame1(service, 5);
		const g = (winnerPort: number, stageId: number) => slippiGame(winnerPort, stageId);
		service.syncFromGames([g(0, 31)]);
		expect(state().score).toEqual({ p1: 1, p2: 0 });
		const phase = state().phase;
		service.syncFromGames([g(0, 31)]); // unchanged → untouched
		expect(state().phase).toBe(phase);

		service.syncFromGames([g(0, 31), g(1, 32)]); // an artificial game won by P2
		expect(state().score).toEqual({ p1: 1, p2: 1 });
		expect(state().dsrStages).toEqual({ p1: [31], p2: [32] });

		service.syncFromGames([g(1, 32)]); // game 1 removed
		expect(state().score).toEqual({ p1: 0, p2: 1 });

		service.syncFromGames([]); // nothing left → back to the start of game 1
		expect(state().games).toHaveLength(0);
		expect(state().phase).toBe('charSelect');
	});
});

describe('Stage striking — swapped sides', () => {
	it('names, score and choices swap; each phone keeps its link and now plays the other side', () => {
		const { service, state } = setup();
		toGame1(service);
		service.reportWinner(1);
		const before = state();
		service.swapSides('sides');
		const after = state();
		expect([after.p1Name, after.p2Name]).toEqual([before.p2Name, before.p1Name]);
		expect(after.score).toEqual({ p1: before.score.p2, p2: before.score.p1 });
		expect(after.lastWinner).toBe(2);
		expect(after.sidesSwapped).toBe(true);
		// the link that was Player 1's (token P1) now acts as side 2
		expect(service.allowedAs(P1, 2)).toBe(true);
		expect(service.allowedAs(P1, 1)).toBe(false);
	});
});
