import 'reflect-metadata';
import { IronManService } from '../../electron/services/ironmanService';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import type {
	IronManSession,
	IronManSettings,
	IronManRoster,
	IronManCharSlot,
} from '../../frontend/src/lib/models/types/ironman';

const LOCAL_IDX = 0;
const OPP_IDX = 1;

// gameEndMethod numeric values (GameEndMethod enum)
const GM_GAME = 2;          // Normal stock-out end
const GM_NO_CONTEST = 7;    // LRAS / quit-out

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSlot(characterId: number, overrides: Partial<IronManCharSlot> = {}): IronManCharSlot {
	return { characterId, depleted: false, completed: false, stocksRemaining: 4, ...overrides };
}

function makeRoster(charIds: number[], overrides: Partial<IronManRoster> = {}): IronManRoster {
	return { slots: charIds.map(id => makeSlot(id)), currentIndex: 0, ...overrides };
}

function makeSettings(variant: IronManSettings['variant'] = 'standard', overrides: Partial<IronManSettings> = {}): IronManSettings {
	return { variant, rosterSize: 3, hideOpponent: false, stocksPerChar: 4, charOrder: 'fixed', charSelection: 'pick', randomSync: 'shared', ...overrides };
}

function makeSession(overrides: Partial<IronManSession> = {}): IronManSession {
	return {
		settings: makeSettings(),
		localRoster: makeRoster([1, 2, 3]),
		opponentRoster: makeRoster([4, 5, 6]),
		role: 'host',
		localName: 'Player',
		opponentName: null,
		localPlayerIndex: LOCAL_IDX,
		opponentConnected: false,
		startedAt: Date.now(),
		winner: null,
		pendingCarryStocks: null,
		...overrides,
	};
}

function makePostGame(localStocks: number, oppStocks: number, lrasInitiator = -1): any {
	return {
		gameEnd: {
			gameEndMethod: lrasInitiator >= 0 ? GM_NO_CONTEST : GM_GAME,
			lrasInitiatorIndex: lrasInitiator,
			placements: [],
		},
		lastFrame: {
			players: {
				[LOCAL_IDX]: { post: { stocksRemaining: localStocks } },
				[OPP_IDX]: { post: { stocksRemaining: oppStocks } },
			},
		},
		settings: {
			players: [
				{ playerIndex: LOCAL_IDX, characterId: 0 },
				{ playerIndex: OPP_IDX, characterId: 0 },
			],
			matchInfo: {},
		},
	} as any;
}

function makePostGameSolo(localStocks: number): any {
	return {
		gameEnd: { gameEndMethod: GM_GAME, lrasInitiatorIndex: -1, placements: [] },
		lastFrame: {
			players: {
				[LOCAL_IDX]: { post: { stocksRemaining: localStocks } },
			},
		},
		settings: { players: [{ playerIndex: LOCAL_IDX, characterId: 0 }], matchInfo: {} },
	} as any;
}

function makeGameSettings(localCharId: number, oppCharId?: number): any {
	const players: any[] = [{ playerIndex: LOCAL_IDX, characterId: localCharId }];
	if (oppCharId != null) players.push({ playerIndex: OPP_IDX, characterId: oppCharId });
	return { players };
}

// ── Test setup ────────────────────────────────────────────────────────────────

