import { delay, inject, singleton } from 'tsyringe';
import { ElectronSettingsStore } from './store/storeSettings';
import type { ElectronLog } from 'electron-log';
import type { App } from 'electron';
import { GameEndMethod } from '@slippi/slippi-js';
import type { FrameEntryType, GameStartType } from '@slippi/slippi-js';
import type { StatsType } from '@slippi/slippi-js/dist/stats/common';
import WebSocket from 'ws';
import { TypedEmitter, type MessageEvents } from '../../frontend/src/lib/utils/customEventEmitter';
import { scopedLog } from '../utils/logger';
import { NotificationType } from '../../frontend/src/lib/models/enum';
import { MessageHandler } from './messageHandler';
import type {
	BingoSession,
	BingoChallengeUpdate,
	BingoLobbyPayload,
	BingoSettings,
	BingoSoloWinPayload,
	BingoLeaderboardEntry,
	BingoTile,
	BingoDifficulty,
	BingoChallengeId,
	BingoVoteState,
	BingoVoteActionType,
	BingoWinState,
} from '../../frontend/src/lib/models/types/bingo';
import type { CurrentPlayer, GameStats } from '../../frontend/src/lib/models/types/slippiData';
import { getMoveCategory } from '../../frontend/src/lib/models/constants/moveCategories';
import {
	CHALLENGE_DEFINITIONS,
	resolveTarget,
	PLAYABLE_CHARACTER_IDS,
	CHARACTER_NAMES,
} from '../../frontend/src/lib/models/constants/bingoChallenges';
import { TwitchChatService } from './twitchChatService';

interface SessionSnapshot {
	sessionKillsByMove: Map<string, number>;
	sessionWallTechs: number;
	sessionStarKOs: number;
	sessionScreenKOs: number;
	sessionSpikeKills: number;
	sessionSpikeMoveCategories: Set<string>;
	sessionBlastZoneKills: Map<string, number>;
	sessionStocksUnderPercent: number;
	sessionZeroDeaths: number;
	sessionFourStocks: number;
	sessionLCancelGames: number;
	sessionTotalWins: number;
	sessionBestSpikeGame: number;
	winStreak: number;
	characterWins: Map<number, number>;
	sessionEdgeguardAttempts: number;
	sessionEdgeguardSuccesses: number;
	sessionRestKills: number;
	sessionFalconPunchKills: number;
	sessionGwmJudgeKills: number;
	sessionTurnipHeld: boolean;
	sessionEggLays: number;
	tileStates: Map<string, { progress: number; completed: boolean; completedBy: 'local' | 'opponent' | 'both' | null }>;
}

interface ZeroDeathAttempt {
	opponentIndex: number;
	startFrame: number;
	damageTaken: number;
}

interface BingoPeerMessage {
	type: 'BingoJoin' | 'BingoWelcome' | 'BingoStart' | 'BingoRestart' | 'BingoComplete' | 'BingoPing' | 'BingoSync' | 'BingoSettingsUpdate' | 'OpponentFrame';
	version?: string;
	board?: BingoSession['board'];
	settings?: BingoSession['settings'];
	instanceId?: string;
	timestamp?: number;
	playerName?: string;
	twitchUsername?: string;
	/** Watch-opponent: slimmed live game state streamed to the peer. */
	opponent?: { settings: unknown; frame: unknown; score: number[] };
}

@singleton()
export class BingoService {
	private session: BingoSession | null = null;
	private lobby: BingoLobbyPayload | null = null;
	private localPlayerIndex: number | null = null;
	private opponentPlayerIndex: number | null = null;
	private localPlayerName: string = 'Player 1';
	private pendingOpponentName: string | null = null;
	private opponentTwitchUsername: string | null = null;

	// Watch-opponent: latest local game settings/score + a throttle for streaming frames.
	private latestGameSettings: GameStartType | null = null;
	private latestGameScore: number[] = [0, 0];
	private lastOpponentStreamAt = 0;

	// Peer connection state
	private peerSocket: WebSocket | null = null; // active peer WS (either as host or guest)

	// Per-game state (reset on GameSettings)
	private effectiveLocalIndex: number | null = null;
	private currentGameLocalCharId: number = -1;
	private peakOpponentPercent: number = 0;
	private zerodeathAttempt: ZeroDeathAttempt | null = null;
	private gameSpikesThisGame: number = 0;
	private gameKillMoveCategories: Set<string> = new Set();
	private gameBlastZoneKills: Map<string, number> = new Map();
	private gameDurationFrames: number = 0;
	private prevFramePercents: Map<number, number> = new Map();
	private prevFrameStocks: Map<number, number> = new Map();
	private lastWarmupGameId: string | null = null;
	private myDamageTakenThisGame: number = 0;
	private myAirborneFrames: number = 0;
	private myTotalGameFrames: number = 0;
	private usedSmashThisGame: boolean = false;
	private prevMyLastAttack: number = 0;
	private gameKillsPerMove: Map<string, number> = new Map();

	// Session accumulators (persist across games)
	private sessionKillsByMove: Map<string, number> = new Map();
	private sessionWallTechs: number = 0;
	private sessionStarKOs: number = 0;
	private sessionScreenKOs: number = 0;
	private sessionSpikeKills: number = 0;
	private sessionSpikeMoveCategories: Set<string> = new Set();
	private sessionBlastZoneKills: Map<string, number> = new Map();
	private sessionStocksUnderPercent: number = 0;
	private sessionZeroDeaths: number = 0;
	private sessionFourStocks: number = 0;
	private sessionLCancelGames: number = 0;
	private sessionTotalWins: number = 0;
	private sessionBestSpikeGame: number = 0;
	private sessionEdgeguardAttempts: number = 0;
	private sessionEdgeguardSuccesses: number = 0;
	private sessionRestKills: number = 0;
	private sessionFalconPunchKills: number = 0;
	private sessionGwmJudgeKills: number = 0;
	private sessionTurnipHeld: boolean = false;
	private currentTurnipHeldFrames: number = 0;
	private sessionEggLays: number = 0;
	private winStreak: number = 0;
	private characterWins: Map<number, number> = new Map();
	private lastGameWasWin: boolean = false;
	private sessionSnapshot: SessionSnapshot | null = null;
	private opponentCompletedTiles: Set<string> = new Set();
	private readonly revertEnabled: boolean = true;

