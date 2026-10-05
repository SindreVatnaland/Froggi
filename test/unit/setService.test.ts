import "reflect-metadata";
import { EventEmitter } from 'events';
import { ElectronSetService, DEFAULT_COUNTERPICKS, DEFAULT_STARTERS } from '../../electron/services/setService';
import type { StrikeState } from '../../frontend/src/lib/models/types/stageStriking';
import type { GameStats } from '../../frontend/src/lib/models/types/slippiData';
import { stageStatus } from '../../frontend/src/lib/utils/strikeStageStatus';
import { isAllowedUnauthenticated } from '../../frontend/src/lib/utils/websocketAuthentication';
import { LiveStatsScene } from '../../frontend/src/lib/models/enum';

const log = { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() };

function setup(persisted?: StrikeState, recentGames: GameStats[] = []) {
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
	const storeLiveStats = { setStatsScene: jest.fn((x) => { scene = x; }), getStatsScene: () => scene };
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

	it('scene: Post Game stays after a game; the first striking action shows Strike Phase; never during a game', () => {
		const { service, state, clientEmitter, scene, setScene } = setup();
		toGame1(service);
		service.reportWinner(1);
		setScene(LiveStatsScene.PostGame);
		expect(scene()).toBe(LiveStatsScene.PostGame);
		clientEmitter.emit('StrikeStage', 31, P1); // P1 (winner) bans
		expect(state().bans).toEqual([31]);
		expect(scene()).toBe(LiveStatsScene.StrikePhase);
		setScene(LiveStatsScene.InGame);
		clientEmitter.emit('PickStage', 8, P2);
		expect(scene()).toBe(LiveStatsScene.InGame);
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