describe('IronManService', () => {
	let localEmitter: TypedEmitter;
	let clientEmitter: TypedEmitter;
	let sendMessage: jest.Mock;
	let saveLeaderboard: jest.Mock;

	beforeEach(() => {
		localEmitter = new TypedEmitter();
		clientEmitter = new TypedEmitter();
		sendMessage = jest.fn();
		saveLeaderboard = jest.fn();

		void new IronManService(
			{ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() } as any,
			{ getVersion: jest.fn().mockReturnValue('1.0.0') } as any,
			localEmitter,
			clientEmitter,
			{
				sendMessage,
				ironManPeerWss: { on: jest.fn() },
				lobbyGame: null,
			} as any,
			{
				getIronManLeaderboard: jest.fn().mockReturnValue([]),
				setIronManLeaderboard: saveLeaderboard,
				getIronManFullRosterLeaderboard: jest.fn().mockReturnValue([]),
				setIronManFullRosterLeaderboard: saveLeaderboard,
				getIronManStandardLeaderboard: jest.fn().mockReturnValue([]),
				setIronManStandardLeaderboard: saveLeaderboard,
			} as any,
		);
	});

	// ── Common helpers ────────────────────────────────────────────────────────

	function startSession(session: IronManSession) {
		clientEmitter.emit('StartIronMan', session);
	}

	/** Simulate a vs game (host/guest role). didWin = local player won. */
	function playVsGame(localCharId: number, oppCharId: number, localWins: boolean) {
		localEmitter.emit('GameSettings', makeGameSettings(localCharId, oppCharId));
		localEmitter.emit('PostGameStats', makePostGame(localWins ? 2 : 0, localWins ? 0 : 2));
	}

	/** Simulate a solo game. win = local player survived. */
	function playSoloGame(localCharId: number, win: boolean) {
		localEmitter.emit('GameSettings', makeGameSettings(localCharId));
		localEmitter.emit('PostGameStats', makePostGameSolo(win ? 2 : 0));
	}

	function lastState(): IronManSession | null {
		const calls = sendMessage.mock.calls.filter((c: any[]) => c[0] === 'IronManState');
		return calls[calls.length - 1]?.[1]?.session ?? null;
	}

	// ── Standard variant ──────────────────────────────────────────────────────

	describe('standard variant', () => {
		function session() {
			return makeSession({
				settings: makeSettings('standard', { stocksPerChar: 4 }),
				localRoster: makeRoster([1, 2, 3]),
				opponentRoster: makeRoster([4, 5, 6]),
				role: 'host',
				localPlayerIndex: LOCAL_IDX,
			});
		}

		it('loss depletes local char', () => {
			startSession(session());
			playVsGame(1, 4, false);

			const s = lastState()!;
			expect(s.localRoster.slots.find(sl => sl.characterId === 1)!.depleted).toBe(true);
			expect(s.winner).toBeNull();
		});

		it('win depletes opponent char', () => {
			startSession(session());
			playVsGame(1, 4, true);

			const s = lastState()!;
			expect(s.opponentRoster!.slots.find(sl => sl.characterId === 4)!.depleted).toBe(true);
			expect(s.localRoster.slots.find(sl => sl.characterId === 1)!.depleted).toBe(false);
		});

		it('win stores remaining stocks for carry-over', () => {
			startSession(session());
			localEmitter.emit('GameSettings', makeGameSettings(1, 4));
			localEmitter.emit('PostGameStats', makePostGame(2, 0)); // local keeps 2 of 4 stocks

			const s = lastState()!;
			// Lost 2 stocks → opponent must SD 2 times next game
			expect(s.pendingCarryStocks).toBe(2);
		});

		it('win with full stocks → no pendingCarryStocks', () => {
			startSession(session());
			localEmitter.emit('GameSettings', makeGameSettings(1, 4));
			localEmitter.emit('PostGameStats', makePostGame(4, 0)); // kept all 4 stocks

			const s = lastState()!;
			expect(s.pendingCarryStocks).toBe(0);
		});

		it('loss clears pendingCarryStocks', () => {
			startSession(session());
			// First win (sets pending)
			localEmitter.emit('GameSettings', makeGameSettings(1, 4));
			localEmitter.emit('PostGameStats', makePostGame(2, 0));
			// Then lose
			localEmitter.emit('GameSettings', makeGameSettings(2, 5));
			localEmitter.emit('PostGameStats', makePostGame(0, 2));

			const s = lastState()!;
			expect(s.pendingCarryStocks).toBeNull();
		});

		it('all opponent chars depleted → local wins', () => {
			startSession(session());
			playVsGame(1, 4, true);
			playVsGame(2, 5, true);
			playVsGame(3, 6, true);

			expect(lastState()!.winner).toBe('local');
		});

		it('all local chars depleted → opponent wins', () => {
			startSession(session());
			playVsGame(1, 4, false);
			playVsGame(2, 5, false);
			playVsGame(3, 6, false);

			expect(lastState()!.winner).toBe('opponent');
		});

		it('solo: all chars depleted → local wins', () => {
			startSession(makeSession({
				settings: makeSettings('standard'),
				localRoster: makeRoster([1, 2, 3]),
				opponentRoster: null,
				role: 'solo',
				localPlayerIndex: LOCAL_IDX,
			}));

			// Each solo loss depletes the char (stocks=0, no opponent)
			playSoloGame(1, false);
			playSoloGame(2, false);
			playSoloGame(3, false);

			expect(lastState()!.winner).toBe('local');
		});

		it('LRAS by local player → game discarded', () => {
			startSession(session());
			localEmitter.emit('GameSettings', makeGameSettings(1, 4));
			// Local quits (LRAS initiator = LOCAL_IDX, local stocks = 0)
			localEmitter.emit('PostGameStats', makePostGame(0, 2, LOCAL_IDX));

			const s = lastState()!;
			expect(s.localRoster.slots.find(sl => sl.characterId === 1)!.depleted).toBe(false);
		});

		it('LRAS by opponent → processed as local win', () => {
			startSession(session());
			localEmitter.emit('GameSettings', makeGameSettings(1, 4));
			// Opponent quits (LRAS initiator = OPP_IDX, opp stocks = 0, local has stocks)
			localEmitter.emit('PostGameStats', makePostGame(3, 0, OPP_IDX));

			const s = lastState()!;
			expect(s.opponentRoster!.slots.find(sl => sl.characterId === 4)!.depleted).toBe(true);
		});

		it('undepleted char used after depleting another', () => {
			startSession(session());
			playVsGame(1, 4, false); // char 1 depleted
			playVsGame(2, 5, false); // char 2 depleted

			const s = lastState()!;
			expect(s.localRoster.slots.find(sl => sl.characterId === 1)!.depleted).toBe(true);
			expect(s.localRoster.slots.find(sl => sl.characterId === 2)!.depleted).toBe(true);
			expect(s.localRoster.slots.find(sl => sl.characterId === 3)!.depleted).toBe(false);
			expect(s.winner).toBeNull();
		});
	});

	// ── Full Roster variant ───────────────────────────────────────────────────

	describe('full_roster variant', () => {
		function session() {
			return makeSession({
				settings: makeSettings('full_roster'),
				localRoster: makeRoster([1, 2, 3]),
				opponentRoster: null,
				role: 'solo',
				localPlayerIndex: LOCAL_IDX,
			});
		}

		it('win marks current char completed, advances index', () => {
			startSession(session());
			playSoloGame(1, true);

			const s = lastState()!;
			expect(s.localRoster.slots[0].completed).toBe(true);
			expect(s.localRoster.currentIndex).toBe(1);
			expect(s.winner).toBeNull();
		});

		it('loss keeps current char and index unchanged', () => {
			startSession(session());
			playSoloGame(1, false);

			const s = lastState()!;
			expect(s.localRoster.slots[0].completed).toBe(false);
			expect(s.localRoster.currentIndex).toBe(0);
		});

		it('complete all chars → local wins', () => {
			startSession(session());
			playSoloGame(1, true);
			playSoloGame(2, true);
			playSoloGame(3, true);

			expect(lastState()!.winner).toBe('local');
		});

		it('wrong char → game discarded, index unchanged', () => {
			startSession(session());
			// Expected char at index 0 is char 1; play char 2 instead
			playSoloGame(2, true);

			const s = lastState()!;
			expect(s.localRoster.currentIndex).toBe(0);
			expect(s.localRoster.slots[0].completed).toBe(false);
		});

		it('multiple losses then win advances', () => {
			startSession(session());
			playSoloGame(1, false);
			playSoloGame(1, false);
			playSoloGame(1, true);

			const s = lastState()!;
			expect(s.localRoster.slots[0].completed).toBe(true);
			expect(s.localRoster.currentIndex).toBe(1);
		});
	});

	// ── Challenge variant ─────────────────────────────────────────────────────

	describe('challenge variant', () => {
		function session() {
			return makeSession({
				settings: makeSettings('challenge'),
				localRoster: makeRoster([1, 2, 3]),
				opponentRoster: null,
				role: 'solo',
				localPlayerIndex: LOCAL_IDX,
			});
		}

		it('win advances to next char', () => {
			startSession(session());
			playSoloGame(1, true);

			const s = lastState()!;
			expect(s.localRoster.slots[0].completed).toBe(true);
			expect(s.localRoster.currentIndex).toBe(1);
		});

		it('loss resets ALL progress to zero', () => {
			startSession(session());
			// Win char 1, then lose char 2
			playSoloGame(1, true);
			playSoloGame(2, false);

			const s = lastState()!;
			expect(s.localRoster.slots[0].completed).toBe(false);
			expect(s.localRoster.slots[1].completed).toBe(false);
			expect(s.localRoster.currentIndex).toBe(0);
		});

		it('multiple losses keep resetting without triggering win', () => {
			startSession(session());
			for (let i = 0; i < 5; i++) playSoloGame(1, false);

			const s = lastState()!;
			expect(s.localRoster.currentIndex).toBe(0);
			expect(s.winner).toBeNull();
		});

		it('complete all chars → local wins', () => {
			startSession(session());
			playSoloGame(1, true);
			playSoloGame(2, true);
			playSoloGame(3, true);

			expect(lastState()!.winner).toBe('local');
		});

		it('loss mid-run then full completion → wins', () => {
			startSession(session());
			// Win 2, lose 1 (reset), then win all 3
			playSoloGame(1, true);
			playSoloGame(2, true);
			playSoloGame(3, false); // reset
			playSoloGame(1, true);
			playSoloGame(2, true);
			playSoloGame(3, true);

			expect(lastState()!.winner).toBe('local');
		});

		it('wrong char → discarded, index unchanged, no reset', () => {
			startSession(session());
			playSoloGame(2, false); // expected char 1 at index 0

			const s = lastState()!;
			expect(s.localRoster.currentIndex).toBe(0);
		});
	});

	// ── No active session ─────────────────────────────────────────────────────

	it('PostGameStats without active session does nothing', () => {
		const before = sendMessage.mock.calls.length;
		localEmitter.emit('PostGameStats', makePostGame(2, 0));
		expect(sendMessage.mock.calls.length).toBe(before);
	});
});
