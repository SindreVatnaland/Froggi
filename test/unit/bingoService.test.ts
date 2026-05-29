import "reflect-metadata";
import { BingoService } from '../../electron/services/bingoService';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { getMoveCategory } from '../../frontend/src/lib/models/constants/moveCategories';
import type { BingoTile, BingoChallengeId, BingoSession } from '../../frontend/src/lib/models/types/bingo';

const MY_IDX = 0;
const OPP_IDX = 1;

// ── Move ID mapping (authoritative IDs from Slippi attack ID reference sheet) ─
describe('getMoveCategory', () => {
	it.each([
		[2,  'jab'],          // Jab 1
		[3,  'jab'],          // Jab 2
		[4,  'jab'],          // Jab 3
		[5,  'jab'],          // Rapid Jabs
		[6,  'dash_attack'],  // Dash Attack
		[7,  'ftilt'],        // Side Tilt (all variants)
		[8,  'utilt'],        // Up Tilt
		[9,  'dtilt'],        // Down Tilt
		[10, 'fsmash'],       // Side Smash (all variants)
		[11, 'usmash'],       // Up Smash
		[12, 'dsmash'],       // Down Smash
		[13, 'nair'],         // Neutral Air
		[14, 'fair'],         // Forward Air
		[15, 'bair'],         // Back Air
		[16, 'uair'],         // Up Air
		[17, 'dair'],         // Down Air
		[18, 'neutral_b'],    // Neutral Special
		[19, 'side_b'],       // Side Special
		[20, 'up_b'],         // Up Special
		[21, 'down_b'],       // Down Special
		[53, 'throw'],        // Forward Throw
		[54, 'throw'],        // Back Throw
		[55, 'throw'],        // Up Throw
		[56, 'throw'],        // Down Throw
		[0,  'other'],        // None
		[1,  'other'],        // Non-Staling (not an attack)
		[52, 'other'],        // Pummel (not a kill move category)
		[99, 'other'],        // Unknown
	] as [number, string][])('ID %i → "%s"', (id, expected) => {
		expect(getMoveCategory(id)).toBe(expected);
	});

	// Regression guards for reported bugs
	it('nair (13) is nair, not fsmash', () => {
		expect(getMoveCategory(13)).toBe('nair');
	});
	it('ftilt (7) is ftilt, not fsmash', () => {
		expect(getMoveCategory(7)).toBe('ftilt');
	});
	it('fsmash is ID 10, not 11 (which is usmash)', () => {
		expect(getMoveCategory(10)).toBe('fsmash');
		expect(getMoveCategory(11)).toBe('usmash');
	});
});

