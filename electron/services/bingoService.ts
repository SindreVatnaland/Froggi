import { delay, inject, singleton } from 'tsyringe';
import { ElectronSettingsStore } from './store/storeSettings';
import type { ElectronLog } from 'electron-log';
import type { App } from 'electron';
import { GameEndMethod } from '@slippi/slippi-js';
import type { FrameEntryType, GameStartType } from '@slippi/slippi-js';
import type { StatsType } from '@slippi/slippi-js/dist/stats/common';
import WebSocket from 'ws';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { NotificationType } from '../../frontend/src/lib/models/enum';
import { MessageHandler } from './messageHandler';
import type {
	BingoSession,
	BingoChallengeUpdate,
	BingoLobbyPayload,
	BingoSettings,
	BingoSoloWinPayload,
	BingoLeaderboardEntry,
} from '../../frontend/src/lib/models/types/bingo';
import type { CurrentPlayer, GameStats } from '../../frontend/src/lib/models/types/slippiData';
import { getMoveCategory } from '../../frontend/src/lib/models/constants/moveCategories';

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
	boxStates: Map<string, { progress: number; completed: boolean; completedBy: 'local' | 'opponent' | 'both' | null }>;
}

interface ZeroDeathAttempt {
	opponentIndex: number;
	startFrame: number;
	damageTaken: number;
}

interface BingoPeerMessage {
	type: 'BingoJoin' | 'BingoWelcome' | 'BingoStart' | 'BingoComplete' | 'BingoPing' | 'BingoSync' | 'BingoSettingsUpdate';
	version?: string;
	board?: BingoSession['board'];
	settings?: BingoSession['settings'];
	instanceId?: string;
	timestamp?: number;
	playerName?: string;
}

@singleton()
export class BingoService {
	private session: BingoSession | null = null;
	private lobby: BingoLobbyPayload | null = null;
	private localPlayerIndex: number | null = null;
	private opponentPlayerIndex: number | null = null;
	private localPlayerName: string = 'Player 1';
	private pendingOpponentName: string | null = null;

	// Peer connection state
	private peerSocket: WebSocket | null = null; // active peer WS (either as host or guest)

