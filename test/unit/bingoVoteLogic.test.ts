import "reflect-metadata";
import { BingoService } from '../../electron/services/bingoService';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import type { BingoTile, BingoChallengeId, BingoSession, BingoVoteState } from '../../frontend/src/lib/models/types/bingo';

const MY_IDX = 0;

function makeTile(id: BingoChallengeId, overrides: Partial<BingoTile> = {}): BingoTile {
	return {
		instanceId: `tile-${id}-${Math.random().toString(36).slice(-4)}`,
		challengeId: id,
		label: id,
		description: id,
		params: { difficulty: 'medium', target: 1 },
		progress: 0, target: 1,
		completed: false, completedBy: null,
		hasProgress: false,
		...overrides,
	};
}

function makeSession(tiles: BingoTile[], size = 3, twitchEnabled = false): BingoSession {
	return {
		board: { id: 'b1', size, tiles, difficulty: 'medium', createdAt: Date.now() },
		settings: {
			mode: 'lockout', boardSize: size as 3, difficulty: 'medium', winCondition: 'lockout',
			lines: { rows: true, columns: true, diagonals: true },
			requireQueueAfterGame: false,
			timer: { enabled: false, durationMinutes: 60 },
			twitchEnabled, twitchChannel: 'testchannel',
		},
		startedAt: Date.now(), localPlayerIndex: MY_IDX,
		role: 'solo', opponentConnected: false,
		localName: 'Player 1', opponentName: null,
	};
}