// ── BingoService integration tests ───────────────────────────────────────────
describe('BingoService', () => {
	let localEmitter: TypedEmitter;
	let clientEmitter: TypedEmitter;
	let sendMessage: jest.Mock;

	beforeEach(() => {
		localEmitter = new TypedEmitter();
		clientEmitter = new TypedEmitter();
		sendMessage = jest.fn();

		void new BingoService(
			{ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() } as any,
			{ getVersion: jest.fn().mockReturnValue('1.0.0') } as any,
			localEmitter,
			clientEmitter,
			{ sendMessage, bingoPeerWss: { on: jest.fn() } } as any,
			{ getBingoLeaderboard: jest.fn().mockReturnValue({}), setBingoLeaderboard: jest.fn() } as any,
			{ connect: jest.fn(), disconnect: jest.fn() } as any,
		);
	});

	// ── Test helpers ─────────────────────────────────────────────────────────

	function makeTile(challengeId: BingoChallengeId, overrides: Partial<BingoTile> = {}): BingoTile {
		return {
			instanceId: 'tile-1',
			challengeId,
			label: 'test',
			description: 'test',
			params: { difficulty: 'medium', target: 1 },
			progress: 0,
			target: 1,
			completed: false,
			completedBy: null,
			hasProgress: false,
			...overrides,
		};
	}

	function startSession(tiles: BingoTile[]) {
		const session: BingoSession = {
			board: { id: 'board-1', size: 3, tiles, difficulty: 'medium', createdAt: Date.now() },
			settings: {
				mode: 'solo', boardSize: 3, difficulty: 'medium', winCondition: 1,
				lines: { rows: true, columns: true, diagonals: true },
				requireQueueAfterGame: false, timer: { enabled: false, durationMinutes: 60 },
				twitchEnabled: false, twitchChannel: '',
			},
			startedAt: Date.now(),
			localPlayerIndex: MY_IDX,
			role: 'solo',
			opponentConnected: false,
			localName: 'Player 1',
			opponentName: null,
		};
		clientEmitter.emit('StartBingo', session);
		sendMessage.mockClear();
	}

	function setupGame(charId = 20, stageId?: number) {
		localEmitter.emit('CurrentPlayer', { playerIndex: MY_IDX, displayName: 'Player 1' } as any);
		localEmitter.emit('GameSettings', {
			players: [
				{ playerIndex: MY_IDX, characterId: charId },
				{ playerIndex: OPP_IDX, characterId: 2 },
			],
			matchInfo: {},
			...(stageId !== undefined ? { stageId } : {}),
		} as any);
		sendMessage.mockClear();
	}

	function frame(num: number, myLastAttack: number, oppStocks: number, opts: {
		lastHitBy?: number;
		oppActionState?: number;
		myPercent?: number;
		oppPercent?: number;
		oppPositionX?: number;
	} = {}) {
		return {
			frame: num,
			players: {
				[MY_IDX]: {
					post: {
						stocksRemaining: 4,
						percent: opts.myPercent ?? 0,
						lastAttackLanded: myLastAttack,
						lastHitBy: -1,
					},
				},
				[OPP_IDX]: {
					post: {
						stocksRemaining: oppStocks,
						percent: opts.oppPercent ?? 80,
						lastAttackLanded: 0,
						lastHitBy: opts.lastHitBy ?? MY_IDX,
						actionStateId: opts.oppActionState ?? 2,
						positionX: opts.oppPositionX ?? 0,
					},
				},
			},
		} as any;
	}

	function emitKill(moveId: number, oppActionState = 2) {
		// First frame establishes the previous stock count
		localEmitter.emit('GameFrame', frame(1, moveId, 3));
		// Second frame: opponent loses a stock
		localEmitter.emit('GameFrame', frame(2, moveId, 2, { oppActionState }));
	}

	function emitGame(didWin: boolean, charId = 20) {
		localEmitter.emit('PostGameStats', {
			postGameStats: {
				overall: [{ playerIndex: MY_IDX, totalDamage: 200 }],
				stocks: [],
				actionCounts: [],
			},
			lastFrame: {
				players: {
					[MY_IDX]: { post: { stocksRemaining: didWin ? 3 : 0 } },
					[OPP_IDX]: { post: { stocksRemaining: didWin ? 0 : 2 } },
				},
			},
			settings: {
				players: [
					{ playerIndex: MY_IDX, characterId: charId },
					{ playerIndex: OPP_IDX, characterId: 2 },
				],
				matchInfo: {},
			},
		} as any);
	}

	// Matches the offline game-end structure from logs:
	//   gameEndMethod: 2 (GAME), lrasInitiatorIndex: -1, matchId: ''
	// This is NOT detected as LRAS — processed as a normal win or loss.
	function emitOfflineGame(didWin: boolean, myCharId = 2, oppCharId = 6) {
		localEmitter.emit('PostGameStats', {
			gameEnd: {
				gameEndMethod: 2, // GameEndMethod.GAME (not NO_CONTEST/7)
				lrasInitiatorIndex: -1,
				placements: [
					{ playerIndex: MY_IDX, position: didWin ? 0 : 1 },
					{ playerIndex: OPP_IDX, position: didWin ? 1 : 0 },
				],
			},
			postGameStats: {
				overall: [{ playerIndex: MY_IDX, totalDamage: 200 }],
				stocks: [],
				actionCounts: [],
			},
			lastFrame: {
				players: {
					[MY_IDX]: { post: { stocksRemaining: didWin ? 3 : 0 } },
					[OPP_IDX]: { post: { stocksRemaining: didWin ? 0 : 2 } },
				},
			},
			settings: {
				players: [
					{ playerIndex: MY_IDX, characterId: myCharId },
					{ playerIndex: OPP_IDX, characterId: oppCharId },
				],
				matchInfo: { matchId: '', gameNumber: 0, tiebreakerNumber: 0 },
			},
		} as any);
	}

	function lastChallengeUpdate() {
		const calls = sendMessage.mock.calls.filter(([topic]) => topic === 'BingoChallengeUpdates');
		if (!calls.length) return null;
		return (calls[calls.length - 1][1] as any).updates[0];
	}

	// ── Kill by move ──────────────────────────────────────────────────────────
	describe('kill by move', () => {
		it.each([
			['kill_fsmash',    10] as [BingoChallengeId, number],
			['kill_usmash',    11] as [BingoChallengeId, number],
			['kill_nair',      13] as [BingoChallengeId, number],
			['kill_fair',      14] as [BingoChallengeId, number],
			['kill_bair',      15] as [BingoChallengeId, number],
			['kill_uair',      16] as [BingoChallengeId, number],
			['kill_dair',      17] as [BingoChallengeId, number],
			['kill_neutral_b', 18] as [BingoChallengeId, number],
			['kill_side_b',    19] as [BingoChallengeId, number],
			['kill_up_b',      20] as [BingoChallengeId, number],
		])('%s: kill with move ID %i completes the challenge', (challengeId, moveId) => {
			startSession([makeTile(challengeId)]);
			setupGame();
			emitKill(moveId);
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it.each([
			[53, 'Forward Throw'],
			[54, 'Back Throw'],
			[55, 'Up Throw'],
			[56, 'Down Throw'],
		] as [number, string][])('kill_throw: %s (ID %i) completes the challenge', (moveId) => {
			startSession([makeTile('kill_throw')]);
			setupGame();
			emitKill(moveId);
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		// Regression tests: wrong move should NOT trigger the challenge
		it('nair (13) does NOT complete kill_fsmash', () => {
			startSession([makeTile('kill_fsmash')]);
			setupGame();
			emitKill(13);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('ftilt (7) does NOT complete kill_fsmash', () => {
			startSession([makeTile('kill_fsmash')]);
			setupGame();
			emitKill(7);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('fsmash (10) does NOT complete kill_nair', () => {
			startSession([makeTile('kill_nair')]);
			setupGame();
			emitKill(10);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('opponent SD (lastHitBy != me) does NOT count as my kill', () => {
			startSession([makeTile('kill_nair')]);
			setupGame();
			// Opponent self-destructs: lastHitBy is their own index
			localEmitter.emit('GameFrame', frame(1, 13, 3));
			localEmitter.emit('GameFrame', frame(2, 13, 2, { lastHitBy: OPP_IDX }));
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});
	});

	// ── Death directions ──────────────────────────────────────────────────────
	describe('death directions', () => {
		it('star_ko: action state 4 (DEAD_UP_STAR) completes star_ko', () => {
			startSession([makeTile('star_ko')]);
			setupGame();
			emitKill(0, 4);
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('star_ko: action state 5 (DEAD_UP_STAR_ICE) also completes star_ko', () => {
			startSession([makeTile('star_ko')]);
			setupGame();
			emitKill(0, 5);
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('screen_ko: action state 6 (DEAD_UP_FALL) completes screen_ko', () => {
			startSession([makeTile('screen_ko')]);
			setupGame();
			emitKill(0, 6);
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('screen_ko: action state 7 also completes screen_ko', () => {
			startSession([makeTile('screen_ko')]);
			setupGame();
			emitKill(0, 7);
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('star_ko state (4) does NOT complete screen_ko', () => {
			startSession([makeTile('screen_ko')]);
			setupGame();
			emitKill(0, 4);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('screen_ko state (6) does NOT complete star_ko', () => {
			startSession([makeTile('star_ko')]);
			setupGame();
			emitKill(0, 6);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('spike: action state 0 (DEAD_DOWN) completes spike_meteor_total', () => {
			startSession([makeTile('spike_meteor_total')]);
			setupGame();
			emitKill(0, 0);
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('blast_zone_direction left: state 1 completes left challenge', () => {
			startSession([makeTile('blast_zone_direction', {
				params: { difficulty: 'medium', target: 1, direction: 'left' },
			})]);
			setupGame();
			emitKill(0, 1); // state 1 = left blast zone
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('blast_zone_direction right: state 2 completes right challenge', () => {
			startSession([makeTile('blast_zone_direction', {
				params: { difficulty: 'medium', target: 1, direction: 'right' },
			})]);
			setupGame();
			emitKill(0, 2); // state 2 = right blast zone
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('blast_zone_direction right (state 2) does NOT complete left challenge', () => {
			startSession([makeTile('blast_zone_direction', {
				params: { difficulty: 'medium', target: 1, direction: 'left' },
			})]);
			setupGame();
			emitKill(0, 2);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});
	});

	function emitLras(localQuit: boolean) {
		localEmitter.emit('PostGameStats', {
			gameEnd: {
				gameEndMethod: 7, // GameEndMethod.NO_CONTEST
				lrasInitiatorIndex: localQuit ? MY_IDX : OPP_IDX,
			},
			postGameStats: {
				overall: [{ playerIndex: MY_IDX, totalDamage: 0 }],
				stocks: [],
				actionCounts: [],
			},
			lastFrame: {
				players: {
					[MY_IDX]: { post: { stocksRemaining: 3 } },
					[OPP_IDX]: { post: { stocksRemaining: 2 } },
				},
			},
			settings: {
				players: [
					{ playerIndex: MY_IDX, characterId: 20 },
					{ playerIndex: OPP_IDX, characterId: 2 },
				],
				matchInfo: {},
			},
		} as any);
	}

	function allUpdates() {
		return sendMessage.mock.calls
			.filter(([topic]) => topic === 'BingoChallengeUpdates')
			.map(([, payload]) => (payload as any).updates[0]);
	}

	// ── Tile ownership ────────────────────────────────────────────────────────
	describe('tile ownership', () => {
		it('dev local→opponent→local: stays both, not stolen back', () => {
			const tile = makeTile('win_games_total', { instanceId: 'b1', target: 1, hasProgress: true });
			startSession([tile]);

			// P1 completes via dev
			clientEmitter.emit('BingoDevSimulate', 'b1', 'local');
			const afterP1 = sendMessage.mock.calls
				.filter(([t]) => t === 'BingoChallengeUpdates')
				.map(([, p]) => (p as any).updates[0]);
			expect(afterP1.at(-1)?.completedBy).toBe('local');
			sendMessage.mockClear();

			// P2 completes via dev
			clientEmitter.emit('BingoDevSimulate', 'b1', 'opponent');
			const afterP2 = sendMessage.mock.calls
				.filter(([t]) => t === 'BingoChallengeUpdates')
				.map(([, p]) => (p as any).updates[0]);
			expect(afterP2.at(-1)?.completedBy).toBe('both');
			sendMessage.mockClear();

			// P1 tries to complete again — should be rejected (no sendMessage)
			clientEmitter.emit('BingoDevSimulate', 'b1', 'local');
			const afterSteal = sendMessage.mock.calls.filter(([t]) => t === 'BingoChallengeUpdates');
			expect(afterSteal).toHaveLength(0);
		});

		it('dev simulate cannot complete a frozen tile', () => {
			const tile = makeTile('win_games_total', { instanceId: 'b2', target: 1, frozen: true });
			startSession([tile]);

			clientEmitter.emit('BingoDevSimulate', 'b2', 'local');

			const updates = sendMessage.mock.calls.filter(([t]) => t === 'BingoChallengeUpdates');
			expect(updates).toHaveLength(0);
		});

		it('real game: progress skipped on frozen tile', () => {
			const tile = makeTile('win_games_total', {
				target: 2, params: { difficulty: 'medium', target: 2 }, hasProgress: true, frozen: true,
			});
			startSession([tile]);
			setupGame();
			emitGame(true);
			// frozen → skipped
			const updates = sendMessage.mock.calls.filter(([t]) => t === 'BingoChallengeUpdates');
			expect(updates).toHaveLength(0);
		});
	});

	// ── Win-based challenges ──────────────────────────────────────────────────
	describe('win-based challenges', () => {
		it('win_in_a_row: progress increments to 1 after first win', () => {
			startSession([makeTile('win_in_a_row', {
				target: 3, params: { difficulty: 'medium', target: 3 }, hasProgress: true,
			})]);
			setupGame(); emitGame(true);
			expect(lastChallengeUpdate()?.progress).toBe(1);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('win_in_a_row: progress increments to 2 after second consecutive win', () => {
			startSession([makeTile('win_in_a_row', {
				target: 3, params: { difficulty: 'medium', target: 3 }, hasProgress: true,
			})]);
			setupGame(); emitGame(true);
			setupGame(); emitGame(true);
			expect(lastChallengeUpdate()?.progress).toBe(2);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('win_in_a_row: two consecutive wins completes target=2', () => {
			startSession([makeTile('win_in_a_row', {
				target: 2, params: { difficulty: 'medium', target: 2 }, hasProgress: true,
			})]);
			setupGame(); emitGame(true);
			setupGame(); emitGame(true);
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('win_in_a_row: quitting (LRAS) resets streak even if player was ahead', () => {
			startSession([makeTile('win_in_a_row', {
				target: 2, params: { difficulty: 'medium', target: 2 }, hasProgress: true,
			})]);
			setupGame(); emitGame(true);   // streak = 1
			setupGame(); emitLras(true);   // quit — must reset streak to 0
			setupGame(); emitGame(true);   // streak = 1 (not 2)
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('win_in_a_row: streak resets on loss', () => {
			startSession([makeTile('win_in_a_row', {
				target: 2, params: { difficulty: 'medium', target: 2 }, hasProgress: true,
			})]);
			setupGame(); emitGame(true);
			setupGame(); emitGame(false); // loss breaks streak
			setupGame(); emitGame(true);  // only 1 win now
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('four_stock_opponent: winning with 4 stocks remaining completes challenge', () => {
			startSession([makeTile('four_stock_opponent')]);
			setupGame();
			localEmitter.emit('PostGameStats', {
				postGameStats: { overall: [{ playerIndex: MY_IDX, totalDamage: 0 }], stocks: [], actionCounts: [] },
				lastFrame: {
					players: {
						[MY_IDX]: { post: { stocksRemaining: 4 } },
						[OPP_IDX]: { post: { stocksRemaining: 0 } },
					},
				},
				settings: {
					players: [{ playerIndex: MY_IDX, characterId: 20 }, { playerIndex: OPP_IDX, characterId: 2 }],
					matchInfo: {},
				},
			} as any);
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('four_stock_opponent: winning with 3 stocks does NOT complete challenge', () => {
			startSession([makeTile('four_stock_opponent')]);
			setupGame();
			emitGame(true); // 3 stocks remaining (default in emitGame)
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});
	});

	// ── win_under_90s ─────────────────────────────────────────────────────────
	describe('win_under_90s', () => {
		// 90 seconds = 5400 frames (frame 0 = game start)

		it('winning with last frame 5000 (~83s) completes challenge', () => {
			startSession([makeTile('win_under_90s')]);
			setupGame();
			localEmitter.emit('GameFrame', frame(5000, 0, 2));
			emitGame(true);
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('winning with last frame 5399 (just under 90s) completes challenge', () => {
			startSession([makeTile('win_under_90s')]);
			setupGame();
			localEmitter.emit('GameFrame', frame(5399, 0, 2));
			emitGame(true);
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('winning with last frame 5400 (exactly 90s) does NOT complete challenge', () => {
			startSession([makeTile('win_under_90s')]);
			setupGame();
			localEmitter.emit('GameFrame', frame(5400, 0, 2));
			emitGame(true);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('winning with last frame 6000 (~100s) does NOT complete challenge', () => {
			startSession([makeTile('win_under_90s')]);
			setupGame();
			localEmitter.emit('GameFrame', frame(6000, 0, 2));
			emitGame(true);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('losing a fast game does NOT complete challenge', () => {
			startSession([makeTile('win_under_90s')]);
			setupGame();
			localEmitter.emit('GameFrame', frame(3000, 0, 2));
			emitGame(false);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('pre-game frames (negative frame numbers) are not counted as duration', () => {
			startSession([makeTile('win_under_90s')]);
			setupGame();
			// Only pre-game frames emitted — duration stays 0
			localEmitter.emit('GameFrame', frame(-100, 0, 4));
			localEmitter.emit('GameFrame', frame(-50, 0, 4));
			localEmitter.emit('GameFrame', frame(1, 0, 2)); // 1 frame of real game
			emitGame(true);
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});
	});

	// ── spike_diverse_moves ───────────────────────────────────────────────────
	describe('spike_diverse_moves', () => {
		const tile3 = () => makeTile('spike_diverse_moves', {
			target: 3, params: { difficulty: 'easy', target: 3 }, hasProgress: true,
		});

		function emitSpikeKill(moveId: number) {
			// action state 0 = DEAD_DOWN (spike direction)
			localEmitter.emit('GameFrame', frame(1, moveId, 3));
			localEmitter.emit('GameFrame', frame(2, moveId, 2, { oppActionState: 0 }));
		}

		it('3 spike kills with 3 different moves completes target=3', () => {
			startSession([tile3()]);
			setupGame(); emitSpikeKill(17); // dair
			setupGame(); emitSpikeKill(21); // down_b
			setupGame(); emitSpikeKill(20); // up_b
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('3 spike kills with the SAME move does NOT complete target=3', () => {
			startSession([tile3()]);
			setupGame(); emitSpikeKill(17);
			setupGame(); emitSpikeKill(17);
			setupGame(); emitSpikeKill(17);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('2 different spike moves does NOT complete target=3', () => {
			startSession([tile3()]);
			setupGame(); emitSpikeKill(17); // dair
			setupGame(); emitSpikeKill(21); // down_b
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('spike kill where opponent self-destructs (lastHitBy != me) does NOT count', () => {
			startSession([tile3()]);
			setupGame();
			localEmitter.emit('GameFrame', frame(1, 17, 3));
			localEmitter.emit('GameFrame', frame(2, 17, 2, { oppActionState: 0, lastHitBy: OPP_IDX }));
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('non-spike kill (blast zone) with dair does NOT count toward diverse spike moves', () => {
			startSession([tile3()]);
			setupGame();
			// dair kill but sent left (blast zone), not down
			localEmitter.emit('GameFrame', frame(1, 17, 3));
			localEmitter.emit('GameFrame', frame(2, 17, 2, { oppActionState: 1 })); // state 1 = left blast zone
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});
	});

	// ── kill_per_stock_diverse ────────────────────────────────────────────────
	describe('kill_per_stock_diverse', () => {
		const tile4 = () => makeTile('kill_per_stock_diverse', {
			target: 4, params: { difficulty: 'hard', target: 4 }, hasProgress: true,
		});

		function emitKillWith(moveId: number, remainingAfter: number) {
			// kills within a single game — frame numbers must be >0 for stock tracking
			localEmitter.emit('GameFrame', frame(100, moveId, remainingAfter + 1));
			localEmitter.emit('GameFrame', frame(101, moveId, remainingAfter));
		}

		it('winning with 4 kills using 4 different moves completes target=4', () => {
			startSession([tile4()]);
			setupGame();
			emitKillWith(10, 3); // fsmash
			emitKillWith(14, 2); // fair
			emitKillWith(17, 1); // dair
			emitKillWith(16, 0); // uair
			emitGame(true);
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('winning with 4 kills but only 3 different moves does NOT complete target=4', () => {
			startSession([tile4()]);
			setupGame();
			emitKillWith(10, 3); // fsmash
			emitKillWith(14, 2); // fair
			emitKillWith(17, 1); // dair
			emitKillWith(17, 0); // dair again
			emitGame(true);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('losing a game with all different kills does NOT complete challenge', () => {
			startSession([tile4()]);
			setupGame();
			emitKillWith(10, 3);
			emitKillWith(14, 2);
			emitKillWith(17, 1);
			emitKillWith(16, 0);
			emitGame(false);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('diverse kills reset between games — second game can still complete', () => {
			startSession([tile4()]);
			setupGame();
			// First game: only 2 different moves → not complete
			emitKillWith(10, 3);
			emitKillWith(10, 2);
			emitKillWith(10, 1);
			emitKillWith(10, 0);
			emitGame(true);
			// Second game: 4 different moves → complete
			setupGame();
			emitKillWith(10, 3);
			emitKillWith(14, 2);
			emitKillWith(17, 1);
			emitKillWith(16, 0);
			emitGame(true);
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});
	});

	// ── win_games_total ───────────────────────────────────────────────────────
	describe('win_games_total', () => {
		const tile5 = () => makeTile('win_games_total', {
			target: 3, params: { difficulty: 'easy', target: 3 }, hasProgress: true,
		});

		it('progress increments to 1 after first win', () => {
			startSession([tile5()]);
			setupGame(); emitGame(true);
			expect(lastChallengeUpdate()?.progress).toBe(1);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('3 wins completes target=3', () => {
			startSession([tile5()]);
			setupGame(); emitGame(true);
			setupGame(); emitGame(true);
			setupGame(); emitGame(true);
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('losses do NOT count toward total', () => {
			startSession([tile5()]);
			setupGame(); emitGame(true);
			setupGame(); emitGame(false);
			setupGame(); emitGame(false);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('quitting a game (local LRAS) does NOT count as a win', () => {
			startSession([tile5()]);
			setupGame(); emitGame(true);
			setupGame(); emitLras(true); // local quit — reverts progress
			setupGame(); emitGame(true);
			// Should still be at 2 wins, not 3
			expect(lastChallengeUpdate()?.progress).toBe(2);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('opponent quitting (opponent LRAS) does NOT revert local progress', () => {
			startSession([tile5()]);
			setupGame(); emitGame(true);
			setupGame(); emitGame(true);
			setupGame(); emitLras(false); // opponent quit
			// Opponent LRAS: no win counted, but progress stays at 2
			const updates = allUpdates();
			const progresses = updates.map((u: any) => u?.progress).filter(Boolean);
			expect(progresses.at(-1) ?? 2).toBe(2);
		});
	});

	// ── all_blast_zones_game ─────────────────────────────────────────────────
	describe('all_blast_zones_game', () => {
		const tile = () => makeTile('all_blast_zones_game', { target: 4, hasProgress: true });

		it('left + right + spike(down) + star(up) in one game completes', () => {
			startSession([tile()]);
			setupGame();
			emitKill(0, 1); // left
			emitKill(0, 2); // right
			emitKill(0, 0); // spike/down
			emitKill(0, 4); // star KO (up)
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('left + right + spike + screen_ko(up) in one game completes', () => {
			startSession([tile()]);
			setupGame();
			emitKill(0, 1); // left
			emitKill(0, 2); // right
			emitKill(0, 0); // spike/down
			emitKill(0, 6); // screen KO (up)
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('missing top blast zone (no star/screen_ko) does NOT complete', () => {
			startSession([tile()]);
			setupGame();
			emitKill(0, 1); // left
			emitKill(0, 2); // right
			emitKill(0, 0); // spike/down
			// no up kill
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('missing spike (down) does NOT complete', () => {
			startSession([tile()]);
			setupGame();
			emitKill(0, 1); // left
			emitKill(0, 2); // right
			emitKill(0, 4); // star (up)
			// no spike
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('all 4 directions split across games does NOT complete', () => {
			startSession([tile()]);
			setupGame(); emitKill(0, 1); emitKill(0, 2); // left + right game 1
			setupGame(); emitKill(0, 0); emitKill(0, 4); // spike + star game 2
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});
	});

	// ── LRAS revert ───────────────────────────────────────────────────────────
	describe('LRAS revert', () => {
		it('local quit reverts spike kills accumulated during that game', () => {
			startSession([makeTile('spike_meteor_total', {
				target: 3, params: { difficulty: 'medium', target: 3 }, hasProgress: true,
			})]);
			setupGame();
			// Spike kill during game
			localEmitter.emit('GameFrame', frame(1, 17, 3));
			localEmitter.emit('GameFrame', frame(2, 17, 2, { oppActionState: 0 }));
			sendMessage.mockClear();
			// Local player quits — spike kill should be reverted
			emitLras(true);
			// Progress should be back to 0
			const upd = lastChallengeUpdate();
			expect(upd?.progress ?? 0).toBe(0);
		});

		it('opponent quit does NOT revert local kills', () => {
			startSession([makeTile('spike_meteor_total', {
				target: 3, params: { difficulty: 'medium', target: 3 }, hasProgress: true,
			})]);
			setupGame();
			localEmitter.emit('GameFrame', frame(1, 17, 3));
			localEmitter.emit('GameFrame', frame(2, 17, 2, { oppActionState: 0 }));
			sendMessage.mockClear();
			emitLras(false); // opponent quit
			// No update should undo the spike kill progress
			const upd = lastChallengeUpdate();
			// Either no update, or progress >= 1
			if (upd) {
				expect(upd.progress).toBeGreaterThanOrEqual(1);
			}
		});

		it('spike_meteor_single_game progress reverts when local player quits', () => {
			startSession([makeTile('spike_meteor_single_game', {
				target: 4, params: { difficulty: 'hard', target: 4 }, hasProgress: true,
			})]);
			setupGame();
			// 3 spikes in this game (action state 0 = down = spike)
			emitKill(0, 0); emitKill(0, 0); emitKill(0, 0);
			expect(lastChallengeUpdate()?.progress).toBe(3);
			// Quit the game — progress should revert to 0
			emitLras(true);
			expect(lastChallengeUpdate()?.progress).toBe(0);
		});

		it('spike_meteor_single_game: after LRAS-reverted game, next game shows fresh count not old stuck value', () => {
			// Regression: old Math.max(prev, gameSpikes) would keep prev=3 after LRAS
			// so a new game with 1 spike would still show 3 instead of 1
			startSession([makeTile('spike_meteor_single_game', {
				target: 5, params: { difficulty: 'hard', target: 5 }, hasProgress: true,
			})]);
			// First game: 3 spikes then quit
			setupGame();
			emitKill(0, 0); emitKill(0, 0); emitKill(0, 0);
			emitLras(true); // reverts to 0
			expect(lastChallengeUpdate()?.progress).toBe(0);
			// Second game: 1 spike, complete
			setupGame();
			emitKill(0, 0);
			emitGame(true);
			// With old bug: Math.max(prev=3, 1) = 3  ← stale
			// With fix:     Math.max(sessionBestSpikeGame=0, 1) = 1
			expect(lastChallengeUpdate()?.progress).toBe(1);
		});

		it('LRAS reverts kill_neutral_b even when it was completed during the game', () => {
			// Bug: checkChallenges() skips completed tiles, so completing a tile during an
			// aborted game would leave it permanently completed.
			startSession([makeTile('kill_neutral_b', {
				target: 2, params: { difficulty: 'medium', target: 2 }, hasProgress: true,
			})]);
			setupGame();
			// 2 neutral-b kills — completes the tile
			emitKill(18, 2); emitKill(18, 2);
			expect(lastChallengeUpdate()?.completed).toBe(true);
			// Quit — must un-complete
			emitLras(true);
			const upd = lastChallengeUpdate();
			expect(upd?.progress).toBe(0);
			expect(upd?.completed).toBe(false);
		});

		it('LRAS does not count as a win for win_games_total', () => {
			startSession([makeTile('win_games_total', {
				target: 5, params: { difficulty: 'easy', target: 5 }, hasProgress: true,
			})]);
			setupGame(); emitLras(true); // quit first game
			setupGame(); emitGame(true); // win second game
			expect(lastChallengeUpdate()?.progress).toBe(1); // only 1 win, not 2
		});

		it('LRAS reverts star_ko progress', () => {
			startSession([makeTile('star_ko', {
				target: 2, params: { difficulty: 'medium', target: 2 }, hasProgress: true,
			})]);
			setupGame();
			// Star KO = action state 4 or 5
			emitKill(0, 4);
			expect(lastChallengeUpdate()?.progress).toBe(1);
			emitLras(true);
			expect(lastChallengeUpdate()?.progress).toBe(0);
		});

		it('LRAS reverts zero_death progress', () => {
			startSession([makeTile('zero_death', {
				target: 2, params: { difficulty: 'medium', target: 2 }, hasProgress: true,
			})]);
			setupGame();
			// Trigger a zero-death: opponent spawns (prevPercent=0→current>0), no damage taken, stock lost
			localEmitter.emit('GameFrame', frame(1, 0, 3, { oppPercent: 0 }));
			// Opponent gets first hit (zerodeathAttempt starts)
			localEmitter.emit('GameFrame', frame(2, 0, 3, { oppPercent: 1 }));
			// Opponent loses stock without us taking damage — zero death
			localEmitter.emit('GameFrame', frame(3, 0, 2, { oppPercent: 1 }));
			// Whether zero death registered or not, quit should revert to 0
			emitLras(true);
			expect(lastChallengeUpdate()?.progress ?? 0).toBe(0);
		});

		it('LRAS after taking last stock (win + LRAS) does NOT revert progress', () => {
			// Player takes last stock then immediately presses L+R+A+Start — Slippi records
			// it as NO_CONTEST but opponent has 0 stocks, so it counts as a win.
			startSession([makeTile('win_in_a_row', {
				target: 2, params: { difficulty: 'medium', target: 2 }, hasProgress: true,
			})]);
			setupGame();
			// Emit LRAS where local player is initiator but opponent has 0 stocks remaining
			localEmitter.emit('PostGameStats', {
				gameEnd: { gameEndMethod: 7, lrasInitiatorIndex: MY_IDX },
				postGameStats: { overall: [{ playerIndex: MY_IDX, totalDamage: 0 }], stocks: [], actionCounts: [] },
				lastFrame: {
					players: {
						[MY_IDX]: { post: { stocksRemaining: 2 } },
						[OPP_IDX]: { post: { stocksRemaining: 0 } }, // opponent already out
					},
				},
				settings: {
					players: [{ playerIndex: MY_IDX, characterId: 20 }, { playerIndex: OPP_IDX, characterId: 2 }],
					matchInfo: {},
				},
			} as any);
			// Should count as a win, not a quit
			expect(lastChallengeUpdate()?.progress).toBe(1);
		});
	});

	// ── SD revert ─────────────────────────────────────────────────────────────
	describe('aggressive SD detection', () => {
		function emitGameWithSDs(stocks: { endPercent: number; endFrame: number }[], didWin = false) {
			localEmitter.emit('PostGameStats', {
				postGameStats: {
					overall: [{ playerIndex: MY_IDX, totalDamage: 50 }],
					stocks: stocks.map(s => ({ playerIndex: MY_IDX, endPercent: s.endPercent, endFrame: s.endFrame })),
					actionCounts: [],
				},
				lastFrame: {
					players: {
						[MY_IDX]: { post: { stocksRemaining: didWin ? 2 : 0 } },
						[OPP_IDX]: { post: { stocksRemaining: didWin ? 0 : 1 } },
					},
				},
				settings: {
					players: [
						{ playerIndex: MY_IDX, characterId: 2 },
						{ playerIndex: OPP_IDX, characterId: 6 },
					],
					matchInfo: {},
				},
			} as any);
		}

		it('2 SDs at 0% within 900 frames reverts progress', () => {
			startSession([makeTile('win_games_total', {
				target: 3, params: { difficulty: 'easy', target: 3 }, hasProgress: true,
			})]);
			setupGame(); emitGame(true); // win #1 → progress 1
			setupGame();
			emitGameWithSDs([
				{ endPercent: 0, endFrame: 1000 },
				{ endPercent: 0, endFrame: 1600 }, // 600 frames apart → aggressive
			]);
			// Progress should be reverted (back to 0, not 1)
			expect(lastChallengeUpdate()?.progress ?? 0).toBe(0);
		});

		it('2 SDs more than 900 frames apart does NOT revert', () => {
			startSession([makeTile('win_games_total', {
				target: 3, params: { difficulty: 'easy', target: 3 }, hasProgress: true,
			})]);
			setupGame(); emitGame(true); // win #1 → progress 1
			setupGame();
			emitGameWithSDs([
				{ endPercent: 0, endFrame: 1000 },
				{ endPercent: 0, endFrame: 2000 }, // 1000 frames apart → not aggressive
			]);
			// Loss (not win) + SDs spaced out → no revert, just a loss
			expect(lastChallengeUpdate()?.progress ?? 1).toBe(1);
		});

		it('SD at >5% is not counted (soft threshold)', () => {
			startSession([makeTile('win_games_total', {
				target: 3, params: { difficulty: 'easy', target: 3 }, hasProgress: true,
			})]);
			setupGame(); emitGame(true); // win #1
			setupGame();
			emitGameWithSDs([
				{ endPercent: 10, endFrame: 1000 }, // above threshold
				{ endPercent: 10, endFrame: 1200 },
			]);
			expect(lastChallengeUpdate()?.progress ?? 1).toBe(1);
		});

		it('aggressive SD does NOT revert when player wins', () => {
			startSession([makeTile('win_games_total', {
				target: 3, params: { difficulty: 'easy', target: 3 }, hasProgress: true,
			})]);
			setupGame();
			emitGameWithSDs([
				{ endPercent: 0, endFrame: 1000 },
				{ endPercent: 0, endFrame: 1400 },
			], true /* didWin */);
			// Won despite SDs — should count
			expect(lastChallengeUpdate()?.progress ?? 0).toBe(1);
		});
	});

	// ── win_low_damage ────────────────────────────────────────────────────────
	describe('win_low_damage', () => {
		it('completes when winning with damage taken below threshold', () => {
			startSession([makeTile('win_low_damage', {
				params: { difficulty: 'medium', target: 1, percent: 100 },
			})]);
			setupGame();
			localEmitter.emit('GameFrame', frame(1, 0, 3, { myPercent: 0 }));
			localEmitter.emit('GameFrame', frame(2, 0, 3, { myPercent: 50 }));
			emitGame(true);
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('does NOT complete when damage equals threshold', () => {
			startSession([makeTile('win_low_damage', {
				params: { difficulty: 'hard', target: 1, percent: 50 },
			})]);
			setupGame();
			localEmitter.emit('GameFrame', frame(1, 0, 3, { myPercent: 0 }));
			localEmitter.emit('GameFrame', frame(2, 0, 3, { myPercent: 50 }));
			emitGame(true);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('accumulates damage across stock resets (negative diffs ignored)', () => {
			startSession([makeTile('win_low_damage', {
				params: { difficulty: 'medium', target: 1, percent: 100 },
			})]);
			setupGame();
			// Stock 1: take 80%
			localEmitter.emit('GameFrame', frame(1, 0, 3, { myPercent: 0 }));
			localEmitter.emit('GameFrame', frame(2, 0, 3, { myPercent: 80 }));
			localEmitter.emit('GameFrame', frame(3, 0, 3, { myPercent: 0 })); // stock reset — negative diff ignored
			// Stock 2: take 25% more → total 105%
			localEmitter.emit('GameFrame', frame(4, 0, 3, { myPercent: 25 }));
			emitGame(true);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('does NOT complete on a loss', () => {
			startSession([makeTile('win_low_damage', {
				params: { difficulty: 'easy', target: 1, percent: 150 },
			})]);
			setupGame();
			localEmitter.emit('GameFrame', frame(1, 0, 3, { myPercent: 10 }));
			emitGame(false);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});
	});

	// ── combo_damage ──────────────────────────────────────────────────────────
	describe('combo_damage', () => {
		function emitGameWithCombos(didWin: boolean, combos: Array<{ playerIndex: number; startPercent: number; currentPercent: number }>) {
			localEmitter.emit('PostGameStats', {
				postGameStats: {
					overall: [{ playerIndex: MY_IDX, totalDamage: 200 }],
					stocks: [],
					actionCounts: [],
					conversions: combos,
				},
				lastFrame: {
					players: {
						[MY_IDX]: { post: { stocksRemaining: didWin ? 3 : 0 } },
						[OPP_IDX]: { post: { stocksRemaining: didWin ? 0 : 2 } },
					},
				},
				settings: {
					players: [{ playerIndex: MY_IDX, characterId: 20 }, { playerIndex: OPP_IDX, characterId: 2 }],
					matchInfo: {},
				},
			} as any);
		}

		it('completes when best combo meets threshold', () => {
			startSession([makeTile('combo_damage', { params: { difficulty: 'medium', target: 1, percent: 50 } })]);
			setupGame();
			emitGameWithCombos(true, [
				{ playerIndex: OPP_IDX, startPercent: 0, currentPercent: 60 }, // 60% combo
				{ playerIndex: OPP_IDX, startPercent: 60, currentPercent: 80 }, // 20% combo
			]);
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('does NOT complete when best combo is below threshold', () => {
			startSession([makeTile('combo_damage', { params: { difficulty: 'hard', target: 1, percent: 80 } })]);
			setupGame();
			emitGameWithCombos(true, [
				{ playerIndex: OPP_IDX, startPercent: 0, currentPercent: 50 }, // 50% best
			]);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('only counts conversions on the opponent (not self-damage)', () => {
			startSession([makeTile('combo_damage', { params: { difficulty: 'easy', target: 1, percent: 30 } })]);
			setupGame();
			emitGameWithCombos(true, [
				{ playerIndex: MY_IDX, startPercent: 0, currentPercent: 100 }, // damage on ME — irrelevant
				{ playerIndex: OPP_IDX, startPercent: 0, currentPercent: 20 }, // 20% on opp — below 30%
			]);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});
	});

	// ── airborne_win ──────────────────────────────────────────────────────────
	describe('airborne_win', () => {
		function emitFrameWithAirborne(frameNum: number, isAirborne: boolean) {
			localEmitter.emit('GameFrame', {
				frame: frameNum,
				players: {
					[MY_IDX]: { post: { stocksRemaining: 4, percent: 0, lastAttackLanded: 0, lastHitBy: -1, isAirborne } },
					[OPP_IDX]: { post: { stocksRemaining: 3, percent: 80, lastAttackLanded: 0, lastHitBy: MY_IDX, actionStateId: 2, positionX: 0 } },
				},
			} as any);
		}

		it('completes when airborne ratio meets threshold on win', () => {
			startSession([makeTile('airborne_win', { params: { difficulty: 'easy', target: 1, percent: 50 } })]);
			setupGame();
			// 3 airborne frames, 1 grounded = 75% airborne
			emitFrameWithAirborne(1, true);
			emitFrameWithAirborne(2, true);
			emitFrameWithAirborne(3, true);
			emitFrameWithAirborne(4, false);
			emitGame(true);
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('does NOT complete when airborne ratio is below threshold', () => {
			startSession([makeTile('airborne_win', { params: { difficulty: 'hard', target: 1, percent: 70 } })]);
			setupGame();
			emitFrameWithAirborne(1, true);
			emitFrameWithAirborne(2, false);
			emitFrameWithAirborne(3, false);
			emitGame(true);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('does NOT complete on a loss even with enough airborne time', () => {
			startSession([makeTile('airborne_win', { params: { difficulty: 'easy', target: 1, percent: 50 } })]);
			setupGame();
			emitFrameWithAirborne(1, true);
			emitFrameWithAirborne(2, true);
			emitGame(false);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});
	});

	// ── same_move_kills ───────────────────────────────────────────────────────
	describe('same_move_kills', () => {
		it('completes when 3 stocks taken with same move on win', () => {
			startSession([makeTile('same_move_kills', {
				target: 3, params: { difficulty: 'hard', target: 3 }, hasProgress: true,
			})]);
			setupGame();
			// 3 kills with fsmash (moveId=10)
			emitKill(10); emitKill(10); emitKill(10);
			emitGame(true);
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('shows progress mid-game via handleOpponentStockLost', () => {
			startSession([makeTile('same_move_kills', {
				target: 3, params: { difficulty: 'hard', target: 3 }, hasProgress: true,
			})]);
			setupGame();
			emitKill(10); // 1 fsmash kill
			expect(lastChallengeUpdate()?.progress).toBe(1);
			emitKill(10); // 2 fsmash kills
			expect(lastChallengeUpdate()?.progress).toBe(2);
		});

		it('does NOT complete when kills spread across different moves', () => {
			startSession([makeTile('same_move_kills', {
				target: 3, params: { difficulty: 'hard', target: 3 }, hasProgress: true,
			})]);
			setupGame();
			emitKill(10); emitKill(11); emitKill(13); // fsmash, usmash, nair — all different
			emitGame(true);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('does NOT complete on a loss', () => {
			startSession([makeTile('same_move_kills', {
				target: 3, params: { difficulty: 'hard', target: 3 }, hasProgress: true,
			})]);
			setupGame();
			emitKill(10); emitKill(10); emitKill(10);
			emitGame(false);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});
	});

	// ── no_smash_win ──────────────────────────────────────────────────────────
	describe('no_smash_win', () => {
		it('completes when winning without landing fsmash or dsmash', () => {
			startSession([makeTile('no_smash_win')]);
			setupGame();
			emitKill(13); // nair kill — no smash
			emitGame(true);
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('does NOT complete if fsmash (moveId=10) was landed', () => {
			startSession([makeTile('no_smash_win')]);
			setupGame();
			emitKill(10); // fsmash kill
			emitGame(true);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('does NOT complete if usmash (moveId=11) was landed', () => {
			startSession([makeTile('no_smash_win')]);
			setupGame();
			emitKill(11); // usmash kill
			emitGame(true);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('does NOT complete if dsmash (moveId=12) was landed', () => {
			startSession([makeTile('no_smash_win')]);
			setupGame();
			emitKill(12); // dsmash kill
			emitGame(true);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('does NOT complete on a loss', () => {
			startSession([makeTile('no_smash_win')]);
			setupGame();
			emitGame(false);
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});
	});

	// ── edgeguard_rate ────────────────────────────────────────────────────────
	// Edgeguard stats are computed by enrichPostGameStats (frame analysis) and
	// embedded in postGameStats.overall[playerIdx].edgeGuard. Tests mock this directly.
	describe('edgeguard_rate', () => {
		function emitGameWithEdgeguard(attempts: number, successes: number, didWin = true) {
			const unsuccessful = attempts - successes;
			const edgeGuard = {
				totalAttempts: attempts,
				successfulAttempts: successes,
				unsuccessfulAttempts: unsuccessful,
				successfulAttemptsPercent: attempts > 0 ? (successes / attempts) * 100 : 0,
				unsuccessfulAttemptsPercent: attempts > 0 ? (unsuccessful / attempts) * 100 : 0,
			};
			localEmitter.emit('PostGameStats', {
				postGameStats: {
					overall: [
						{ playerIndex: MY_IDX, totalDamage: 200, edgeGuard },
						{ playerIndex: OPP_IDX, totalDamage: 100 },
					],
					stocks: [],
					actionCounts: [],
				},
				lastFrame: {
					players: {
						[MY_IDX]: { post: { stocksRemaining: didWin ? 3 : 0 } },
						[OPP_IDX]: { post: { stocksRemaining: didWin ? 0 : 2 } },
					},
				},
				settings: {
					players: [
						{ playerIndex: MY_IDX, characterId: 20 },
						{ playerIndex: OPP_IDX, characterId: 2 },
					],
					matchInfo: {},
				},
			} as any);
		}

		it('does not complete with fewer than 3 attempts', () => {
			startSession([makeTile('edgeguard_rate', { params: { difficulty: 'easy', target: 1, percent: 20 } })]);
			setupGame();
			emitGameWithEdgeguard(2, 1); // only 2 attempts — min 3 required
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('completes at easy (20%) with 1 success out of 3', () => {
			startSession([makeTile('edgeguard_rate', { params: { difficulty: 'easy', target: 1, percent: 20 } })]);
			setupGame();
			emitGameWithEdgeguard(3, 1); // 1/3 = 33% ≥ 20%
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('completes at medium (50%) with 2 successes out of 3', () => {
			startSession([makeTile('edgeguard_rate', { params: { difficulty: 'medium', target: 1, percent: 50 } })]);
			setupGame();
			emitGameWithEdgeguard(3, 2); // 2/3 = 66% ≥ 50%
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('does NOT complete at hard (80%) with 2 out of 3 successes', () => {
			startSession([makeTile('edgeguard_rate', { params: { difficulty: 'hard', target: 1, percent: 80 } })]);
			setupGame();
			emitGameWithEdgeguard(3, 2); // 2/3 = 66% < 80%
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('accumulates attempts across games', () => {
			startSession([makeTile('edgeguard_rate', { params: { difficulty: 'hard', target: 1, percent: 80 } })]);
			setupGame();
			emitGameWithEdgeguard(2, 2); // session: 2/2 so far (below min-3)
			setupGame();
			emitGameWithEdgeguard(1, 1); // session: 3/3 = 100% ≥ 80%
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('LRAS on game 2 does not undo completion earned in game 1', () => {
			startSession([makeTile('edgeguard_rate', { params: { difficulty: 'easy', target: 1, percent: 100 } })]);
			setupGame();
			emitGameWithEdgeguard(3, 3); // game 1: complete tile
			expect(lastChallengeUpdate()?.completed).toBe(true);
			// Game 2: snapshot captures completed tile state
			setupGame();
			emitLras(true); // quit — no edgeguard accumulated this game, snapshot = completed
			// No revert update with completed=false should be sent
			expect(allUpdates().some((u: any) => u?.completed === false)).toBe(false);
		});

		it('LRAS on game that would complete tile reverts it', () => {
			startSession([makeTile('edgeguard_rate', { params: { difficulty: 'easy', target: 1, percent: 100 } })]);
			// Game 1: only 2 attempts — no completion
			setupGame();
			emitGameWithEdgeguard(2, 2);
			// Game 2 starts — snapshot: { attempts: 2, tile: not completed }
			setupGame();
			// LRAS — PostGameStats never processed, so no additional attempts
			emitLras(true);
			// Session stays at 2 attempts (below min-3) → still not completed
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});
	});

	// ── Offline game sequence (gameEndMethod=2, matchId='') ───────────────────
	// Reproduces the log sequence: win → quick-offline-game-end → win.
	// Offline games end with gameEndMethod=2 (GAME), not 7 (NO_CONTEST).
	// isLocalQuit check does NOT fire — game is a normal win or loss.
	describe('offline game sequence', () => {
		it('win_games_total: win → offline-loss → win = 2 total (not 3)', () => {
			startSession([makeTile('win_games_total', {
				target: 15, params: { difficulty: 'hard', target: 15 }, hasProgress: true,
			})]);
			setupGame(); emitOfflineGame(true);   // win #1 → progress 1
			expect(lastChallengeUpdate()?.progress).toBe(1);
			setupGame(); emitOfflineGame(false);  // loss/quit → no change
			setupGame(); emitOfflineGame(true);   // win #2 → progress 2
			expect(lastChallengeUpdate()?.progress).toBe(2);
		});

		it('win_games_total: offline-win counted same as online win', () => {
			startSession([makeTile('win_games_total', {
				target: 3, params: { difficulty: 'easy', target: 3 }, hasProgress: true,
			})]);
			setupGame(); emitOfflineGame(true);
			setupGame(); emitOfflineGame(true);
			setupGame(); emitOfflineGame(true);
			expect(lastChallengeUpdate()?.completed).toBe(true);
		});

		it('win_in_a_row: offline loss resets streak, so win→loss→win does not complete target=2', () => {
			startSession([makeTile('win_in_a_row', {
				target: 2, params: { difficulty: 'medium', target: 2 }, hasProgress: true,
			})]);
			setupGame(); emitOfflineGame(true);   // streak = 1
			setupGame(); emitOfflineGame(false);  // loss → streak = 0
			setupGame(); emitOfflineGame(true);   // streak = 1 again
			expect(lastChallengeUpdate()?.completed).toBeFalsy();
		});

		it('offline replay mismatch: wrong replay loaded (frame diff > 30s) → game skipped', () => {
			startSession([makeTile('win_games_total', {
				target: 3, params: { difficulty: 'easy', target: 3 }, hasProgress: true,
			})]);
			setupGame();
			// Simulate ~10s of live gameplay (frame 600)
			localEmitter.emit('GameFrame', frame(600, 0, 3));
			// PostGameStats arrives but lastFrame.frame = 8000 (from wrong old replay on disk)
			localEmitter.emit('PostGameStats', {
				gameEnd: { gameEndMethod: 2, lrasInitiatorIndex: -1 },
				postGameStats: {
					overall: [{ playerIndex: MY_IDX, totalDamage: 200 }],
					stocks: [], actionCounts: [],
				},
				lastFrame: {
					frame: 8000, // 7400 frames off → wrong replay
					players: {
						[MY_IDX]: { post: { stocksRemaining: 3 } },
						[OPP_IDX]: { post: { stocksRemaining: 0 } }, // old replay shows win
					},
				},
				settings: {
					players: [
						{ playerIndex: MY_IDX, characterId: 2 },
						{ playerIndex: OPP_IDX, characterId: 6 },
					],
					matchInfo: { matchId: '', gameNumber: 0, tiebreakerNumber: 0 },
				},
			} as any);
			// Mismatch detected — no win counted
			expect(lastChallengeUpdate()?.progress ?? 0).toBe(0);
		});

		it('offline win-while-losing (both stocks remain) is a loss, not a win', () => {
			// gameEndMethod=2 with both players having stocks → didWin=false
			startSession([makeTile('win_games_total', {
				target: 3, params: { difficulty: 'easy', target: 3 }, hasProgress: true,
			})]);
			setupGame();
			// Emit a game end where BOTH players still have stocks (mid-quit scenario)
			localEmitter.emit('PostGameStats', {
				gameEnd: { gameEndMethod: 2, lrasInitiatorIndex: -1 },
				postGameStats: {
					overall: [{ playerIndex: MY_IDX, totalDamage: 50 }],
					stocks: [], actionCounts: [],
				},
				lastFrame: {
					players: {
						[MY_IDX]: { post: { stocksRemaining: 2 } },
						[OPP_IDX]: { post: { stocksRemaining: 1 } }, // opponent alive → not a win
					},
				},
				settings: {
					players: [
						{ playerIndex: MY_IDX, characterId: 2 },
						{ playerIndex: OPP_IDX, characterId: 6 },
					],
					matchInfo: { matchId: '', gameNumber: 0, tiebreakerNumber: 0 },
				},
			} as any);
			// No win counted
			expect(lastChallengeUpdate()?.progress ?? 0).toBe(0);
		});
	});
});