	// Per-game state (reset on GameSettings)
	private effectiveLocalIndex: number | null = null;
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
	private winStreak: number = 0;
	private characterWins: Map<number, number> = new Map();
	private lastGameWasWin: boolean = false;
	private sessionSnapshot: SessionSnapshot | null = null;
	private opponentCompletedBoxes: Set<string> = new Set();
	private readonly revertEnabled: boolean = true;

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('App') private app: App,
		@inject('LocalEmitter') private localEmitter: TypedEmitter,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(delay(() => ElectronSettingsStore)) private settingsStore: ElectronSettingsStore,
	) {
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
						if (this.lobby) {
							// Lobby mode: exchange names, no board yet
							this.lobby.opponentConnected = true;
							this.lobby.opponentName = msg.playerName ?? null;
							ws.send(JSON.stringify({ type: 'BingoWelcome', version: myVersion, playerName: this.localPlayerName, settings: this.lobby.settings }));
							this.messageHandler.sendMessage('BingoLobbyState', { ...this.lobby });
						} else {
							// Active session host (reconnect scenario)
							this.pendingOpponentName = msg.playerName ?? null;
							ws.send(JSON.stringify({ type: 'BingoWelcome', version: myVersion, board: this.session!.board, settings: this.session!.settings, playerName: this.localPlayerName }));
							if (this.session) this.session.opponentName = this.pendingOpponentName;
							this.updatePeerConnected(true);
						}
						this.log.info('Bingo: guest joined, version', theirVersion);
					} else if (msg.type === 'BingoComplete' && msg.instanceId) {
						this.applyOpponentCompletion(msg.instanceId);
					} else if (msg.type === 'BingoPing') {
						ws.send(JSON.stringify({ type: 'BingoPing' }));
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

		this.localEmitter.on('GameSettings', (settings: GameStartType | undefined) => {
			this.sessionSnapshot = this.takeSessionSnapshot();
			this.resetGameState();
			if (!settings || !settings.players?.length) return;
			// Fall back to port 0 when no ranked CurrentPlayer (offline/dev games)
			this.effectiveLocalIndex = this.localPlayerIndex ?? settings.players[0].playerIndex;
			const otherPlayer = settings.players.find(p => p.playerIndex !== this.effectiveLocalIndex);
			this.opponentPlayerIndex = otherPlayer?.playerIndex ?? null;
		});

		this.localEmitter.on('GameFrame', (frame: FrameEntryType | undefined | null) => {
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
			this.session = null;
			this.lobby = { opponentConnected: false, opponentName: null, localName: this.localPlayerName };
			this.messageHandler.lobbyGame = 'bingo';
			this.messageHandler.sendMessage('BingoLobbyState', { ...this.lobby });
		});

		this.clientEmitter.on('BingoUpdateLobbySettings', (settings: BingoSettings) => {
			if (!this.lobby) return;
			this.lobby.settings = settings;
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
					boxes: session.board.boxes.map((box) => ({
						...box,
						completedBy: box.completedBy === 'local' ? 'opponent'
						           : box.completedBy === 'opponent' ? 'local'
						           : box.completedBy,
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

		this.clientEmitter.on('BingoSoloWin', (data: BingoSoloWinPayload) => {
			this.saveSoloRecord(data);
		});

		this.clientEmitter.on('GetBingoLeaderboard', () => {
			this.emitLeaderboard();
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
		const boxes = this.session.board.boxes;
		const totalCheckedLocal = boxes.filter(b => b.completedBy === 'local' || b.completedBy === 'both').length;
		const totalCheckedOpponent = boxes.filter(b => b.completedBy === 'opponent' || b.completedBy === 'both').length;
		const completedUpdate = updates.find(u => u.completed) ?? updates[updates.length - 1] ?? null;
		const latestBox = completedUpdate ? boxes.find(b => b.instanceId === completedUpdate.instanceId) : null;
		const latestUpdate = completedUpdate && latestBox ? {
			instanceId: completedUpdate.instanceId,
			label: latestBox.label,
			completedBy: completedUpdate.completedBy ?? null,
			reverted,
		} : null;
		this.messageHandler.sendMessage('BingoChallengeUpdates', {
			updates,
			reverted,
			webhookData: { totalCheckedLocal, totalCheckedOpponent, latestUpdate },
		});
	}

	private devCompleteLocal(instanceId: string) {
		if (!this.session) return;
		const box = this.session.board.boxes.find((b) => b.instanceId === instanceId);
		if (!box || box.completedBy === 'local') return;
		const isLockout = this.session.settings.winCondition === 'lockout';
		if (isLockout && box.completedBy) return;
		if (!isLockout && box.completedBy === 'opponent') {
			box.completedBy = 'both';
		} else {
			box.completed = true;
			box.completedBy = 'local';
			box.progress = box.target;
			this.sendCompletionToPeer(instanceId);
		}
		this.sendChallengeUpdates([{ instanceId, progress: box.target, completed: true, completedBy: box.completedBy ?? undefined }]);
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
			ws.send(JSON.stringify({ type: 'BingoJoin', version: this.app.getVersion(), playerName: this.localPlayerName }));
		});

		ws.on('message', (raw) => {
			try {
				const msg: BingoPeerMessage = JSON.parse(raw.toString());
				if (msg.type === 'BingoWelcome' && !msg.board) {
					// Lobby: host acknowledged connection, no board yet — wait for BingoStart
					this.lobby = { opponentConnected: true, opponentName: msg.playerName ?? null, localName: this.localPlayerName, settings: msg.settings };
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
						settings: msg.settings ?? { mode: 'lockout', boardSize: msg.board.size as 3 | 4 | 5, difficulty: msg.board.difficulty, winCondition: 3, lines: { rows: true, columns: true, diagonals: true }, requireQueueAfterGame: false, timer: { enabled: false, durationMinutes: 60 } },
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
				} else if (msg.type === 'BingoComplete' && msg.instanceId) {
					this.applyOpponentCompletion(msg.instanceId);
				} else if (msg.type === 'BingoSync' && msg.board) {
					this.applyHostBoard(msg.board);
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
		const box = this.session.board.boxes.find((b) => b.instanceId === instanceId);
		const isLockout = this.session.settings.winCondition === 'lockout';

		if (box) {
			if (isLockout && box.completedBy) {
				// Lockout: box already taken — reject silently, send authoritative board back
			} else if (!box.completedBy) {
				box.completed = true;
				box.completedBy = 'opponent';
				box.progress = box.target;
				this.opponentCompletedBoxes.add(instanceId);
				this.sendChallengeUpdates([{ instanceId, progress: box.target, completed: true, completedBy: 'opponent' }]);
			} else if (!isLockout && box.completedBy === 'local') {
				// Non-lockout: both players completed the same box
				box.completedBy = 'both';
				this.opponentCompletedBoxes.add(instanceId);
				this.sendChallengeUpdates([{ instanceId, progress: box.target, completed: true, completedBy: 'both' }]);
			}
		}
		this.sendBoardToPeer(this.session.board);
	}

	private applyHostBoard(board: BingoSession['board']) {
		if (!this.session) return;
		this.session.board = board;
		this.messageHandler.sendMessage('BingoState', { session: this.session });
	}

	private updatePeerConnected(connected: boolean) {
		if (!this.session) return;
		this.session.opponentConnected = connected;
		this.messageHandler.sendMessage('BingoState', { session: this.session });
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
			boxes: board.boxes.map((box) => ({
				...box,
				completedBy: box.completedBy === 'local' ? 'opponent'
				           : box.completedBy === 'opponent' ? 'local'
				           : box.completedBy === 'both' ? 'both'
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
	}

	private static readonly DEATH_DIRECTION_MAP: Record<number, string> = {
		0: 'down', 1: 'left', 2: 'right',
		3: 'up', 4: 'star', 5: 'star',
		6: 'screen_ko', 7: 'screen_ko', 8: 'screen_ko', 9: 'screen_ko', 10: 'screen_ko',
	};

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
		for (const instanceId of this.opponentCompletedBoxes) {
			const box = this.session.board.boxes.find(b => b.instanceId === instanceId);
			if (!box) continue;
			if (!box.completedBy) {
				box.completed = true;
				box.completedBy = 'opponent';
				box.progress = box.target;
			} else if (box.completedBy === 'local') {
				box.completedBy = 'both';
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
				this.session.board.boxes.map(b => [b.instanceId, { progress: b.progress, completed: b.completed, completedBy: b.completedBy }])
			);
			this.restoreSessionSnapshot(this.sessionSnapshot);
			this.reapplyOpponentCompletions();
			this.winStreak = 0;
			this.resetGameState();
			const revertUpdates: BingoChallengeUpdate[] = [];
			for (const box of this.session.board.boxes) {
				const pre = preRevert.get(box.instanceId);
				if (!pre) continue;
				if (box.progress !== pre.progress || box.completed !== pre.completed || box.completedBy !== pre.completedBy) {
					revertUpdates.push({
						instanceId: box.instanceId,
						progress: box.progress,
						completed: box.completed,
						completedBy: box.completedBy ?? undefined,
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
		const box = this.session.board.boxes.find((b) => b.challengeId === 'lcancel_rate' && !b.completed);
		if (!box) return 0.9;
		return (box.params.percent ?? 90) / 100;
	}

	private getStocksUnderPercentThreshold(): number {
		if (!this.session) return 40;
		const box = this.session.board.boxes.find((b) => b.challengeId === 'stocks_under_percent' && !b.completed);
		return box?.params.percent ?? 40;
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

		const isLockout = this.session.settings.winCondition === 'lockout';
		for (const box of this.session.board.boxes) {
			if (box.completedBy === 'local' || box.completedBy === 'both') continue;
			if (isLockout && box.completedBy === 'opponent') continue;
			const prev = box.progress;
			let next = prev;

			switch (box.challengeId) {
				case 'win_with_character':
					if (ctx.didWin && box.params.characterId === ctx.myCharacterId) {
						next = this.characterWins.get(ctx.myCharacterId) ?? 0;
					}
					break;
				case 'win_in_a_row':
					next = Math.min(this.winStreak, box.target);
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
					if (ctx.totalDamage >= (box.params.percent ?? 300)) next = box.target;
					break;
				case 'opponent_reach_percent':
					if (this.peakOpponentPercent >= (box.params.percent ?? 150)) next = 1;
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
					if (next >= box.target && !ctx.didWin) next = box.target - 1;
					break;
				case 'kill_fsmash': next = this.sessionKillsByMove.get('fsmash') ?? 0; break;
				case 'kill_usmash': next = this.sessionKillsByMove.get('usmash') ?? 0; break;
				case 'kill_nair':   next = this.sessionKillsByMove.get('nair') ?? 0; break;
				case 'kill_fair':   next = this.sessionKillsByMove.get('fair') ?? 0; break;
				case 'kill_bair':   next = this.sessionKillsByMove.get('bair') ?? 0; break;
				case 'kill_uair':   next = this.sessionKillsByMove.get('uair') ?? 0; break;
				case 'kill_dair':   next = this.sessionKillsByMove.get('dair') ?? 0; break;
				case 'kill_neutral_b': next = this.sessionKillsByMove.get('neutral_b') ?? 0; break;
				case 'kill_side_b':    next = this.sessionKillsByMove.get('side_b') ?? 0; break;
				case 'kill_up_b':      next = this.sessionKillsByMove.get('up_b') ?? 0; break;
				case 'kill_throw':
					next = (this.sessionKillsByMove.get('throw') ?? 0) >= 1 ? 1 : 0;
					break;
				case 'blast_zone_direction': {
					const dir = box.params.direction ?? 'left';
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
					if (maxSide >= box.target) next = box.target;
					break;
				}
				case 'all_blast_zones_game': {
					const hasLeft  = (this.gameBlastZoneKills.get('left')  ?? 0) > 0;
					const hasRight = (this.gameBlastZoneKills.get('right') ?? 0) > 0;
					const hasDown  = (this.gameBlastZoneKills.get('down')  ?? 0) > 0;
					const hasUp    = (this.gameBlastZoneKills.get('star')  ?? 0) > 0
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
					if (ctx.didWin && this.myDamageTakenThisGame < (box.params.percent ?? 100)) next = 1;
					break;
				case 'combo_damage':
					if ((ctx.bestComboDamage ?? 0) >= (box.params.percent ?? 50)) next = 1;
					break;
				case 'airborne_win': {
					if (ctx.didWin && this.myTotalGameFrames > 0) {
						const ratio = this.myAirborneFrames / this.myTotalGameFrames;
						if (ratio >= (box.params.percent ?? 60) / 100) next = 1;
					}
					break;
				}
				case 'same_move_kills': {
					const maxSameMove = Math.max(...this.gameKillsPerMove.values(), 0);
					next = maxSameMove;
					if (next >= box.target && !ctx.didWin) next = box.target - 1;
					break;
				}
				case 'no_smash_win':
					if (ctx.didWin && !this.usedSmashThisGame) next = 1;
					break;
				case 'win_low_apm':
					if (ctx.didWin && ctx.myApm != null && ctx.myApm < (box.params.percent ?? 150)) next = 1;
					break;
				case 'edgeguard_rate': {
					const attempts = this.sessionEdgeguardAttempts;
					const required = (box.params.percent ?? 50) / 100;
					if (attempts >= 3 && this.sessionEdgeguardSuccesses / attempts >= required) next = 1;
					break;
				}
			}

			if (next !== prev || next >= box.target) {
				box.progress = Math.min(next, box.target);
				const wasCompleted = box.completed;
				const prevCompletedBy = box.completedBy;
				box.completed = box.progress >= box.target;
				if (box.completed && !wasCompleted) {
					box.completedBy = 'local';
					this.sendCompletionToPeer(box.instanceId);
				} else if (box.completed && wasCompleted && prevCompletedBy === 'opponent') {
					box.completedBy = 'both';
					this.sendCompletionToPeer(box.instanceId);
				}
				if (box.completed !== wasCompleted || next !== prev || box.completedBy !== prevCompletedBy) {
					updates.push({ instanceId: box.instanceId, progress: box.progress, completed: box.completed, completedBy: box.completedBy ?? undefined });
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
		this.opponentCompletedBoxes.clear();
		this.localPlayerIndex = session.localPlayerIndex;
		this.log.info(`Bingo session started: ${session.board.id}, role: ${session.role}`);
		this.messageHandler.sendMessage('BingoState', { session: this.session });
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
			winStreak: this.winStreak,
			characterWins: new Map(this.characterWins),
			boxStates: new Map(
				(this.session?.board.boxes ?? []).map(b => [
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
		this.winStreak = s.winStreak;
		this.characterWins = new Map(s.characterWins);
		if (this.session) {
			for (const box of this.session.board.boxes) {
				const saved = s.boxStates.get(box.instanceId);
				if (!saved) continue;
				box.progress = saved.progress;
				box.completed = saved.completed;
				box.completedBy = saved.completedBy;
			}
		}
	}

	getSession() {
		return this.session;
	}

	getLobby() {
		return this.lobby;
	}

	private stopSession() {
		this.closePeerConnection();
		this.lobby = null;
		this.session = null;
		if (this.messageHandler.lobbyGame === 'bingo') this.messageHandler.lobbyGame = null;
		this.messageHandler.sendMessage('BingoLobbyState', null);
		this.messageHandler.sendMessage('BingoState', { session: null });
	}

	private closePeerConnection() {
		if (this.peerSocket && this.peerSocket.readyState === WebSocket.OPEN) {
			this.peerSocket.close();
		}
		this.peerSocket = null;
	}
}