	// Vote state
	private voteStates: Map<'host' | 'guest', BingoVoteState> = new Map();
	private voteTimers: Map<'host' | 'guest', ReturnType<typeof setTimeout>> = new Map();
	private voteScheduleTimer: ReturnType<typeof setTimeout> | null = null;
	private chatVotesByRole: Map<'host' | 'guest', Map<string, BingoVoteActionType>> = new Map([['host', new Map()], ['guest', new Map()]]);
	private pendingActions: Array<{ action: BingoVoteActionType; description: string; channelName: string; role: 'host' | 'guest' }> = [];
	private actionQueueRunning = false;
	private actionQueueTimers: ReturnType<typeof setTimeout>[] = [];
	private guestVoteDelayTimer: ReturnType<typeof setTimeout> | null = null;
	private frozenTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('App') private app: App,
		@inject('LocalEmitter') private localEmitter: TypedEmitter,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(delay(() => ElectronSettingsStore)) private settingsStore: ElectronSettingsStore,
		@inject(delay(() => TwitchChatService)) private twitchChatService: TwitchChatService,
	) {
		this.log = scopedLog(this.log, 'Bingo');
		this.log.info('Initializing Bingo Service');
		this.initEventListeners();
		this.initPeerServer();
	}

	private initPeerServer() {
		this.messageHandler.bingoPeerWss.on('connection', (ws: WebSocket) => {
			this.log.info('Bingo: incoming peer connection');
			const isHosting = this.lobby !== null || this.session?.role === 'host';
			if (!isHosting) {
				ws.close(1008, 'Not hosting');
				return;
			}
			if (this.peerSocket && this.peerSocket.readyState === WebSocket.OPEN) {
				ws.close(1008, 'Slot taken');
				return;
			}

			ws.on('message', (raw) => {
				try {
					const msg: BingoPeerMessage = JSON.parse(raw.toString());
					if (msg.type === 'BingoJoin') {
						const theirVersion = msg.version ?? '';
						const myVersion = this.app.getVersion();
						if (!this.versionsCompatible(myVersion, theirVersion)) {
							ws.send(JSON.stringify({ type: 'BingoError', reason: `Version mismatch: host ${myVersion}, guest ${theirVersion}` }));
							ws.close(1008, 'Version mismatch');
							return;
						}
						this.peerSocket = ws;
						const myTwitch = this.settingsStore.getTwitchUsername();
						if (this.lobby) {
							// Lobby mode: exchange names, no board yet
							this.lobby.opponentConnected = true;
							this.lobby.opponentName = msg.playerName ?? null;
							this.opponentTwitchUsername = msg.twitchUsername ?? null;
							this.lobby.localTwitchUsername = myTwitch || undefined;
							this.lobby.opponentTwitchUsername = this.opponentTwitchUsername ?? undefined;
							ws.send(JSON.stringify({ type: 'BingoWelcome', version: myVersion, playerName: this.localPlayerName, settings: this.lobby.settings, twitchUsername: myTwitch }));
							this.messageHandler.sendMessage('BingoLobbyState', { ...this.lobby });
						} else {
							// Active session host (reconnect scenario)
							this.pendingOpponentName = msg.playerName ?? null;
							this.opponentTwitchUsername = msg.twitchUsername ?? null;
							ws.send(JSON.stringify({ type: 'BingoWelcome', version: myVersion, board: this.session!.board, settings: this.session!.settings, playerName: this.localPlayerName, twitchUsername: myTwitch }));
							if (this.session) this.session.opponentName = this.pendingOpponentName;
							this.updatePeerConnected(true);
						}
						this.log.info('Bingo: guest joined, version', theirVersion);
					} else if (msg.type === 'BingoComplete' && msg.instanceId) {
						this.applyOpponentCompletion(msg.instanceId);
					} else if (msg.type === 'BingoPing') {
						ws.send(JSON.stringify({ type: 'BingoPing' }));
					} else if (msg.type === 'OpponentFrame' && msg.opponent) {
						this.messageHandler.sendMessage('OpponentGameState', msg.opponent as Parameters<MessageEvents['OpponentGameState']>[0]);
					}
				} catch (err) {
					this.log.error('Bingo peer message error:', err);
				}
			});

			ws.on('close', () => {
				if (this.peerSocket === ws) {
					this.peerSocket = null;
					if (this.lobby) {
						this.lobby.opponentConnected = false;
						this.lobby.opponentName = null;
						this.messageHandler.sendMessage('BingoLobbyState', { ...this.lobby });
					} else {
						this.updatePeerConnected(false);
					}
					this.log.info('Bingo: peer disconnected');
				}
			});
		});
	}

	private initEventListeners() {
		this.localEmitter.on('CurrentPlayer', (player: CurrentPlayer | undefined) => {
			this.localPlayerIndex = player?.playerIndex ?? null;
			if (player?.displayName) this.localPlayerName = player.displayName;
		});

		this.localEmitter.on('GameScore', (score: number[] | undefined) => {
			if (score) this.latestGameScore = score;
		});

		this.localEmitter.on('GameSettings', (settings: GameStartType | undefined) => {
			this.latestGameSettings = settings ?? null;
			this.sessionSnapshot = this.takeSessionSnapshot();
			this.resetGameState();
			if (!settings || !settings.players?.length) return;
			// Fall back to port 0 when no ranked CurrentPlayer (offline/dev games)
			this.effectiveLocalIndex = this.localPlayerIndex ?? settings.players[0].playerIndex;
			const otherPlayer = settings.players.find(p => p.playerIndex !== this.effectiveLocalIndex);
			this.opponentPlayerIndex = otherPlayer?.playerIndex ?? null;
			const rawCharId = settings.players.find(p => p.playerIndex === this.effectiveLocalIndex)?.characterId ?? -1;
			this.currentGameLocalCharId = rawCharId === 19 ? 18 : rawCharId;
		});

		this.localEmitter.on('GameFrame', (frame: FrameEntryType | undefined | null) => {
			// Stream a slimmed copy to the peer so they can watch — even from the lobby
			// (before a bingo session). Independent of the bingo board processing below.
			if (frame?.players) this.streamFrameToPeer(frame);
			if (!this.session || !frame?.players) return;
			this.processGameFrame(frame);
		});

		this.localEmitter.on('PostGameStats', (game: GameStats | undefined) => {
			if (!this.session || !game) return;
			this.processGameEnd(game);
		});

		// User-initiated events come via clientEmitter
		this.clientEmitter.on('BingoStartLobby', () => {
			this.closePeerConnection();
			this.opponentTwitchUsername = null;
			this.session = null;
			const myTwitch = this.settingsStore.getTwitchUsername();
			this.lobby = { opponentConnected: false, opponentName: null, localName: this.localPlayerName, localTwitchUsername: myTwitch || undefined };
			this.messageHandler.lobbyGame = 'bingo';
			this.messageHandler.sendMessage('BingoLobbyState', { ...this.lobby });
		});

		this.clientEmitter.on('BingoEndToLobby', () => {
			if (!this.session) return;
			const savedPeer = this.peerSocket;
			const prevOpponentName = this.session.opponentName;
			this.stopVote();
			this.clearFrozenTimers();
			this.twitchChatService.disconnect();
			this.twitchChatService.disconnectSecond();
			this.session = null;
			this.peerSocket = null;
			this.messageHandler.sendMessage('BingoState', { session: null });
			const peerAlive = savedPeer?.readyState === WebSocket.OPEN;
			const myTwitch = this.settingsStore.getTwitchUsername();
			this.lobby = {
				opponentConnected: peerAlive,
				opponentName: peerAlive ? prevOpponentName : null,
				localName: this.localPlayerName,
				localTwitchUsername: myTwitch || undefined,
				opponentTwitchUsername: peerAlive ? (this.opponentTwitchUsername ?? undefined) : undefined,
			};
			this.messageHandler.lobbyGame = 'bingo';
			if (peerAlive) this.peerSocket = savedPeer;
			this.messageHandler.sendMessage('BingoLobbyState', { ...this.lobby });
		});

		this.clientEmitter.on('BingoUpdateLobbySettings', (settings: BingoSettings) => {
			if (!this.lobby) return;
			const myTwitch = this.settingsStore.getTwitchUsername();
			this.lobby.settings = settings;
			this.lobby.localTwitchUsername = myTwitch || undefined;
			this.messageHandler.sendMessage('BingoLobbyState', { ...this.lobby });
			if (this.peerSocket?.readyState === WebSocket.OPEN) {
				this.peerSocket.send(JSON.stringify({ type: 'BingoSettingsUpdate', settings }));
			}
		});

		this.clientEmitter.on('StartBingo', (session: BingoSession) => {
			if (this.lobby?.opponentConnected && this.peerSocket?.readyState === WebSocket.OPEN) {
				// Send board to waiting guest (perspectives flipped)
				const guestBoard = {
					...session.board,
					tiles: session.board.tiles.map((tile) => ({
						...tile,
						completedBy: tile.completedBy === 'local' ? 'opponent'
							: tile.completedBy === 'opponent' ? 'local'
								: tile.completedBy,
					})),
				};
				session.opponentName = this.lobby.opponentName;
				this.peerSocket.send(JSON.stringify({ type: 'BingoStart', board: guestBoard, settings: session.settings, playerName: this.localPlayerName }));
			}
			this.lobby = null;
			this.messageHandler.sendMessage('BingoLobbyState', null);
			this.startSession(session);
		});

		this.clientEmitter.on('StopBingo', () => {
			this.stopSession();
		});

		this.clientEmitter.on('BingoRestart', (session: BingoSession) => {
			if (!this.session) return;
			const prevOpponentName = this.session.opponentName;
			const savedPeer = this.peerSocket;

			// Soft stop — preserve savedPeer by nulling this.peerSocket before startSession
			this.stopVote();
			this.clearFrozenTimers();

			this.session = null;
			this.peerSocket = null; // prevents startSession's closePeerConnection from closing savedPeer

			if (savedPeer?.readyState === WebSocket.OPEN) {
				session.opponentName = prevOpponentName;
				session.opponentConnected = true;
			}

			this.startSession(session);

			if (savedPeer?.readyState === WebSocket.OPEN) {
				this.peerSocket = savedPeer;
				const guestBoard = {
					...session.board,
					tiles: session.board.tiles.map(tile => ({
						...tile,
						completedBy: tile.completedBy === 'local' ? 'opponent' as const
							: tile.completedBy === 'opponent' ? 'local' as const
								: tile.completedBy,
					})),
				};
				savedPeer.send(JSON.stringify({ type: 'BingoRestart', board: guestBoard, settings: session.settings, playerName: this.localPlayerName }));
				// Re-send state so frontend knows opponent is still connected
				this.sendBingoState();
			}
		});

		this.clientEmitter.on('BingoPeerConnect', (hostUrl: string) => {
			this.connectToHost(hostUrl);
		});

		this.clientEmitter.on('BingoDevSimulate', (instanceId: string, player: 'local' | 'opponent') => {
			if (!this.session) return;
			if (player === 'opponent') {
				this.applyOpponentCompletion(instanceId);
			} else {
				this.devCompleteLocal(instanceId);
			}
		});

		this.clientEmitter.on('BingoDevSimulateOpponent', () => {
			if (!this.lobby) return;
			this.lobby.opponentConnected = true;
			this.lobby.opponentName = 'Dev Opponent';
			this.opponentTwitchUsername = 'devopponent';
			this.lobby.opponentTwitchUsername = 'devopponent';
			this.messageHandler.sendMessage('BingoLobbyState', { ...this.lobby });
		});

		this.clientEmitter.on('BingoDevStartVote', () => {
			if (!this.session) return;
			this.stopVote();
			this.startVote();
		});

		this.clientEmitter.on('BingoDevResolveVote', (action: BingoVoteActionType) => {
			if (!this.session) return;
			const ACTION_LABELS: Record<string, string> = {
				randomize_opponent_tile: 'Reroll tiles',
				freeze_tile: 'Freeze tiles',
				swap_tiles: 'Swap tiles',
				shuffle_untouched: 'Shuffle tiles',
			};
			const role: 'host' | 'guest' = this.voteStates.has('host') ? 'host' : 'guest';
			const state = this.voteStates.get(role);
			const optionDesc = state?.options.find(o => o.id === action)?.description ?? ACTION_LABELS[action] ?? action;
			const channelName = role === 'host' ? (this.session.settings.twitchChannel || 'Dev') : (this.opponentTwitchUsername || 'Dev');
			const timer = this.voteTimers.get(role);
			if (timer) { clearTimeout(timer); this.voteTimers.delete(role); }
			this.voteStates.delete(role);
			this.chatVotesByRole.get(role)?.clear();
			this.sendVoteStates({ role, state: null });
			this.pendingActions.push({ action, description: optionDesc, channelName, role });
			this.processActionQueue();
		});

		this.clientEmitter.on('BingoSoloWin', (data: BingoSoloWinPayload) => {
			this.saveSoloRecord(data);
		});

		this.clientEmitter.on('GetBingoLeaderboard', () => {
			this.emitLeaderboard();
		});

		this.localEmitter.on('TwitchChatMessage', (data: { username: string; text: string; channel: string }) => {
			this.handleChatVote(data);
		});
	}

	private saveSoloRecord(data: BingoSoloWinPayload) {
		const key = `${data.boardSize}_${data.winCondition}_${data.difficulty}`;
		const entry: BingoLeaderboardEntry = {
			timeSeconds: data.timeSeconds,
			completedAt: Date.now(),
			version: this.app.getVersion(),
		};
		const all = this.settingsStore.getBingoLeaderboard();
		const existing = all[key] ?? [];
		const updated = [...existing, entry]
			.sort((a, b) => a.timeSeconds - b.timeSeconds)
			.slice(0, 10);
		all[key] = updated;
		this.settingsStore.setBingoLeaderboard(all);
		this.emitLeaderboard();
	}

	private emitLeaderboard() {
		this.messageHandler.sendMessage('BingoLeaderboard', {
			currentVersion: this.app.getVersion(),
			records: this.settingsStore.getBingoLeaderboard(),
		});
	}

	private sendChallengeUpdates(updates: BingoChallengeUpdate[], reverted: boolean = false): void {
		if (!this.session) return;
		const tiles = this.session.board.tiles;
		const totalCheckedLocal = tiles.filter(b => b.completedBy === 'local' || b.completedBy === 'both').length;
		const totalCheckedOpponent = tiles.filter(b => b.completedBy === 'opponent' || b.completedBy === 'both').length;
		const completedUpdate = updates.find(u => u.completed) ?? updates[updates.length - 1] ?? null;
		const latestTile = completedUpdate ? tiles.find(b => b.instanceId === completedUpdate.instanceId) : null;
		const latestUpdate = completedUpdate && latestTile ? {
			instanceId: completedUpdate.instanceId,
			label: latestTile.label,
			completedBy: completedUpdate.completedBy ?? null,
			reverted,
		} : null;
		this.messageHandler.sendMessage('BingoChallengeUpdates', {
			updates,
			reverted,
			webhookData: { totalCheckedLocal, totalCheckedOpponent, latestUpdate },
		});
		this.sendBingoState();
	}

	private devCompleteLocal(instanceId: string) {
		if (!this.session) return;
		const tile = this.session.board.tiles.find((b) => b.instanceId === instanceId);
		if (!tile) return;
		if (tile.frozen && !tile.frozenForOpponent) return;
		const isExclusive = this.session.settings.winCondition === 'lockout' || this.session.settings.winCondition === 'rowcontrol';
		// Already fully claimed by local (or shared) — no stealing back
		if (tile.completedBy === 'local' || tile.completedBy === 'both') return;
		if (isExclusive && tile.completedBy) return;
		if (!isExclusive && tile.completedBy === 'opponent') {
			tile.completedBy = 'both';
		} else {
			tile.completed = true;
			tile.completedBy = 'local';
			tile.progress = tile.target;
			this.sendCompletionToPeer(instanceId);
		}
		this.sendChallengeUpdates([{ instanceId, progress: tile.target, completed: true, completedBy: tile.completedBy ?? undefined }]);
		this.sendBoardToPeer(this.session.board);
	}

	// ── Peer: guest side ──────────────────────────────────────────────────────

	private connectToHost(hostUrl: string) {
		if (this.peerSocket) {
			this.peerSocket.close();
			this.peerSocket = null;
		}

		const wsUrl = hostUrl.replace(/^http/, 'ws').replace(/\/$/, '') + '/bingo-peer';
		this.log.info('Bingo: connecting to host', wsUrl);

		const ws = new WebSocket(wsUrl);
		this.peerSocket = ws;

		ws.on('open', () => {
			const myTwitch = this.settingsStore.getTwitchUsername();
			ws.send(JSON.stringify({ type: 'BingoJoin', version: this.app.getVersion(), playerName: this.localPlayerName, twitchUsername: myTwitch }));
		});

		ws.on('message', (raw) => {
			try {
				const msg: BingoPeerMessage = JSON.parse(raw.toString());
				if (msg.type === 'BingoWelcome' && !msg.board) {
					// Lobby: host acknowledged connection, no board yet — wait for BingoStart
					const myTwitch = this.settingsStore.getTwitchUsername();
					this.opponentTwitchUsername = msg.twitchUsername ?? null;
					this.lobby = {
						opponentConnected: true,
						opponentName: msg.playerName ?? null,
						localName: this.localPlayerName,
						settings: msg.settings,
						localTwitchUsername: myTwitch || undefined,
						opponentTwitchUsername: this.opponentTwitchUsername ?? undefined,
					};
					this.messageHandler.sendMessage('BingoLobbyState', { ...this.lobby });
				} else if (msg.type === 'BingoSettingsUpdate' && msg.settings) {
					if (this.lobby) {
						this.lobby.settings = msg.settings;
						this.messageHandler.sendMessage('BingoLobbyState', { ...this.lobby });
					}
				} else if (msg.type === 'BingoStart' && msg.board) {
					// Host started the game
					const session: BingoSession = {
						board: msg.board,
						settings: msg.settings ?? { mode: 'lockout', boardSize: msg.board.size as 3 | 4 | 5, difficulty: msg.board.difficulty, winCondition: 3, lines: { rows: true, columns: true, diagonals: true }, requireQueueAfterGame: false, timer: { enabled: false, durationMinutes: 60 }, twitchEnabled: false, twitchChannel: '' },
						startedAt: Date.now(),
						localPlayerIndex: this.localPlayerIndex,
						role: 'guest',
						opponentConnected: true,
						localName: this.localPlayerName,
						opponentName: msg.playerName ?? null,
					};
					this.lobby = null;
					this.messageHandler.sendMessage('BingoLobbyState', null);
					this.startSession(session);
				} else if (msg.type === 'BingoRestart' && msg.board) {
					// Host soft-restarted — reset session without closing socket
					const session: BingoSession = {
						board: msg.board,
						settings: msg.settings ?? { mode: 'lockout', boardSize: msg.board.size as 3 | 4 | 5, difficulty: msg.board.difficulty, winCondition: 3, lines: { rows: true, columns: true, diagonals: true }, requireQueueAfterGame: false, timer: { enabled: false, durationMinutes: 60 }, twitchEnabled: false, twitchChannel: '' },
						startedAt: Date.now(),
						localPlayerIndex: this.localPlayerIndex,
						role: 'guest',
						opponentConnected: true,
						localName: this.localPlayerName,
						opponentName: msg.playerName ?? null,
					};
					// Preserve the peer socket through startSession (same pattern as host restart)
					const savedPeer = this.peerSocket;
					this.peerSocket = null;
					this.startSession(session);
					this.peerSocket = savedPeer;
					this.lobby = null;
					this.messageHandler.sendMessage('BingoLobbyState', null);
				} else if (msg.type === 'BingoComplete' && msg.instanceId) {
					this.applyOpponentCompletion(msg.instanceId);
				} else if (msg.type === 'BingoSync' && msg.board) {
					this.applyHostBoard(msg.board);
				} else if (msg.type === 'OpponentFrame' && msg.opponent) {
					this.messageHandler.sendMessage('OpponentGameState', msg.opponent as Parameters<MessageEvents['OpponentGameState']>[0]);
				}
			} catch (err) {
				this.log.error('Bingo peer message error:', err);
			}
		});

		ws.on('close', () => {
			if (this.peerSocket === ws) {
				this.peerSocket = null;
				if (this.lobby) {
					this.lobby = null;
					this.messageHandler.sendMessage('BingoLobbyState', null);
				} else {
					this.updatePeerConnected(false);
				}
			}
		});

		ws.on('error', (err) => {
			this.log.error('Bingo peer connect error:', err);
			this.peerSocket = null;
		});
	}

	private applyOpponentCompletion(instanceId: string) {
		if (!this.session) return;
		const tile = this.session.board.tiles.find((b) => b.instanceId === instanceId);
		const isExclusive = this.session.settings.winCondition === 'lockout' || this.session.settings.winCondition === 'rowcontrol';

		if (tile) {
			if (isExclusive && tile.completedBy) {
				// Exclusive mode: tile already taken — reject silently, send authoritative board back
			} else if (!tile.completedBy) {
				tile.completed = true;
				tile.completedBy = 'opponent';
				tile.progress = tile.target;
				this.opponentCompletedTiles.add(instanceId);
				this.sendChallengeUpdates([{ instanceId, progress: tile.target, completed: true, completedBy: 'opponent' }]);
			} else if (!isExclusive && tile.completedBy === 'local') {
				// Non-exclusive: both players completed the same tile
				tile.completedBy = 'both';
				this.opponentCompletedTiles.add(instanceId);
				this.sendChallengeUpdates([{ instanceId, progress: tile.target, completed: true, completedBy: 'both' }]);
			}
		}
		this.sendBoardToPeer(this.session.board);
	}

	private applyHostBoard(board: BingoSession['board']) {
		if (!this.session) return;
		this.session.board = board;
		this.sendBingoState();
	}

	private updatePeerConnected(connected: boolean) {
		if (!this.session) return;
		this.session.opponentConnected = connected;
		this.sendBingoState();
	}

	private sendCompletionToPeer(instanceId: string) {
		if (this.peerSocket?.readyState === WebSocket.OPEN) {
			this.peerSocket.send(JSON.stringify({ type: 'BingoComplete', instanceId }));
		}
	}

	// Send authoritative board to peer with completedBy flipped to their perspective
	private sendBoardToPeer(board: BingoSession['board']) {
		if (this.peerSocket?.readyState !== WebSocket.OPEN) return;
		const guestBoard = {
			...board,
			tiles: board.tiles.map((tile) => ({
				...tile,
				completedBy: tile.completedBy === 'local' ? 'opponent'
					: tile.completedBy === 'opponent' ? 'local'
						: tile.completedBy === 'both' ? 'both'
							: null,
			})),
		};
		this.peerSocket.send(JSON.stringify({ type: 'BingoSync', board: guestBoard }));
	}

	private versionsCompatible(a: string, b: string): boolean {
		const [aMaj, aMin] = a.split('.').map(Number);
		const [bMaj, bMin] = b.split('.').map(Number);
		return aMaj === bMaj && aMin === bMin;
	}

	// ── Game tracking ─────────────────────────────────────────────────────────

	private resetGameState() {
		this.effectiveLocalIndex = null;
		this.currentGameLocalCharId = -1;
		this.peakOpponentPercent = 0;
		this.zerodeathAttempt = null;
		this.gameSpikesThisGame = 0;
		this.gameKillMoveCategories = new Set();
		this.gameBlastZoneKills = new Map();
		this.gameDurationFrames = 0;
		this.prevFramePercents = new Map();
		this.prevFrameStocks = new Map();
		this.myDamageTakenThisGame = 0;
		this.myAirborneFrames = 0;
		this.myTotalGameFrames = 0;
		this.usedSmashThisGame = false;
		this.prevMyLastAttack = 0;
		this.gameKillsPerMove = new Map();
		this.currentTurnipHeldFrames = 0;
	}

	private static readonly DEATH_DIRECTION_MAP: Record<number, string> = {
		0: 'down', 1: 'left', 2: 'right',
		3: 'up', 4: 'star', 5: 'star',
		6: 'screen_ko', 7: 'screen_ko', 8: 'screen_ko', 9: 'screen_ko', 10: 'screen_ko',
	};

	// ── Watch-opponent: stream a slimmed live game state to the peer ──────────────

	/** Throttled (~30fps) stream of this player's game to the peer for live viewing. */
	private streamFrameToPeer(frame: FrameEntryType) {
		if (this.peerSocket?.readyState !== WebSocket.OPEN) return;
		const now = Date.now();
		if (now - this.lastOpponentStreamAt < 33) return;
		this.lastOpponentStreamAt = now;
		try {
			this.peerSocket.send(JSON.stringify({
				type: 'OpponentFrame',
				opponent: {
					settings: this.slimSettings(this.latestGameSettings),
					frame: this.slimFrame(frame),
					score: this.latestGameScore,
				},
			} satisfies BingoPeerMessage));
		} catch { /* ignore */ }
	}

	/** Keep only the settings fields the live viewer needs. */
	private slimSettings(s: GameStartType | null) {
		if (!s) return null;
		return {
			stageId: s.stageId,
			isTeams: s.isTeams ?? false,
			startingTimerSeconds: s.startingTimerSeconds ?? 480,
			players: (s.players ?? []).filter(Boolean).map((p) => ({
				playerIndex: p.playerIndex, characterId: p.characterId, teamId: p.teamId ?? null,
			})),
		};
	}

	/** Strip the frame down to just what GameStateRender + LiveHud read, rounding floats. */
	private slimFrame(frame: FrameEntryType) {
		const r = (n: number | null | undefined) => (n == null ? n : Math.round(n * 100) / 100);
		const players: Record<number, unknown> = {};
		for (const [idx, p] of Object.entries(frame.players)) {
			const post = p?.post;
			if (!post) continue;
			const pre = p?.pre;
			players[Number(idx)] = {
				post: {
					playerIndex: post.playerIndex, internalCharacterId: post.internalCharacterId,
					actionStateId: post.actionStateId, actionStateCounter: r(post.actionStateCounter),
					positionX: r(post.positionX), positionY: r(post.positionY), facingDirection: post.facingDirection,
					shieldSize: r(post.shieldSize), lCancelStatus: post.lCancelStatus,
					hurtboxCollisionState: post.hurtboxCollisionState, percent: r(post.percent),
					stocksRemaining: post.stocksRemaining,
				},
				pre: pre ? { joystickX: r(pre.joystickX), joystickY: r(pre.joystickY), trigger: r(pre.trigger) } : undefined,
			};
		}
		const items = (frame.items ?? []).map((it) => ({
			typeId: it.typeId, state: it.state, facingDirection: it.facingDirection,
			velocityX: r(it.velocityX), velocityY: r(it.velocityY), positionX: r(it.positionX), positionY: r(it.positionY),
			missileType: it.missileType, turnipFace: it.turnipFace, chargePower: it.chargePower, owner: it.owner, spawnId: it.spawnId,
		}));
		const stageEvents = (frame.stageEvents ?? [])
			.map((e) => e as { platform?: number | null; height?: number | null })
			.filter((e) => e && e.platform != null && e.height != null)
			.map((e) => ({ platform: e.platform, height: r(e.height) }));
		return { frame: frame.frame, players, items, stageEvents };
	}

	private processGameFrame(frame: FrameEntryType) {
		const frameNum = frame.frame ?? 0;
		if (frameNum > 0) this.gameDurationFrames = frameNum;

		const myIdx = this.effectiveLocalIndex;
		const oppIdx = this.opponentPlayerIndex;
		if (myIdx == null || oppIdx == null) return;

		const myPost = frame.players[myIdx]?.post;
		const oppPost = frame.players[oppIdx]?.post;
		if (!myPost || !oppPost) return;

		const oppPercent = oppPost.percent ?? 0;
		const myPercent = myPost.percent ?? 0;
		const prevMyPercent = this.prevFramePercents.get(myIdx) ?? myPercent;
		const prevOppPercent = this.prevFramePercents.get(oppIdx) ?? oppPercent;

		if (oppPercent > this.peakOpponentPercent) {
			this.peakOpponentPercent = oppPercent;
		}

		const oppStocks = oppPost.stocksRemaining ?? 0;
		const prevOppStocks = this.prevFrameStocks.get(oppIdx) ?? oppStocks;
		const oppStockLost = oppStocks < prevOppStocks;

		if (oppStockLost) {
			const stateId = oppPost.actionStateId ?? -1;
			const direction = BingoService.DEATH_DIRECTION_MAP[stateId] ?? null;

			const killedByMe = oppPost.lastHitBy === myIdx;
			const moveId = myPost.lastAttackLanded ?? null;
			if (killedByMe && moveId != null) {
				const cat = getMoveCategory(moveId);
				this.sessionKillsByMove.set(cat, (this.sessionKillsByMove.get(cat) ?? 0) + 1);
				this.gameKillMoveCategories.add(cat);
				this.gameKillsPerMove.set(cat, (this.gameKillsPerMove.get(cat) ?? 0) + 1);
				if (direction === 'down') {
					this.sessionSpikeMoveCategories.add(cat);
				}
				// Jigglypuff (15) rest kill: down_b while playing as Puff
				if (cat === 'down_b' && this.currentGameLocalCharId === 15) {
					this.sessionRestKills++;
				}
				// Captain Falcon (0) Falcon Punch kill: neutral_b
				if (cat === 'neutral_b' && this.currentGameLocalCharId === 0) {
					this.sessionFalconPunchKills++;
				}
				// G&W (3) Judge kill: side_b (any Judge outcome including 9)
				if (cat === 'side_b' && this.currentGameLocalCharId === 3) {
					this.sessionGwmJudgeKills++;
				}
			}

			this.handleOpponentStockLost(direction);
		}

		if (prevOppPercent === 0 && oppPercent > 0 && !this.zerodeathAttempt) {
			this.zerodeathAttempt = { opponentIndex: oppIdx, startFrame: frameNum, damageTaken: 0 };
		}

		const myDamageThisFrame = Math.max(0, myPercent - prevMyPercent);
		this.myDamageTakenThisGame += myDamageThisFrame;

		// Per-game tracking for execution challenges
		if (frameNum > 0) {
			this.myTotalGameFrames++;
			if (myPost.isAirborne) this.myAirborneFrames++;
			const myLastAttack = myPost.lastAttackLanded ?? 0;
			if (myLastAttack !== this.prevMyLastAttack && (myLastAttack === 10 || myLastAttack === 11 || myLastAttack === 12)) {
				this.usedSmashThisGame = true; // fsmash (10), usmash (11), or dsmash (12) landed
			}
			// Yoshi (17) egg lay: neutral_b (18) connection
			if (this.currentGameLocalCharId === 17 && myLastAttack !== this.prevMyLastAttack && myLastAttack === 18) {
				this.sessionEggLays++;
				this.checkChallenges();
			}
			this.prevMyLastAttack = myLastAttack;
		}

		if (this.zerodeathAttempt) {
			if (myDamageThisFrame > 0) {
				this.zerodeathAttempt = null;
			} else if (oppStockLost) {
				this.sessionZeroDeaths++;
				this.zerodeathAttempt = null;
				this.checkChallenges();
			}
		}

		this.prevFramePercents.set(myIdx, myPercent);
		this.prevFramePercents.set(oppIdx, oppPercent);
		this.prevFrameStocks.set(oppIdx, oppStocks);

		// Peach (12) turnip hold: track consecutive frames holding a turnip
		if (this.currentGameLocalCharId === 12 && !this.sessionTurnipHeld && (frame as any).items?.length) {
			const holding = (frame as any).items.some(
				(item: any) => item.turnipFace !== null && item.owner === myIdx
			);
			if (holding) {
				this.currentTurnipHeldFrames++;
				if (this.currentTurnipHeldFrames >= 1200) this.sessionTurnipHeld = true;
			} else {
				this.currentTurnipHeldFrames = 0;
			}
		}
	}

	private handleOpponentStockLost(direction: string | null) {
		if (!this.session) return;
		if (direction === 'left' || direction === 'right') {
			this.sessionBlastZoneKills.set(direction, (this.sessionBlastZoneKills.get(direction) ?? 0) + 1);
			this.gameBlastZoneKills.set(direction, (this.gameBlastZoneKills.get(direction) ?? 0) + 1);
		}
		if (direction === 'star') {
			this.sessionStarKOs++;
			this.gameBlastZoneKills.set('star', (this.gameBlastZoneKills.get('star') ?? 0) + 1);
		}
		if (direction === 'screen_ko') {
			this.sessionScreenKOs++;
			this.gameBlastZoneKills.set('screen_ko', (this.gameBlastZoneKills.get('screen_ko') ?? 0) + 1);
		}
		if (direction === 'down') {
			this.sessionSpikeKills++;
			this.gameSpikesThisGame++;
			this.gameBlastZoneKills.set('down', (this.gameBlastZoneKills.get('down') ?? 0) + 1);
		}
		this.checkChallenges();
	}

	private reapplyOpponentCompletions(): void {
		if (!this.session) return;
		for (const instanceId of this.opponentCompletedTiles) {
			const tile = this.session.board.tiles.find(b => b.instanceId === instanceId);
			if (!tile) continue;
			if (!tile.completedBy) {
				tile.completed = true;
				tile.completedBy = 'opponent';
				tile.progress = tile.target;
			} else if (tile.completedBy === 'local') {
				tile.completedBy = 'both';
			}
		}
	}

	private applyProgressRevert(message: string): void {
		if (!this.revertEnabled) {
			this.resetGameState();
			this.messageHandler.sendMessage('Notification', message, NotificationType.Warning, 5000);
			this.messageHandler.sendMessage('BingoRevert', message);
			return;
		}
		if (this.sessionSnapshot && this.session) {
			const preRevert = new Map(
				this.session.board.tiles.map(b => [b.instanceId, { progress: b.progress, completed: b.completed, completedBy: b.completedBy }])
			);
			this.restoreSessionSnapshot(this.sessionSnapshot);
			this.reapplyOpponentCompletions();
			this.winStreak = 0;
			this.resetGameState();
			const revertUpdates: BingoChallengeUpdate[] = [];
			for (const tile of this.session.board.tiles) {
				const pre = preRevert.get(tile.instanceId);
				if (!pre) continue;
				if (tile.progress !== pre.progress || tile.completed !== pre.completed || tile.completedBy !== pre.completedBy) {
					revertUpdates.push({
						instanceId: tile.instanceId,
						progress: tile.progress,
						completed: tile.completed,
						completedBy: tile.completedBy ?? undefined,
					});
				}
			}
			if (revertUpdates.length) {
				this.sendChallengeUpdates(revertUpdates, true);
			}
		} else {
			this.resetGameState();
		}
		this.messageHandler.sendMessage('Notification', message, NotificationType.Warning, 5000);
		this.messageHandler.sendMessage('BingoRevert', message);
	}

	private processGameEnd(game: GameStats) {
		if (!this.session) return;

		const myIdx = this.effectiveLocalIndex;
		const oppIdx = this.opponentPlayerIndex;
		const stats = game.postGameStats as StatsType | null;
		const settings = game.settings;

		if (myIdx == null || oppIdx == null || !stats) return;

		const gameId = settings?.matchInfo?.matchId ?? null;
		if (gameId && gameId === this.lastWarmupGameId) return;

		// Offline: findCurrentGameStats can load wrong replay (same randomSeed). Compare replay's
		// last frame against live frame count — mismatch > 30s means wrong file was loaded.
		const isOfflineGame = !gameId;
		if (isOfflineGame && this.gameDurationFrames > 0) {
			const replayLastFrame = game.lastFrame?.frame ?? -1;
			if (replayLastFrame >= 0 && Math.abs(replayLastFrame - this.gameDurationFrames) > 1800) {
				this.log.warn(`Bingo: offline replay mismatch (replay=${replayLastFrame}, live=${this.gameDurationFrames}) — skipping`);
				this.resetGameState();
				return;
			}
		}

		const myFinalStocks = game.lastFrame?.players?.[myIdx]?.post?.stocksRemaining ?? 0;
		const oppFinalStocks = game.lastFrame?.players?.[oppIdx]?.post?.stocksRemaining ?? 0;
		const didWin = myFinalStocks > 0 && oppFinalStocks === 0;

		// If local player quit mid-game (LRAS without winning), revert game-accumulated session state
		const isLocalQuit = game.gameEnd?.gameEndMethod === GameEndMethod.NO_CONTEST
			&& game.gameEnd?.lrasInitiatorIndex === myIdx
			&& !didWin;
		if (isLocalQuit) {
			this.applyProgressRevert('LRAS Detected — reverting progress');
			return;
		}

		// Detect aggressive SD'ing: 2+ stocks lost at ≤5% within 900 frames (~15s) of each other
		if (!didWin) {
			const myStockDeaths = (stats.stocks ?? [])
				.filter(s => s.playerIndex === myIdx && s.endPercent != null && s.endPercent <= 5 && s.endFrame != null)
				.sort((a, b) => (a.endFrame ?? 0) - (b.endFrame ?? 0));
			for (let i = 1; i < myStockDeaths.length; i++) {
				if ((myStockDeaths[i].endFrame ?? 0) - (myStockDeaths[i - 1].endFrame ?? 0) <= 900) {
					this.log.warn('Bingo: aggressive SD detected — reverting progress');
					this.applyProgressRevert('SD Detected — reverting progress');
					return;
				}
			}
		}
		const rawCharId = settings?.players?.find(p => p.playerIndex === myIdx)?.characterId ?? -1;
		// Sheik (19) and Zelda (18) are the same character slot in Slippi
		const myCharacterId = rawCharId === 19 ? 18 : rawCharId;

		if (didWin) {
			this.winStreak++;
			this.sessionTotalWins++;
			if (myCharacterId >= 0) {
				this.characterWins.set(myCharacterId, (this.characterWins.get(myCharacterId) ?? 0) + 1);
			}
			if (myFinalStocks === 4) this.sessionFourStocks++;
		} else {
			this.winStreak = 0;
		}

		const myActionCounts = stats.actionCounts?.find((a) => a.playerIndex === myIdx);
		let myApm: number | null = null;
		if (myActionCounts) {
			const { success, fail } = myActionCounts.lCancelCount;
			const total = success + fail;
			if (total >= 5) {
				const rate = success / total;
				const required = this.getLCancelRateRequired();
				if (rate >= required) this.sessionLCancelGames++;
			}
			this.sessionWallTechs += myActionCounts.wallTechCount?.success ?? 0;
			const inputTotal = (myActionCounts as any).inputCounts?.total as number | undefined;
			if (inputTotal != null && this.gameDurationFrames > 0) {
				myApm = inputTotal / (this.gameDurationFrames / 3600);
			}
		}

		// Edgeguard stats computed by enrichPostGameStats from game frames
		type EdgeGuardStats = { totalAttempts: number; successfulAttempts: number };
		const extOverall = (stats as any).overall as Array<{ playerIndex: number; edgeGuard?: EdgeGuardStats }> | undefined;
		const myEdgeguard = extOverall?.find(o => o.playerIndex === myIdx)?.edgeGuard;
		if (myEdgeguard) {
			this.sessionEdgeguardAttempts += myEdgeguard.totalAttempts;
			this.sessionEdgeguardSuccesses += myEdgeguard.successfulAttempts;
		}

		const myOverall = stats.overall?.find((o) => o.playerIndex === myIdx);
		const totalDamage = myOverall?.totalDamage ?? 0;

		const oppStocksData = stats.stocks?.filter((s) => s.playerIndex === oppIdx) ?? [];
		for (const stock of oppStocksData) {
			if (stock.endPercent != null && stock.endPercent <= this.getStocksUnderPercentThreshold()) {
				this.sessionStocksUnderPercent++;
			}
		}

		// Best single combo damage this game (from PostGame conversions)
		const conversions: Array<{ playerIndex: number; startPercent: number; currentPercent: number }> =
			(stats as any).conversions ?? [];
		const bestComboDamage = conversions
			.filter(c => c.playerIndex === oppIdx)
			.reduce((max, c) => Math.max(max, (c.currentPercent ?? 0) - (c.startPercent ?? 0)), 0);

		const durationSeconds = this.gameDurationFrames / 60;

		this.sessionBestSpikeGame = Math.max(this.sessionBestSpikeGame, this.gameSpikesThisGame);

		this.updateAllChallenges({ didWin, myCharacterId, totalDamage, durationSeconds, bestComboDamage, myApm });
	}

	private getLCancelRateRequired(): number {
		if (!this.session) return 0.9;
		const tile = this.session.board.tiles.find((b) => b.challengeId === 'lcancel_rate' && !b.completed);
		if (!tile) return 0.9;
		return (tile.params.percent ?? 90) / 100;
	}

	private getStocksUnderPercentThreshold(): number {
		if (!this.session) return 40;
		const tile = this.session.board.tiles.find((b) => b.challengeId === 'stocks_under_percent' && !b.completed);
		return tile?.params.percent ?? 40;
	}

	private updateAllChallenges(ctx: {
		didWin: boolean;
		myCharacterId: number;
		totalDamage: number;
		durationSeconds: number;
		bestComboDamage?: number;
		myApm?: number | null;
	}) {
		if (!this.session) return;
		const updates: BingoChallengeUpdate[] = [];

		const isExclusive = this.session.settings.winCondition === 'lockout' || this.session.settings.winCondition === 'rowcontrol';
		for (const tile of this.session.board.tiles) {
			if (tile.completedBy === 'local' || tile.completedBy === 'both') continue;
			if (isExclusive && tile.completedBy === 'opponent') continue;
			if (tile.frozen && !tile.frozenForOpponent) continue;
			const prev = tile.progress;
			let next = prev;

			switch (tile.challengeId) {
				case 'win_with_character':
					if (ctx.didWin && tile.params.characterId === ctx.myCharacterId) {
						next = this.characterWins.get(ctx.myCharacterId) ?? 0;
					}
					break;
				case 'win_in_a_row':
					next = Math.min(this.winStreak, tile.target);
					break;
				case 'win_games_total':
					next = this.sessionTotalWins;
					break;
				case 'four_stock_opponent':
					next = this.sessionFourStocks;
					break;
				case 'zero_death':
					next = this.sessionZeroDeaths;
					break;
				case 'win_under_90s':
					if (ctx.didWin && ctx.durationSeconds < 90) next = 1;
					break;
				case 'deal_damage_game':
					if (ctx.totalDamage >= (tile.params.percent ?? 300)) next = tile.target;
					break;
				case 'opponent_reach_percent':
					if (this.peakOpponentPercent >= (tile.params.percent ?? 150)) next = 1;
					break;
				case 'stocks_under_percent':
					next = this.sessionStocksUnderPercent;
					break;
				case 'spike_meteor_total':
					next = this.sessionSpikeKills;
					break;
				case 'spike_meteor_single_game':
					next = Math.max(this.sessionBestSpikeGame, this.gameSpikesThisGame);
					break;
				case 'spike_diverse_moves':
					next = this.sessionSpikeMoveCategories.size;
					break;
				case 'kill_per_stock_diverse':
					next = this.gameKillMoveCategories.size;
					// don't mark complete until the game ends with a win
					if (next >= tile.target && !ctx.didWin) next = tile.target - 1;
					break;
				case 'kill_fsmash': next = this.sessionKillsByMove.get('fsmash') ?? 0; break;
				case 'kill_usmash': next = this.sessionKillsByMove.get('usmash') ?? 0; break;
				case 'kill_nair': next = this.sessionKillsByMove.get('nair') ?? 0; break;
				case 'kill_fair': next = this.sessionKillsByMove.get('fair') ?? 0; break;
				case 'kill_bair': next = this.sessionKillsByMove.get('bair') ?? 0; break;
				case 'kill_uair': next = this.sessionKillsByMove.get('uair') ?? 0; break;
				case 'kill_dair': next = this.sessionKillsByMove.get('dair') ?? 0; break;
				case 'kill_neutral_b': next = this.sessionKillsByMove.get('neutral_b') ?? 0; break;
				case 'kill_side_b': next = this.sessionKillsByMove.get('side_b') ?? 0; break;
				case 'kill_up_b': next = this.sessionKillsByMove.get('up_b') ?? 0; break;
				case 'kill_throw':
					next = (this.sessionKillsByMove.get('throw') ?? 0) >= 1 ? 1 : 0;
					break;
				case 'blast_zone_direction': {
					const dir = tile.params.direction ?? 'left';
					next = this.sessionBlastZoneKills.get(dir) ?? 0;
					break;
				}
				case 'star_ko':
					next = this.sessionStarKOs;
					break;
				case 'screen_ko':
					next = this.sessionScreenKOs;
					break;
				case 'same_blast_zone_game': {
					const maxSide = Math.max(...this.gameBlastZoneKills.values(), 0);
					if (maxSide >= tile.target) next = tile.target;
					break;
				}
				case 'all_blast_zones_game': {
					const hasLeft = (this.gameBlastZoneKills.get('left') ?? 0) > 0;
					const hasRight = (this.gameBlastZoneKills.get('right') ?? 0) > 0;
					const hasDown = (this.gameBlastZoneKills.get('down') ?? 0) > 0;
					const hasUp = (this.gameBlastZoneKills.get('star') ?? 0) > 0
						|| (this.gameBlastZoneKills.get('screen_ko') ?? 0) > 0;
					next = [hasLeft, hasRight, hasDown, hasUp].filter(Boolean).length;
					break;
				}
				case 'lcancel_rate':
					next = this.sessionLCancelGames;
					break;
				case 'wall_tech':
					next = this.sessionWallTechs;
					break;
				case 'win_low_damage':
					if (ctx.didWin && this.myDamageTakenThisGame < (tile.params.percent ?? 100)) next = 1;
					break;
				case 'combo_damage':
					if ((ctx.bestComboDamage ?? 0) >= (tile.params.percent ?? 50)) next = 1;
					break;
				case 'airborne_win': {
					if (ctx.didWin && this.myTotalGameFrames > 0) {
						const ratio = this.myAirborneFrames / this.myTotalGameFrames;
						if (ratio >= (tile.params.percent ?? 60) / 100) next = 1;
					}
					break;
				}
				case 'same_move_kills': {
					const maxSameMove = Math.max(...this.gameKillsPerMove.values(), 0);
					next = maxSameMove;
					if (next >= tile.target && !ctx.didWin) next = tile.target - 1;
					break;
				}
				case 'no_smash_win':
					if (ctx.didWin && !this.usedSmashThisGame) next = 1;
					break;
				case 'win_low_apm':
					if (ctx.didWin && ctx.myApm != null && ctx.myApm < (tile.params.percent ?? 150)) next = 1;
					break;
				case 'edgeguard_rate': {
					const attempts = this.sessionEdgeguardAttempts;
					const required = (tile.params.percent ?? 50) / 100;
					if (attempts >= 3 && this.sessionEdgeguardSuccesses / attempts >= required) next = 1;
					break;
				}
				case 'win_high_apm':
					if (ctx.didWin && ctx.myApm != null && ctx.myApm > (tile.params.percent ?? 350)) next = 1;
					break;
				case 'win_low_damage_dealt':
					if (ctx.didWin && ctx.totalDamage < (tile.params.percent ?? 150)) next = 1;
					break;
				case 'rest_kill':
					if (this.sessionRestKills >= 1) next = 1;
					break;
				case 'falcon_punch_kill':
					if (this.sessionFalconPunchKills >= 1) next = 1;
					break;
				case 'gwm_judge_kill':
					if (this.sessionGwmJudgeKills >= 1) next = 1;
					break;
				case 'peach_turnip_hold':
					if (this.sessionTurnipHeld) next = 1;
					break;
				case 'yoshi_egg_lay':
					next = this.sessionEggLays;
					break;
			}

			if (next !== prev || next >= tile.target) {
				tile.progress = Math.min(next, tile.target);
				const wasCompleted = tile.completed;
				const prevCompletedBy = tile.completedBy;
				tile.completed = tile.progress >= tile.target;
				if (tile.completed && !wasCompleted) {
					tile.completedBy = 'local';
					this.sendCompletionToPeer(tile.instanceId);
				} else if (tile.completed && wasCompleted && prevCompletedBy === 'opponent') {
					tile.completedBy = 'both';
					this.sendCompletionToPeer(tile.instanceId);
				}
				if (tile.completed !== wasCompleted || next !== prev || tile.completedBy !== prevCompletedBy) {
					updates.push({ instanceId: tile.instanceId, progress: tile.progress, completed: tile.completed, completedBy: tile.completedBy ?? undefined });
				}
			}
		}

		if (updates.length > 0) {
			this.sendChallengeUpdates(updates);
		}
	}

	private checkChallenges() {
		this.updateAllChallenges({
			didWin: false,
			myCharacterId: -1,
			totalDamage: 0,
			durationSeconds: 0,
		});
	}

	markLastGameWarmup() {
		if (this.lastGameWasWin) {
			this.winStreak = Math.max(0, this.winStreak - 1);
		}
	}

	private startSession(session: BingoSession) {
		this.closePeerConnection();
		session.localName = this.localPlayerName;
		this.session = session;
		this.resetGameState();
		this.resetSessionAccumulators();
		this.opponentCompletedTiles.clear();
		this.localPlayerIndex = session.localPlayerIndex;
		this.log.info(`Bingo session started: ${session.board.id}, role: ${session.role}`);
		this.sendBingoState();

		if (session.settings.twitchEnabled && session.settings.twitchChannel) {
			const isMultiplayer = session.role === 'host' || session.role === 'guest';
			const localHasTwitch = !!this.settingsStore.getTwitchUsername();
			const opponentHasTwitch = !isMultiplayer || !!this.opponentTwitchUsername;
			if (localHasTwitch && opponentHasTwitch) {
				this.twitchChatService.connect(session.settings.twitchChannel);
				if (isMultiplayer && this.opponentTwitchUsername) {
					this.twitchChatService.connectSecond(this.opponentTwitchUsername);
				}
				this.scheduleNextVote();
			} else {
				this.log.info('Bingo: Twitch skipped — both players need a Twitch username set');
				this.messageHandler.sendMessage('Notification', 'Twitch polls disabled — both players must have a Twitch username configured', NotificationType.Warning, 5000);
			}
		}
	}

	private resetSessionAccumulators() {
		this.sessionKillsByMove.clear();
		this.sessionWallTechs = 0;
		this.sessionStarKOs = 0;
		this.sessionScreenKOs = 0;
		this.sessionSpikeKills = 0;
		this.sessionSpikeMoveCategories.clear();
		this.sessionBlastZoneKills.clear();
		this.sessionStocksUnderPercent = 0;
		this.sessionZeroDeaths = 0;
		this.sessionFourStocks = 0;
		this.sessionLCancelGames = 0;
		this.sessionTotalWins = 0;
		this.sessionBestSpikeGame = 0;
		this.sessionEdgeguardAttempts = 0;
		this.sessionEdgeguardSuccesses = 0;
		this.sessionRestKills = 0;
		this.sessionFalconPunchKills = 0;
		this.sessionGwmJudgeKills = 0;
		this.sessionTurnipHeld = false;
		this.sessionEggLays = 0;
		this.winStreak = 0;
		this.characterWins.clear();
	}

	private takeSessionSnapshot(): SessionSnapshot {
		return {
			sessionKillsByMove: new Map(this.sessionKillsByMove),
			sessionWallTechs: this.sessionWallTechs,
			sessionStarKOs: this.sessionStarKOs,
			sessionScreenKOs: this.sessionScreenKOs,
			sessionSpikeKills: this.sessionSpikeKills,
			sessionSpikeMoveCategories: new Set(this.sessionSpikeMoveCategories),
			sessionBlastZoneKills: new Map(this.sessionBlastZoneKills),
			sessionStocksUnderPercent: this.sessionStocksUnderPercent,
			sessionZeroDeaths: this.sessionZeroDeaths,
			sessionFourStocks: this.sessionFourStocks,
			sessionLCancelGames: this.sessionLCancelGames,
			sessionTotalWins: this.sessionTotalWins,
			sessionBestSpikeGame: this.sessionBestSpikeGame,
			sessionEdgeguardAttempts: this.sessionEdgeguardAttempts,
			sessionEdgeguardSuccesses: this.sessionEdgeguardSuccesses,
			sessionRestKills: this.sessionRestKills,
			sessionFalconPunchKills: this.sessionFalconPunchKills,
			sessionGwmJudgeKills: this.sessionGwmJudgeKills,
			sessionTurnipHeld: this.sessionTurnipHeld,
			sessionEggLays: this.sessionEggLays,
			winStreak: this.winStreak,
			characterWins: new Map(this.characterWins),
			tileStates: new Map(
				(this.session?.board.tiles ?? []).map(b => [
					b.instanceId,
					{ progress: b.progress, completed: b.completed, completedBy: b.completedBy },
				])
			),
		};
	}

	private restoreSessionSnapshot(s: SessionSnapshot) {
		this.sessionKillsByMove = new Map(s.sessionKillsByMove);
		this.sessionWallTechs = s.sessionWallTechs;
		this.sessionStarKOs = s.sessionStarKOs;
		this.sessionScreenKOs = s.sessionScreenKOs;
		this.sessionSpikeKills = s.sessionSpikeKills;
		this.sessionSpikeMoveCategories = new Set(s.sessionSpikeMoveCategories);
		this.sessionBlastZoneKills = new Map(s.sessionBlastZoneKills);
		this.sessionStocksUnderPercent = s.sessionStocksUnderPercent;
		this.sessionZeroDeaths = s.sessionZeroDeaths;
		this.sessionFourStocks = s.sessionFourStocks;
		this.sessionLCancelGames = s.sessionLCancelGames;
		this.sessionTotalWins = s.sessionTotalWins;
		this.sessionBestSpikeGame = s.sessionBestSpikeGame;
		this.sessionEdgeguardAttempts = s.sessionEdgeguardAttempts;
		this.sessionEdgeguardSuccesses = s.sessionEdgeguardSuccesses;
		this.sessionRestKills = s.sessionRestKills;
		this.sessionFalconPunchKills = s.sessionFalconPunchKills;
		this.sessionGwmJudgeKills = s.sessionGwmJudgeKills;
		this.sessionTurnipHeld = s.sessionTurnipHeld;
		this.sessionEggLays = s.sessionEggLays;
		this.winStreak = s.winStreak;
		this.characterWins = new Map(s.characterWins);
		if (this.session) {
			for (const tile of this.session.board.tiles) {
				const saved = s.tileStates.get(tile.instanceId);
				if (!saved) continue;
				tile.progress = saved.progress;
				tile.completed = saved.completed;
				tile.completedBy = saved.completedBy;
			}
		}
	}

	getSession() {
		return this.session;
	}

	getVoteState() {
		const host = this.voteStates.get('host') ?? null;
		const guest = this.voteStates.get('guest') ?? null;
		return (host || guest) ? { host, guest } : null;
	}

	getLobby() {
		return this.lobby;
	}

	private stopSession() {
		this.closePeerConnection();
		this.stopVote();
		this.clearFrozenTimers();
		this.twitchChatService.disconnect();
		this.twitchChatService.disconnectSecond();
		this.opponentTwitchUsername = null;
		this.lobby = null;
		this.session = null;
		if (this.messageHandler.lobbyGame === 'bingo') this.messageHandler.lobbyGame = null;
		this.messageHandler.sendMessage('BingoLobbyState', null);
		this.messageHandler.sendMessage('BingoState', { session: null });
		this.messageHandler.sendMessage('BingoVoteState', null);
	}

	private closePeerConnection() {
		if (this.peerSocket && this.peerSocket.readyState === WebSocket.OPEN) {
			this.peerSocket.close();
		}
		this.peerSocket = null;
	}

	// ── Twitch vote system ────────────────────────────────────────────────────

	private getWinTileIndices(filter: (b: BingoTile) => boolean): Set<number> {
		if (!this.session) return new Set();
		const tiles = this.session.board.tiles;
		const size = this.session.board.size;
		const done = new Set(tiles.map((b, i) => (filter(b) ? i : -1)).filter(i => i >= 0));
		const win = new Set<number>();
		for (let r = 0; r < size; r++) {
			const row = Array.from({ length: size }, (_, c) => r * size + c);
			if (row.every(i => done.has(i))) row.forEach(i => win.add(i));
		}
		for (let c = 0; c < size; c++) {
			const col = Array.from({ length: size }, (_, r) => r * size + c);
			if (col.every(i => done.has(i))) col.forEach(i => win.add(i));
		}
		const d1 = Array.from({ length: size }, (_, i) => i * size + i);
		if (d1.every(i => done.has(i))) d1.forEach(i => win.add(i));
		const d2 = Array.from({ length: size }, (_, i) => i * size + (size - 1 - i));
		if (d2.every(i => done.has(i))) d2.forEach(i => win.add(i));
		return win;
	}

	private computeWinState(): BingoWinState | null {
		if (!this.session) return null;
		const tiles = this.session.board.tiles;
		const size = this.session.board.size;
		const wc = this.session.settings.winCondition;
		const isSolo = this.session.role === 'solo';

		const localFilter = (b: BingoTile) => b.completedBy === 'local' || b.completedBy === 'both';
		const oppFilter = (b: BingoTile) => b.completedBy === 'opponent' || b.completedBy === 'both';

		const getLineWinIndices = (filter: (b: BingoTile) => boolean): number[] => {
			const done = new Set(tiles.map((b, i) => filter(b) ? i : -1).filter(i => i >= 0));
			const win = new Set<number>();
			for (let r = 0; r < size; r++) {
				const row = Array.from({ length: size }, (_, c) => r * size + c);
				if (row.every(i => done.has(i))) row.forEach(i => win.add(i));
			}
			for (let c = 0; c < size; c++) {
				const col = Array.from({ length: size }, (_, r) => r * size + c);
				if (col.every(i => done.has(i))) col.forEach(i => win.add(i));
			}
			const d1 = Array.from({ length: size }, (_, i) => i * size + i);
			if (d1.every(i => done.has(i))) d1.forEach(i => win.add(i));
			const d2 = Array.from({ length: size }, (_, i) => i * size + (size - 1 - i));
			if (d2.every(i => done.has(i))) d2.forEach(i => win.add(i));
			return [...win];
		};

		const getControlledLines = (filter: (b: BingoTile) => boolean): { type: 'row' | 'col'; index: number }[] => {
			const required = Math.floor(size / 2) + 1;
			const lines: { type: 'row' | 'col'; index: number }[] = [];
			for (let r = 0; r < size; r++) {
				const line = Array.from({ length: size }, (_, c) => r * size + c);
				if (line.filter(i => filter(tiles[i])).length >= required) lines.push({ type: 'row', index: r });
			}
			for (let c = 0; c < size; c++) {
				const line = Array.from({ length: size }, (_, r) => r * size + c);
				if (line.filter(i => filter(tiles[i])).length >= required) lines.push({ type: 'col', index: c });
			}
			return lines;
		};

		const countLines = (filter: (b: BingoTile) => boolean): number => {
			const done = new Set(tiles.map((b, i) => filter(b) ? i : -1).filter(i => i >= 0));
			let n = 0;
			for (let r = 0; r < size; r++) {
				if (Array.from({ length: size }, (_, c) => r * size + c).every(i => done.has(i))) n++;
			}
			for (let c = 0; c < size; c++) {
				if (Array.from({ length: size }, (_, r) => r * size + c).every(i => done.has(i))) n++;
			}
			if (Array.from({ length: size }, (_, i) => i * size + i).every(i => done.has(i))) n++;
			if (Array.from({ length: size }, (_, i) => i * size + (size - 1 - i)).every(i => done.has(i))) n++;
			return n;
		};

		const countControlled = (filter: (b: BingoTile) => boolean): number => {
			const required = Math.floor(size / 2) + 1;
			let n = 0;
			for (let r = 0; r < size; r++) {
				const line = Array.from({ length: size }, (_, c) => r * size + c);
				if (line.filter(i => filter(tiles[i])).length >= required) n++;
			}
			for (let c = 0; c < size; c++) {
				const line = Array.from({ length: size }, (_, r) => r * size + c);
				if (line.filter(i => filter(tiles[i])).length >= required) n++;
			}
			return n;
		};

		let localWinTileIndices: number[];
		let oppWinTileIndices: number[];
		let localScore: number;
		let oppScore: number;
		let scoreTarget: number;
		let scoreUnit: BingoWinState['scoreUnit'];
		let localWinner: boolean;
		let oppWinner: boolean;

		if (wc === 'lockout') {
			const total = tiles.length;
			scoreTarget = Math.floor(total / 2) + 1;
			scoreUnit = 'tiles';
			localScore = tiles.filter(localFilter).length;
			oppScore = tiles.filter(oppFilter).length;
			localWinner = localScore >= scoreTarget;
			oppWinner = oppScore >= scoreTarget;
			localWinTileIndices = localWinner ? tiles.map((_, i) => i).filter(i => localFilter(tiles[i])) : [];
			oppWinTileIndices = oppWinner ? tiles.map((_, i) => i).filter(i => oppFilter(tiles[i])) : [];
		} else if (wc === 'full') {
			const total = tiles.length;
			scoreTarget = total;
			scoreUnit = 'tiles';
			localScore = tiles.filter(localFilter).length;
			oppScore = tiles.filter(oppFilter).length;
			const allDone = tiles.every(b => b.completed);
			localWinner = allDone && localScore >= oppScore;
			oppWinner = allDone && oppScore > localScore;
			localWinTileIndices = localWinner ? tiles.map((_, i) => i) : [];
			oppWinTileIndices = oppWinner ? tiles.map((_, i) => i) : [];
		} else if (wc === 'rowcontrol') {
			scoreTarget = 3;
			scoreUnit = 'lines';
			localScore = countControlled(localFilter);
			oppScore = countControlled(oppFilter);
			localWinner = localScore >= 3;
			oppWinner = oppScore >= 3;
			localWinTileIndices = [];
			oppWinTileIndices = [];
		} else {
			const n = wc as number;
			scoreTarget = n;
			scoreUnit = 'lines';
			localScore = countLines(localFilter);
			oppScore = countLines(oppFilter);
			localWinner = localScore >= n;
			oppWinner = oppScore >= n;
			localWinTileIndices = getLineWinIndices(localFilter);
			oppWinTileIndices = getLineWinIndices(oppFilter);
		}

		return {
			localWinTileIndices,
			oppWinTileIndices,
			...(wc === 'rowcontrol' ? {
				localControlledLines: getControlledLines(localFilter),
				oppControlledLines: getControlledLines(oppFilter),
			} : {}),
			localScore,
			oppScore: isSolo ? null : oppScore,
			scoreTarget,
			scoreUnit,
			hasWon: localWinner || oppWinner,
			localWinner,
			oppWinner,
		};
	}

	private sendBingoState() {
		if (!this.session) return;
		this.session.winState = this.computeWinState() ?? undefined;
		this.messageHandler.sendMessage('BingoState', { session: this.session });
	}

	private getLockedBoxIndices(): Set<number> {
		if (!this.session) return new Set();
		const wc = this.session.settings.winCondition;
		if (wc === 'rowcontrol') {
			const tiles = this.session.board.tiles;
			const size = this.session.board.size;
			const required = Math.floor(size / 2) + 1;
			const locked = new Set<number>();
			const localFilter = (b: BingoTile) => b.completedBy === 'local' || b.completedBy === 'both';
			const oppFilter = (b: BingoTile) => b.completedBy === 'opponent' || b.completedBy === 'both';
			const check = (line: number[], filter: (b: BingoTile) => boolean) => {
				if (line.filter(i => filter(tiles[i])).length >= required) line.forEach(i => locked.add(i));
			};
			for (let r = 0; r < size; r++) {
				const line = Array.from({ length: size }, (_, c) => r * size + c);
				check(line, localFilter); check(line, oppFilter);
			}
			for (let c = 0; c < size; c++) {
				const line = Array.from({ length: size }, (_, r) => r * size + c);
				check(line, localFilter); check(line, oppFilter);
			}
			return locked;
		}
		const localWin = this.getWinTileIndices(b => b.completedBy === 'local' || b.completedBy === 'both');
		const oppWin = this.getWinTileIndices(b => b.completedBy === 'opponent' || b.completedBy === 'both');
		return new Set([...localWin, ...oppWin]);
	}

	private scheduleNextVote() {
		if (this.voteScheduleTimer) clearTimeout(this.voteScheduleTimer);
		// 3–8 minute random interval
		const delayMs = (Math.floor(Math.random() * 300) + 180) * 1000;
		this.voteScheduleTimer = setTimeout(() => this.tryStartVote(), delayMs);
	}

	private tryStartVote() {
		this.voteScheduleTimer = null;
		if (!this.session?.settings.twitchEnabled) return;
		const localCompleted = this.session.board.tiles.filter(
			b => b.completedBy === 'local' || b.completedBy === 'both'
		).length;
		if (localCompleted < 3) {
			this.voteScheduleTimer = setTimeout(() => this.tryStartVote(), 120000);
			return;
		}
		this.startVote();
	}

	private countOpponentLines(simIdx?: number): number {
		if (!this.session) return 0;
		const tiles = this.session.board.tiles;
		const size = this.session.board.size;
		const wc = this.session.settings.winCondition;
		if (wc === 'lockout' || wc === 'full') return 0;
		const oppAt = (i: number) =>
			tiles[i].completedBy === 'opponent' || tiles[i].completedBy === 'both' || (simIdx !== undefined && i === simIdx);
		if (wc === 'rowcontrol') {
			const required = Math.floor(size / 2) + 1;
			let n = 0;
			for (let r = 0; r < size; r++) {
				const line = Array.from({ length: size }, (_, c) => r * size + c);
				if (line.filter(i => oppAt(i)).length >= required) n++;
			}
			for (let c = 0; c < size; c++) {
				const line = Array.from({ length: size }, (_, r) => r * size + c);
				if (line.filter(i => oppAt(i)).length >= required) n++;
			}
			return n;
		}
		const done = new Set<number>();
		for (let i = 0; i < tiles.length; i++) { if (oppAt(i)) done.add(i); }
		let n = 0;
		for (let r = 0; r < size; r++) {
			if (Array.from({ length: size }, (_, c) => r * size + c).every(i => done.has(i))) n++;
		}
		for (let c = 0; c < size; c++) {
			if (Array.from({ length: size }, (_, r) => r * size + c).every(i => done.has(i))) n++;
		}
		if (Array.from({ length: size }, (_, i) => i * size + i).every(i => done.has(i))) n++;
		if (Array.from({ length: size }, (_, i) => i * size + (size - 1 - i)).every(i => done.has(i))) n++;
		return n;
	}

	private canFreeze(): boolean {
		if (!this.session) return false;
		const locked = this.getLockedBoxIndices();
		const eligible = this.session.board.tiles.filter((b, i) => !b.frozen && !b.completed && !locked.has(i));
		return eligible.length >= 4;
	}

	private canSwap(): boolean {
		if (!this.session) return false;
		const locked = this.getLockedBoxIndices();
		return this.session.board.tiles.filter((b, i) => !b.frozen && !locked.has(i)).length >= 2;
	}

	private buildAllOptions(): BingoVoteState['options'] {
		const pool: BingoVoteState['options'] = [];
		if (this.canRandomize()) pool.push({ id: 'randomize_opponent_tile', label: 'Randomize', description: 'Reroll tiles', votes: 0 });
		if (this.canFreeze()) pool.push({ id: 'freeze_tile', label: 'Freeze', description: 'Freeze tiles', votes: 0 });
		if (this.canSwap()) pool.push({ id: 'swap_tiles', label: 'Swap', description: 'Swap tiles', votes: 0 });
		if (this.canShuffle()) pool.push({ id: 'shuffle_untouched', label: 'Shuffle', description: 'Shuffle tiles', votes: 0 });
		for (let i = pool.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[pool[i], pool[j]] = [pool[j], pool[i]];
		}
		return pool;
	}

	private startVoteForRole(role: 'host' | 'guest', options: BingoVoteState['options']) {
		if (!this.session || this.voteStates.has(role) || options.length === 0) return;
		const isSolo = this.session.role === 'solo';
		const forRole: BingoVoteState['forRole'] = isSolo ? 'all' : role;
		const state: BingoVoteState = { active: true, forRole, role, options, startedAt: Date.now(), durationMs: 30000 };
		this.voteStates.set(role, state);
		this.chatVotesByRole.get(role)?.clear();
		const timer = setTimeout(() => this.resolveVote(role), 30000);
		this.voteTimers.set(role, timer);
		this.sendVoteStates();
	}

	private startVote() {
		if (!this.session) return;
		const isSolo = this.session.role === 'solo';
		const pool = this.buildAllOptions();
		if (pool.length === 0) {
			this.voteScheduleTimer = setTimeout(() => this.tryStartVote(), 120000);
			return;
		}
		if (isSolo) {
			this.startVoteForRole('host', pool.slice(0, 2));
			return;
		}
		// Host gets first 2, guest gets next 2 (different options); fall back to same if pool < 4
		const hostOpts = pool.slice(0, 2);
		const guestOpts = pool.length >= 4 ? pool.slice(2, 4) : pool.slice(0, 2);
		this.startVoteForRole('host', hostOpts);
		// Guest vote starts with a random 0–10s offset so bars are visually out of sync
		const guestDelay = Math.floor(Math.random() * 10000);
		if (this.guestVoteDelayTimer) clearTimeout(this.guestVoteDelayTimer);
		this.guestVoteDelayTimer = setTimeout(() => {
			this.guestVoteDelayTimer = null;
			if (this.session) this.startVoteForRole('guest', guestOpts);
		}, guestDelay);
	}

	private handleChatVote(data: { username: string; text: string; channel: string }) {
		const hostChannel = this.session?.settings.twitchChannel?.toLowerCase().replace(/^#/, '').trim();
		const guestChannel = this.opponentTwitchUsername?.toLowerCase().replace(/^#/, '').trim();
		const incomingChannel = data.channel.toLowerCase().replace(/^#/, '').trim();
		let role: 'host' | 'guest' | null = null;
		if (hostChannel && incomingChannel === hostChannel) role = 'host';
		else if (guestChannel && incomingChannel === guestChannel) role = 'guest';
		if (!role) return;
		const state = this.voteStates.get(role);
		if (!state?.active) return;
		const text = data.text.trim();
		if (text.length !== 1) return;
		const n = parseInt(text);
		if (isNaN(n) || n < 1 || n > state.options.length) return;
		const choice = state.options[n - 1]?.id ?? null;
		if (!choice) return;
		const votes = this.chatVotesByRole.get(role)!;
		if (votes.has(data.username)) return;
		votes.set(data.username, choice);
		const counts = new Map<BingoVoteActionType, number>();
		for (const v of votes.values()) counts.set(v, (counts.get(v) ?? 0) + 1);
		this.voteStates.set(role, { ...state, options: state.options.map(o => ({ ...o, votes: counts.get(o.id) ?? 0 })) });
		this.sendVoteStates();
	}

	private resolveVote(role: 'host' | 'guest') {
		const state = this.voteStates.get(role);
		if (!state || !this.session) return;
		this.voteTimers.delete(role);
		const maxVotes = Math.max(...state.options.map(o => o.votes));
		const tied = state.options.filter(o => o.votes === maxVotes);
		const winner = tied[Math.floor(Math.random() * tied.length)];
		const channelName = role === 'host'
			? (this.session.settings.twitchChannel || 'host')
			: (this.opponentTwitchUsername || 'guest');
		this.voteStates.delete(role);
		this.chatVotesByRole.get(role)?.clear();
		// Clear active vote bar — result popup shown when queue processes this item
		this.sendVoteStates({ role, state: null });
		this.pendingActions.push({ action: winner.id, description: winner.description, channelName, role });
		this.processActionQueue();
	}

	private processActionQueue() {
		if (this.actionQueueRunning || this.pendingActions.length === 0) return;
		this.actionQueueRunning = true;
		const { action, description, channelName, role } = this.pendingActions.shift()!;
		// 1. Show result popup
		const resultState: BingoVoteState = {
			active: false,
			forRole: role,
			role,
			options: [],
			startedAt: Date.now(),
			durationMs: 0,
			result: { winner: action, description, channelName },
		};
		this.sendVoteStates({ role, state: resultState });
		// 2. After popup visible for 3s, execute action
		const t1 = setTimeout(() => {
			this.actionQueueTimers = this.actionQueueTimers.filter(t => t !== t1);
			if (this.session) {
				if (action === 'randomize_opponent_tile') this.executeRandomize();
				else if (action === 'freeze_tile') this.executeFreeze(role);
				else if (action === 'swap_tiles') this.executeSwap();
				else if (action === 'shuffle_untouched') this.executeShuffle();
				this.messageHandler.sendMessage('BingoVoteActionExecuted', { action, channel: channelName });
			}
			// 3. Clear popup, then process next item
			// 1500ms covers max shuffle animation (4 swaps × 280ms step + 250ms flip = ~1090ms)
			const t2 = setTimeout(() => {
				this.actionQueueTimers = this.actionQueueTimers.filter(t => t !== t2);
				this.sendVoteStates({ role, state: null });
				this.actionQueueRunning = false;
				if (this.session?.settings.twitchEnabled && this.voteStates.size === 0 && this.pendingActions.length === 0) {
					this.scheduleNextVote();
				}
				this.processActionQueue();
			}, 1500);
			this.actionQueueTimers.push(t2);
		}, 3000);
		this.actionQueueTimers.push(t1);
	}

	private sendVoteStates(override?: { role: 'host' | 'guest'; state: BingoVoteState | null }) {
		const host = override?.role === 'host' ? override.state : (this.voteStates.get('host') ?? null);
		const guest = override?.role === 'guest' ? override.state : (this.voteStates.get('guest') ?? null);
		if (!host && !guest) {
			this.messageHandler.sendMessage('BingoVoteState', null);
		} else {
			this.messageHandler.sendMessage('BingoVoteState', { host, guest });
		}
	}

	private executeRandomize(): string {
		if (!this.session) return 'No active session';
		const tiles = this.session.board.tiles;
		const locked = this.getLockedBoxIndices();
		const eligible = tiles
			.map((b, i) => ({ b, i }))
			.filter(({ b, i }) => !b.frozen && !b.completed && !locked.has(i));
		if (!eligible.length) {
			this.messageHandler.sendMessage('Notification', 'Randomize: no eligible tiles', NotificationType.Warning, 3000);
			return 'No eligible tiles';
		}
		const count = Math.max(1, Math.min(5, Math.floor(eligible.length * 0.25)));
		const targets = [...eligible].sort(() => Math.random() - 0.5).slice(0, count);
		const usedIds = new Set(tiles.map(b => b.challengeId));
		const ROLL_FRAMES = 6;
		const ROLL_DELAY_MS = 75;
		const rolls: Array<{ instanceId: string; frames: BingoTile[] }> = [];
		for (const { b: target, i: targetIdx } of targets) {
			usedIds.delete(target.challengeId);
			const replacement = this.generateReplacementTile(usedIds, this.session.board.difficulty);
			if (!replacement) continue;
			const newTile: BingoTile = { ...replacement, instanceId: target.instanceId };
			tiles[targetIdx] = newTile;
			usedIds.add(newTile.challengeId);
			const frames: BingoTile[] = [];
			for (let f = 0; f < ROLL_FRAMES - 1; f++) {
				const interim = this.generateReplacementTile(new Set(), this.session.board.difficulty);
				if (interim) frames.push({ ...interim, instanceId: target.instanceId });
			}
			frames.push(newTile);
			rolls.push({ instanceId: target.instanceId, frames });
		}
		if (rolls.length > 0) {
			this.messageHandler.sendMessage('BingoTilesRolling', { rolls, delayMs: ROLL_DELAY_MS });
			const totalMs = ROLL_FRAMES * ROLL_DELAY_MS + 100;
			setTimeout(() => {
				if (!this.session) return;
				this.sendBoardToPeer(this.session.board);
				this.sendBingoState();
			}, totalMs);
		} else {
			this.sendBoardToPeer(this.session.board);
			this.sendBingoState();
		}
		return `Randomized ${count} tile(s)`;
	}

	private executeFreeze(voteRole: 'host' | 'guest' = 'host'): string {
		if (!this.session) return 'No active session';
		const tiles = this.session.board.tiles;
		const locked = this.getLockedBoxIndices();
		const eligible = tiles
			.map((b, i) => ({ b, i }))
			.filter(({ b, i }) => !b.frozen && !b.completed && !locked.has(i));
		if (eligible.length === 0) {
			this.messageHandler.sendMessage('Notification', 'Freeze: no eligible tiles', NotificationType.Warning, 3000);
			return 'No eligible tiles to freeze';
		}
		const count = Math.max(1, Math.min(5, Math.floor(eligible.length * 0.20)));
		const targets = [...eligible].sort(() => Math.random() - 0.5).slice(0, count);
		const frozenForOpponent = voteRole !== 'guest';
		const updates = targets.map(({ b: target }) => {
			const durationMs = 50000 + Math.floor(Math.random() * 150000); // 50–200 s per tile
			const frozenUntil = Date.now() + durationMs;
			target.frozen = true;
			target.frozenUntil = frozenUntil;
			target.frozenForOpponent = frozenForOpponent;
			const timer = setTimeout(() => {
				if (!this.session) return;
				const tile = this.session.board.tiles.find(b => b.instanceId === target.instanceId);
				if (!tile) return;
				tile.frozen = false;
				tile.frozenUntil = undefined;
				tile.frozenForOpponent = undefined;
				this.frozenTimers.delete(target.instanceId);
				this.messageHandler.sendMessage('BingoChallengeUpdates', {
					updates: [{ instanceId: tile.instanceId, progress: tile.progress, completed: tile.completed, frozen: false, frozenUntil: undefined, frozenForOpponent: undefined }],
				});
				this.sendBoardToPeer(this.session.board);
				this.sendBingoState();
			}, durationMs);
			this.frozenTimers.set(target.instanceId, timer);
			return { instanceId: target.instanceId, progress: target.progress, completed: false, frozen: true, frozenUntil, frozenForOpponent };
		});
		this.messageHandler.sendMessage('BingoChallengeUpdates', { updates });
		this.sendBoardToPeer(this.session.board);
		this.sendBingoState();
		return `Froze ${count} tile(s)`;
	}

	private executeSwap(): string {
		if (!this.session) return 'No active session';
		const tiles = this.session.board.tiles;
		const locked = this.getLockedBoxIndices();
		// Pick one of the opponent's completed tiles and move it to a random uncompleted spot
		const oppTiles = tiles
			.map((b, i) => ({ b, i }))
			.filter(({ b, i }) => b.completedBy === 'opponent' && !b.frozen && !locked.has(i));
		const openTiles = tiles
			.map((b, i) => ({ b, i }))
			.filter(({ b, i }) => !b.completed && !b.frozen && !locked.has(i));
		let ai: number, bi: number;
		if (oppTiles.length && openTiles.length) {
			ai = oppTiles[Math.floor(Math.random() * oppTiles.length)].i;
			const pool = openTiles.filter(({ i }) => i !== ai);
			if (!pool.length) {
				// Edge case: the only open tile is the opponent tile itself (shouldn't happen)
				const fallback = tiles.map((b, i) => ({ b, i })).filter(({ b, i }) => !b.frozen && !locked.has(i) && i !== ai);
				if (!fallback.length) return 'No tiles to swap with';
				bi = fallback[Math.floor(Math.random() * fallback.length)].i;
			} else {
				const currentLines = this.countOpponentLines();
				const wc = this.session.settings.winCondition;
				const winTarget = wc === 'rowcontrol' ? 3 : typeof wc === 'number' ? wc : Infinity;
				const noLinePool = pool.filter(({ i }) => this.countOpponentLines(i) <= currentLines);
				const noWinPool = pool.filter(({ i }) => this.countOpponentLines(i) < winTarget);
				const biPool = noLinePool.length > 0 ? noLinePool : noWinPool.length > 0 ? noWinPool : pool;
				bi = biPool[Math.floor(Math.random() * biPool.length)].i;
			}
		} else {
			// Fallback (solo or opponent hasn't completed anything): any 2 eligible tiles
			const eligible = tiles.map((b, i) => ({ b, i })).filter(({ b, i }) => !b.frozen && !locked.has(i));
			if (eligible.length < 2) {
				const msg = 'Not enough unprotected tiles to swap';
				this.messageHandler.sendMessage('Notification', msg, NotificationType.Warning, 3000);
				return msg;
			}
			const shuffled = [...eligible].sort(() => Math.random() - 0.5);
			ai = shuffled[0].i;
			bi = shuffled[1].i;
		}
		const temp = tiles[ai];
		tiles[ai] = tiles[bi];
		tiles[bi] = temp;
		this.messageHandler.sendMessage('BingoTilesSwapped', { indexA: ai, indexB: bi });
		this.sendBoardToPeer(this.session.board);
		this.sendBingoState();
		return `Moved opponent's tile from position ${ai} to ${bi}`;
	}

	private canRandomize(): boolean {
		if (!this.session) return false;
		const locked = this.getLockedBoxIndices();
		return this.session.board.tiles.some((b, i) => !b.frozen && !b.completed && !locked.has(i));
	}

	private canShuffle(): boolean {
		if (!this.session) return false;
		const locked = this.getLockedBoxIndices();
		return this.session.board.tiles.filter((b, i) => !b.completed && !b.frozen && !locked.has(i)).length >= 2;
	}

	private executeShuffle(): string {
		if (!this.session) return 'No active session';
		const tiles = this.session.board.tiles;
		const locked = this.getLockedBoxIndices();
		const untouched = tiles
			.map((_, i) => i)
			.filter(i => !tiles[i].completed && !tiles[i].frozen && !locked.has(i));
		if (untouched.length < 2) return 'Not enough untouched tiles';
		// Pick 30% of untouched positions to shuffle (min 2, max 5)
		const count = Math.max(2, Math.min(5, Math.floor(untouched.length * 0.50)));
		const selected = [...untouched].sort(() => Math.random() - 0.5).slice(0, count);
		// Fisher-Yates shuffle of the selected positions
		const positions = [...selected];
		for (let k = positions.length - 1; k > 0; k--) {
			const j = Math.floor(Math.random() * (k + 1));
			[positions[k], positions[j]] = [positions[j], positions[k]];
		}
		// newOrder[i] = original index of tile now at position i
		const newOrder = tiles.map((_, i) => i);
		selected.forEach((pos, k) => { newOrder[pos] = positions[k]; });
		// Apply to board
		const snapshot = [...tiles];
		selected.forEach((pos, k) => { tiles[pos] = snapshot[positions[k]]; });
		this.messageHandler.sendMessage('BingoTilesShuffled', { newOrder });
		this.sendBoardToPeer(this.session.board);
		this.sendBingoState();
		return `Shuffled ${selected.length} untouched tiles`;
	}

	private generateReplacementTile(excludeIds: Set<BingoChallengeId>, difficulty: BingoDifficulty): BingoTile | null {
		const pool = CHALLENGE_DEFINITIONS.filter(d => {
			if (d.availableDifficulties && !d.availableDifficulties.includes(difficulty)) return false;
			return !excludeIds.has(d.id);
		});
		if (!pool.length) return null;
		const def = pool[Math.floor(Math.random() * pool.length)];
		const { target, percent } = resolveTarget(def, difficulty);
		const params: BingoTile['params'] = { difficulty, target, ...(percent !== undefined ? { percent } : {}) };
		if (def.id === 'win_with_character') {
			const charId = PLAYABLE_CHARACTER_IDS[Math.floor(Math.random() * PLAYABLE_CHARACTER_IDS.length)];
			params.characterId = charId;
			params.characterName = CHARACTER_NAMES[charId] ?? `Character ${charId}`;
		}
		const labelParams = { target, percent, direction: params.direction, characterName: params.characterName };
		return {
			instanceId: `b${Math.random().toString(36).slice(-8)}`,
			challengeId: def.id,
			label: def.label(labelParams),
			description: def.description(labelParams),
			params,
			progress: 0,
			target,
			completed: false,
			completedBy: null,
			hasProgress: def.hasProgress,
		};
	}

	private stopVote() {
		for (const timer of this.voteTimers.values()) clearTimeout(timer);
		this.voteTimers.clear();
		if (this.voteScheduleTimer) { clearTimeout(this.voteScheduleTimer); this.voteScheduleTimer = null; }
		if (this.guestVoteDelayTimer) { clearTimeout(this.guestVoteDelayTimer); this.guestVoteDelayTimer = null; }
		for (const t of this.actionQueueTimers) clearTimeout(t);
		this.actionQueueTimers = [];
		this.voteStates.clear();
		this.chatVotesByRole.get('host')?.clear();
		this.chatVotesByRole.get('guest')?.clear();
		this.pendingActions.length = 0;
		this.actionQueueRunning = false;
	}

	private clearFrozenTimers() {
		for (const timer of this.frozenTimers.values()) clearTimeout(timer);
		this.frozenTimers.clear();
	}
}