describe('BingoService vote logic', () => {
	let localEmitter: TypedEmitter;
	let clientEmitter: TypedEmitter;
	let sendMessage: jest.Mock;
	let service: any; // cast to any to access private methods

	beforeEach(() => {
		jest.useFakeTimers();
		localEmitter = new TypedEmitter();
		clientEmitter = new TypedEmitter();
		sendMessage = jest.fn();

		service = new BingoService(
			{ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() } as any,
			{ getVersion: jest.fn().mockReturnValue('1.0.0') } as any,
			localEmitter,
			clientEmitter,
			{ sendMessage, bingoPeerWss: { on: jest.fn() } } as any,
			{ getBingoLeaderboard: jest.fn().mockReturnValue({}), setBingoLeaderboard: jest.fn() } as any,
			{ connect: jest.fn(), disconnect: jest.fn() } as any,
		);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	// ── getLockedBoxIndices ────────────────────────────────────────────────────

	describe('getLockedBoxIndices', () => {
		it('returns empty set when no session', () => {
			expect(service.getLockedBoxIndices().size).toBe(0);
		});

		it('returns empty set when no completed rows', () => {
			// 3x3 board, no completed tiles
			const tiles = Array.from({ length: 9 }, (_, i) =>
				makeTile('win_games_total', { instanceId: `b${i}` })
			);
			service.session = makeSession(tiles);
			expect(service.getLockedBoxIndices().size).toBe(0);
		});

		it('marks all tiles in a completed local row as locked', () => {
			// 3x3 board: row 0 (indices 0,1,2) all completed by local
			const tiles = Array.from({ length: 9 }, (_, i) =>
				makeTile('win_games_total', {
					instanceId: `b${i}`,
					completed: i < 3,
					completedBy: i < 3 ? 'local' : null,
				})
			);
			service.session = makeSession(tiles);
			const locked = service.getLockedBoxIndices();
			expect(locked.has(0)).toBe(true);
			expect(locked.has(1)).toBe(true);
			expect(locked.has(2)).toBe(true);
			// Row 1 tiles not locked
			expect(locked.has(3)).toBe(false);
			expect(locked.has(4)).toBe(false);
		});

		it('marks all tiles in a completed opponent column as locked', () => {
			// 3x3 board: column 0 (indices 0,3,6) all completed by opponent
			const tiles = Array.from({ length: 9 }, (_, i) =>
				makeTile('win_games_total', {
					instanceId: `b${i}`,
					completed: i % 3 === 0,
					completedBy: i % 3 === 0 ? 'opponent' : null,
				})
			);
			service.session = makeSession(tiles);
			const locked = service.getLockedBoxIndices();
			expect(locked.has(0)).toBe(true);
			expect(locked.has(3)).toBe(true);
			expect(locked.has(6)).toBe(true);
			expect(locked.has(1)).toBe(false);
		});

		it('marks diagonal tiles as locked when all completed', () => {
			// 3x3 board: main diagonal (0,4,8) completed by local
			const tiles = Array.from({ length: 9 }, (_, i) =>
				makeTile('win_games_total', {
					instanceId: `b${i}`,
					completed: [0, 4, 8].includes(i),
					completedBy: [0, 4, 8].includes(i) ? 'local' : null,
				})
			);
			service.session = makeSession(tiles);
			const locked = service.getLockedBoxIndices();
			expect(locked.has(0)).toBe(true);
			expect(locked.has(4)).toBe(true);
			expect(locked.has(8)).toBe(true);
			expect(locked.has(1)).toBe(false);
		});

		it('does NOT lock a row where only some tiles are completed', () => {
			// Only 2 of 3 tiles in row 0 are completed
			const tiles = Array.from({ length: 9 }, (_, i) =>
				makeTile('win_games_total', {
					instanceId: `b${i}`,
					completed: i < 2,
					completedBy: i < 2 ? 'local' : null,
				})
			);
			service.session = makeSession(tiles);
			expect(service.getLockedBoxIndices().size).toBe(0);
		});
	});

	// ── executeSwap ───────────────────────────────────────────────────────────

	describe('executeSwap', () => {
		it('returns early message when fewer than 2 eligible tiles', () => {
			// All 9 tiles in completed rows → all locked
			const tiles = Array.from({ length: 9 }, (_, i) =>
				makeTile('win_games_total', {
					instanceId: `b${i}`,
					completed: true,
					completedBy: 'local',
				})
			);
			// Row 0, row 1, row 2 all complete → all 9 locked
			service.session = makeSession(tiles);
			const result = service.executeSwap();
			expect(result).toMatch(/not enough|protected/i);
			// No tile replaced event emitted
			const tileReplacedCalls = sendMessage.mock.calls.filter(([t]) => t === 'BingoTileReplaced');
			expect(tileReplacedCalls.length).toBe(0);
		});

		it('swaps only non-locked tiles', () => {
			// Row 0 (indices 0,1,2) all complete by local → locked
			// Remaining 6 tiles unlocked
			const tiles = Array.from({ length: 9 }, (_, i) =>
				makeTile(`win_games_total`, {
					instanceId: `b${i}`,
					completed: i < 3,
					completedBy: i < 3 ? 'local' : null,
					target: i + 1, // distinct labels so we can verify swap
				})
			);
			service.session = makeSession(tiles);
			sendMessage.mockClear();
			const result = service.executeSwap();
			// Should succeed without an error message
			expect(result).not.toMatch(/not enough|protected/i);
			// Exactly 1 BingoTilesSwapped event with both indices outside the locked set (0-2)
			const swapped = sendMessage.mock.calls.filter(([t]) => t === 'BingoTilesSwapped');
			expect(swapped.length).toBe(1);
			const { indexA, indexB } = swapped[0][1];
			expect(indexA).toBeGreaterThanOrEqual(3);
			expect(indexB).toBeGreaterThanOrEqual(3);
		});

		it('swapped tiles are reset to progress 0 and completedBy null', () => {
			const tiles = Array.from({ length: 9 }, (_, i) =>
				makeTile('win_games_total', {
					instanceId: `b${i}`,
					completed: i === 5, // one completed tile not in any winning row
					completedBy: i === 5 ? 'local' : null,
					progress: i === 5 ? 1 : 0,
				})
			);
			service.session = makeSession(tiles);
			sendMessage.mockClear();
			service.executeSwap();
			const replaced = sendMessage.mock.calls.filter(([t]) => t === 'BingoTileReplaced');
			for (const [, data] of replaced) {
				expect(data.tile.completed).toBe(false);
				expect(data.tile.completedBy).toBeNull();
				expect(data.tile.progress).toBe(0);
			}
		});

		it('does not swap frozen tiles', () => {
			// Only tiles 3 and 4 are eligible (not locked, not frozen)
			// Tile 5 is frozen, tiles 0-2 frozen, rest locked
			const tiles = Array.from({ length: 9 }, (_, i) => {
				if (i < 3) return makeTile('win_games_total', { instanceId: `b${i}`, completed: true, completedBy: 'local' }); // locked
				if (i === 5) return makeTile('win_games_total', { instanceId: `b${i}`, frozen: true }); // frozen
				return makeTile('win_games_total', { instanceId: `b${i}` });
			});
			service.session = makeSession(tiles);
			sendMessage.mockClear();
			service.executeSwap();
			const replaced = sendMessage.mock.calls.filter(([t]) => t === 'BingoTileReplaced');
			// Tile 5 (frozen) must not appear in replaced
			for (const [, data] of replaced) {
				expect(data.tile.frozen).not.toBe(true);
			}
		});
	});

	// ── executeRandomize ──────────────────────────────────────────────────────

	describe('executeRandomize', () => {
		it('returns message when no eligible tiles', () => {
			// All tiles completed — nothing to randomize
			const tiles = Array.from({ length: 9 }, (_, i) =>
				makeTile('win_games_total', { instanceId: `b${i}`, completed: true, completedBy: 'local' })
			);
			service.session = makeSession(tiles);
			const result = service.executeRandomize();
			expect(result).toMatch(/no eligible/i);
		});

		it('does not randomize locked tiles', () => {
			// All tiles completed and locked (row 0, 1, 2 all local → lockout win)
			const tiles = Array.from({ length: 9 }, (_, i) =>
				makeTile('win_games_total', {
					instanceId: `b${i}`,
					completed: true,
					completedBy: 'local',
				})
			);
			service.session = makeSession(tiles);
			const result = service.executeRandomize();
			expect(result).toMatch(/no eligible/i);
		});

		it('randomizes a non-locked non-completed tile', () => {
			// Row 0 (0,1,2) locked by local. Indices 3-8 eligible.
			const tiles = Array.from({ length: 9 }, (_, i) =>
				makeTile('win_games_total', {
					instanceId: `b${i}`,
					completed: i < 3,
					completedBy: i < 3 ? 'local' : null,
				})
			);
			service.session = makeSession(tiles);
			sendMessage.mockClear();
			const result = service.executeRandomize();
			expect(result).not.toMatch(/no eligible/i);
			// New rolling event emitted for each randomized tile
			const rolling = sendMessage.mock.calls.filter(([t]) => t === 'BingoTilesRolling');
			expect(rolling.length).toBe(1);
			const { rolls } = rolling[0][1];
			expect(rolls.length).toBeGreaterThanOrEqual(1);
			// All replaced tiles must be outside the locked set (indices 0-2)
			for (const roll of rolls) {
				const idx = tiles.findIndex(t => t.instanceId === roll.instanceId);
				expect(idx).toBeGreaterThanOrEqual(3);
			}
		});

		it('does not randomize frozen tiles', () => {
			// All tiles except one are completed. The remaining one is frozen.
			const tiles = Array.from({ length: 9 }, (_, i) =>
				makeTile('win_games_total', {
					instanceId: `b${i}`,
					completed: i !== 4,
					completedBy: i !== 4 ? 'local' : null,
					frozen: i === 4,
				})
			);
			service.session = makeSession(tiles);
			const result = service.executeRandomize();
			expect(result).toMatch(/no eligible/i);
		});
	});

	// ── executeFreeze ─────────────────────────────────────────────────────────

	describe('executeFreeze', () => {
		it('freezes a random non-locked incomplete tile', () => {
			const tiles = Array.from({ length: 9 }, (_, i) =>
				makeTile('win_games_total', { instanceId: `b${i}` })
			);
			service.session = makeSession(tiles);
			sendMessage.mockClear();
			const result = service.executeFreeze();
			expect(result).toMatch(/froze/i);
			const updates = sendMessage.mock.calls.filter(([t]) => t === 'BingoChallengeUpdates');
			expect(updates.length).toBeGreaterThan(0);
			expect(updates[0][1].updates[0].frozen).toBe(true);
		});

		it('returns message when no eligible tiles', () => {
			// All tiles already frozen
			const tiles = Array.from({ length: 9 }, (_, i) =>
				makeTile('win_games_total', { instanceId: `b${i}`, frozen: true })
			);
			service.session = makeSession(tiles);
			const result = service.executeFreeze();
			expect(result).toMatch(/no eligible/i);
		});

		it('unfreezes tile after 2 minutes', () => {
			const tiles = Array.from({ length: 9 }, (_, i) =>
				makeTile('win_games_total', { instanceId: `b${i}` })
			);
			service.session = makeSession(tiles);
			service.executeFreeze();
			sendMessage.mockClear();
			// Advance past max freeze duration (50s + up to 150s = 200s max)
			jest.advanceTimersByTime(201000);
			const updates = sendMessage.mock.calls.filter(([t]) => t === 'BingoChallengeUpdates');
			expect(updates.length).toBeGreaterThan(0);
			expect(updates[0][1].updates[0].frozen).toBe(false);
		});
	});

	// ── handleChatVote ────────────────────────────────────────────────────────

	describe('handleChatVote', () => {
		const CH = 'testchannel'; // matches makeSession's twitchChannel

		it('ignores messages when no active vote', () => {
			service.session = makeSession([], 3, true);
			service.handleChatVote({ username: 'user1', text: '1', channel: CH });
			expect(sendMessage).not.toHaveBeenCalledWith('BingoVoteState', expect.anything());
		});

		it('records votes for options 1/2/3', () => {
			service.session = makeSession([], 3, true);
			service.voteStates.set('host', {
				active: true, forRole: 'all', role: 'host',
				options: [
					{ id: 'randomize_opponent_tile', label: 'Randomize', description: '', votes: 0 },
					{ id: 'freeze_tile',             label: 'Freeze',    description: '', votes: 0 },
					{ id: 'swap_tiles',              label: 'Swap',      description: '', votes: 0 },
				],
				startedAt: Date.now(), durationMs: 30000,
			} as BingoVoteState);
			service.chatVotesByRole.get('host').clear();

			service.handleChatVote({ username: 'alice', text: '1', channel: CH });
			service.handleChatVote({ username: 'bob',   text: '2', channel: CH });
			service.handleChatVote({ username: 'carol', text: '1', channel: CH });

			const calls = sendMessage.mock.calls.filter(([t]) => t === 'BingoVoteState');
			const lastPayload = calls[calls.length - 1][1];
			const state = lastPayload?.host ?? lastPayload;
			expect(state.options[0].votes).toBe(2);
			expect(state.options[1].votes).toBe(1);
			expect(state.options[2].votes).toBe(0);
		});

		it('first vote per user counts, repeated vote ignored', () => {
			service.session = makeSession([], 3, true);
			service.voteStates.set('host', {
				active: true, forRole: 'all', role: 'host',
				options: [
					{ id: 'randomize_opponent_tile', label: 'Randomize', description: '', votes: 0 },
					{ id: 'freeze_tile',             label: 'Freeze',    description: '', votes: 0 },
					{ id: 'swap_tiles',              label: 'Swap',      description: '', votes: 0 },
				],
				startedAt: Date.now(), durationMs: 30000,
			} as BingoVoteState);
			service.chatVotesByRole.get('host').clear();

			service.handleChatVote({ username: 'alice', text: '1', channel: CH });
			service.handleChatVote({ username: 'alice', text: '3', channel: CH }); // second vote ignored
			const calls = sendMessage.mock.calls.filter(([t]) => t === 'BingoVoteState');
			const lastPayload = calls[calls.length - 1][1];
			const state = lastPayload?.host ?? lastPayload;
			expect(state.options[0].votes).toBe(1);
			expect(state.options[2].votes).toBe(0);
		});

		it('ignores non-numeric messages', () => {
			service.session = makeSession([], 3, true);
			service.voteStates.set('host', {
				active: true, forRole: 'all', role: 'host',
				options: [
					{ id: 'randomize_opponent_tile', label: 'Randomize', description: '', votes: 0 },
					{ id: 'freeze_tile',             label: 'Freeze',    description: '', votes: 0 },
					{ id: 'swap_tiles',              label: 'Swap',      description: '', votes: 0 },
				],
				startedAt: Date.now(), durationMs: 30000,
			} as BingoVoteState);
			service.chatVotesByRole.get('host').clear();
			const before = sendMessage.mock.calls.length;
			service.handleChatVote({ username: 'user', text: 'hello', channel: CH });
			service.handleChatVote({ username: 'user', text: '4',     channel: CH });
			expect(sendMessage.mock.calls.length).toBe(before);
		});
	});

	// ── resolveVote ───────────────────────────────────────────────────────────

	describe('resolveVote (winner determination)', () => {
		it('picks highest-vote option', () => {
			const tiles = Array.from({ length: 9 }, (_, i) =>
				makeTile('win_games_total', { instanceId: `b${i}`, completedBy: i < 3 ? 'local' : null, completed: i < 3 })
			);
			service.session = makeSession(tiles);
			service.voteStates.set('host', {
				active: true, forRole: 'all', role: 'host',
				options: [
					{ id: 'randomize_opponent_tile', label: 'Randomize', description: '', votes: 5 },
					{ id: 'freeze_tile',             label: 'Freeze',    description: '', votes: 2 },
					{ id: 'swap_tiles',              label: 'Swap',      description: '', votes: 1 },
				],
				startedAt: Date.now(), durationMs: 30000,
			} as BingoVoteState);
			service.chatVotesByRole.get('host').clear();
			service.resolveVote('host');
			const calls = sendMessage.mock.calls.filter(([t]) => t === 'BingoVoteState');
			// processActionQueue sends the result popup synchronously
			const lastPayload = calls[calls.length - 1][1];
			const resolved: BingoVoteState = lastPayload?.host ?? lastPayload;
			expect(resolved.active).toBe(false);
			expect(resolved.result?.winner).toBe('randomize_opponent_tile');
		});
	});
});
