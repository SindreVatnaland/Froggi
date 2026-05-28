import { delay, inject, singleton } from 'tsyringe';
import { ElectronSettingsStore } from './store/storeSettings';
import type { ElectronLog } from 'electron-log';
import type { App } from 'electron';
import { GameEndMethod } from '@slippi/slippi-js';
import WebSocket from 'ws';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { NotificationType } from '../../frontend/src/lib/models/enum';
import { MessageHandler } from './messageHandler';
import type {
	IronManSession,
	IronManRoster,
	IronManSettings,
	IronManLobbyPayload,
	IronManLeaderboardEntry,
} from '../../frontend/src/lib/models/types/ironman';
import type { GameStats } from '../../frontend/src/lib/models/types/slippiData';

interface IronManPeerMessage {
	type:
		| 'IronManJoin'
		| 'IronManWelcome'
		| 'IronManStart'
		| 'IronManRosterUpdate'
		| 'IronManPing'
		| 'IronManStop'
		| 'IronManSettingsUpdate';
	version?: string;
	playerName?: string;
	settings?: IronManSettings;
	roster?: IronManRoster;
	timestamp?: number;
}

@singleton()
export class IronManService {
	private session: IronManSession | null = null;
	private lobby: IronManLobbyPayload | null = null;

	private localPlayerIndex: number | null = null;
	private peerSocket: WebSocket | null = null;

	// Current game tracking
	private currentGameLocalCharId: number | null = null;
	private currentGameOppCharId: number | null = null;
	private currentGameValid = true;

	// Solo run tracking
	private challengeStartTime: number | null = null;
	private fullRosterStartTime: number | null = null;
	private standardStartTime: number | null = null;
	private sessionWins = 0;

	// Ping interval
	private pingInterval: ReturnType<typeof setInterval> | null = null;

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('App') private app: App,
		@inject('LocalEmitter') private localEmitter: TypedEmitter,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(delay(() => ElectronSettingsStore)) private settingsStore: ElectronSettingsStore,
	) {
		this.initPeerServer();
		this.initEventListeners();
	}

	private get localPlayerName(): string {
		return this.session?.localName ?? 'Player';
	}

	private get effectiveLocalIndex(): number | null {
		return this.localPlayerIndex;
	}

	private get opponentPlayerIndex(): number | null {
		const li = this.effectiveLocalIndex;
		if (li == null) return null;
		return li === 0 ? 1 : 0;
	}

	// ── Peer server (host side) ──────────────────────────────────────────────

	private initPeerServer() {
		this.messageHandler.ironManPeerWss.on('connection', (ws: WebSocket) => {
			this.log.info('IronMan: incoming peer connection');

			if (this.peerSocket && this.peerSocket.readyState === WebSocket.OPEN) {
				ws.close(1008, 'Already have a peer');
				return;
			}

			ws.on('message', (raw) => {
				try {
					const msg: IronManPeerMessage = JSON.parse(raw.toString());
					if (msg.type === 'IronManJoin') {
						this.peerSocket = ws;
						const guestName = msg.playerName ?? 'Guest';
						if (this.lobby) {
							this.lobby.opponentConnected = true;
							this.lobby.opponentName = guestName;
							this.messageHandler.sendMessage('IronManLobbyState', { ...this.lobby });
						}
						ws.send(JSON.stringify({
							type: 'IronManWelcome',
							playerName: this.localPlayerName,
							settings: this.session?.settings ?? this.pendingSettings,
						} as IronManPeerMessage));
					} else if (msg.type === 'IronManRosterUpdate' && msg.roster) {
						this.applyOpponentRosterUpdate(msg.roster);
					} else if (msg.type === 'IronManPing') {
						ws.send(JSON.stringify({ type: 'IronManPing', timestamp: Date.now() } as IronManPeerMessage));
					}
				} catch (err) {
					this.log.error('IronMan peer message error:', err);
				}
			});

			ws.on('close', () => {
				if (this.peerSocket === ws) {
					this.peerSocket = null;
					if (this.lobby) {
						this.lobby.opponentConnected = false;
						this.lobby.opponentName = null;
						this.messageHandler.sendMessage('IronManLobbyState', { ...this.lobby });
					} else if (this.session) {
						this.session.opponentConnected = false;
						this.emitState();
					}
					this.log.info('IronMan: peer disconnected');
				}
			});

			ws.on('error', (err) => this.log.error('IronMan peer error:', err));
		});
	}

	// Temporary settings store before a session starts (host selects settings before guest arrives)
	private pendingSettings: IronManSettings | null = null;

	// ── Guest side ───────────────────────────────────────────────────────────

	private connectToHost(hostUrl: string) {
		if (this.peerSocket) {
			this.peerSocket.close();
			this.peerSocket = null;
		}
		const wsUrl = hostUrl.replace(/^http/, 'ws').replace(/\/$/, '') + '/ironman-peer';
		this.log.info('IronMan: connecting to host', wsUrl);

		const ws = new WebSocket(wsUrl);
		this.peerSocket = ws;

		ws.on('open', () => {
			ws.send(JSON.stringify({
				type: 'IronManJoin',
				version: this.app.getVersion(),
				playerName: this.localPlayerName,
			} as IronManPeerMessage));
		});

		ws.on('message', (raw) => {
			try {
				const msg: IronManPeerMessage = JSON.parse(raw.toString());
				if (msg.type === 'IronManWelcome') {
					this.pendingSettings = msg.settings ?? null;
					this.lobby = {
						opponentConnected: true,
						opponentName: msg.playerName ?? null,
						localName: this.localPlayerName,
						settings: msg.settings,
					};
					this.messageHandler.sendMessage('IronManLobbyState', { ...this.lobby });
				} else if (msg.type === 'IronManSettingsUpdate' && msg.settings) {
					this.pendingSettings = msg.settings;
					if (this.lobby) {
						this.lobby.settings = msg.settings;
						this.messageHandler.sendMessage('IronManLobbyState', { ...this.lobby });
					}
				} else if (msg.type === 'IronManStart' && msg.roster) {
					if (!this.session &&
						this.pendingSettings?.charSelection === 'random' &&
						this.pendingSettings?.randomSync === 'shared') {
						// Shared-random: auto-start guest with host's roster
						const guestSession: IronManSession = {
							settings: this.pendingSettings,
							localRoster: { slots: msg.roster.slots.map(s => ({ ...s, depleted: false, completed: false, stocksRemaining: this.pendingSettings!.stocksPerChar })), currentIndex: 0 },
							opponentRoster: null,
							role: 'guest',
							localName: this.localPlayerName,
							opponentName: this.lobby?.opponentName ?? null,
							localPlayerIndex: this.localPlayerIndex,
							opponentConnected: true,
							startedAt: Date.now(),
							winner: null,
							pendingCarryStocks: null,
						};
						this.startSession(guestSession);
						this.lobby = null;
						this.messageHandler.sendMessage('IronManLobbyState', null);
					} else {
						// Normal: guest already started their own session; receive opponent roster
						this.applyOpponentRosterUpdate(msg.roster);
						if (this.session) {
							this.lobby = null;
							this.messageHandler.sendMessage('IronManLobbyState', null);
							this.emitState();
						}
					}
				} else if (msg.type === 'IronManRosterUpdate' && msg.roster) {
					this.applyOpponentRosterUpdate(msg.roster);
				} else if (msg.type === 'IronManStop') {
					this.stopSession();
				}
			} catch (err) {
				this.log.error('IronMan peer message error:', err);
			}
		});

		ws.on('close', () => {
			if (this.peerSocket === ws) {
				this.peerSocket = null;
				if (this.lobby) {
					this.lobby = null;
					this.messageHandler.sendMessage('IronManLobbyState', null);
				} else if (this.session) {
					this.session.opponentConnected = false;
					this.emitState();
				}
			}
		});

		ws.on('error', (err) => {
			this.log.error('IronMan peer connect error:', err);
			this.peerSocket = null;
		});
	}

	// ── Event listeners ──────────────────────────────────────────────────────

	private initEventListeners() {
		this.localEmitter.on('CurrentPlayer', (player: any) => {
			if (!this.session) this.localPlayerIndex = player?.playerIndex ?? null;
		});

		this.clientEmitter.on('IronManStartLobby', (settings: IronManSettings) => {
			this.closePeerConnection();
			this.session = null;
			this.pendingSettings = settings;
			this.lobby = {
				opponentConnected: false,
				opponentName: null,
				localName: this.localPlayerName,
				settings,
			};
			this.messageHandler.lobbyGame = 'ironman';
			this.messageHandler.sendMessage('IronManLobbyState', { ...this.lobby });
			this.emitState();
		});

		this.clientEmitter.on('IronManUpdateLobbySettings', (settings: IronManSettings) => {
			if (!this.lobby) return;
			this.pendingSettings = settings;
			this.lobby.settings = settings;
			this.messageHandler.sendMessage('IronManLobbyState', { ...this.lobby });
			if (this.peerSocket?.readyState === WebSocket.OPEN) {
				this.peerSocket.send(JSON.stringify({ type: 'IronManSettingsUpdate', settings } as IronManPeerMessage));
			}
		});

		this.clientEmitter.on('StartIronMan', (session: IronManSession) => {
			this.startSession(session);
		});

		this.clientEmitter.on('StopIronMan', () => {
			this.stopSession();
		});

		this.clientEmitter.on('IronManPeerConnect', (hostUrl: string) => {
			this.connectToHost(hostUrl);
		});

		this.clientEmitter.on('GetIronManLeaderboard', () => {
			this.emitLeaderboard();
		});

		this.clientEmitter.on('IronManChallengeWin', (data) => {
			this.saveChallengeRecord(data.timeSeconds, data.rosterSize);
		});

		this.localEmitter.on('GameSettings', (settings: any) => {
			if (!this.session) return;
			let myIdx = this.effectiveLocalIndex;
			if (myIdx == null) {
				const connectCode = this.settingsStore.getCurrentPlayerConnectCode() ?? '';
				const players = settings?.players ?? [];
				const found = connectCode ? players.find((p: any) => p.connectCode === connectCode) : null;
				myIdx = found?.playerIndex ?? players[0]?.playerIndex ?? null;
				if (myIdx != null) {
					this.localPlayerIndex = myIdx;
					if (this.session) this.session.localPlayerIndex = myIdx;
				}
			}
			if (myIdx == null) return;

			const players = settings?.players ?? [];
			this.currentGameLocalCharId = players.find((p: any) => p.playerIndex === myIdx)?.characterId ?? null;
			const oppIdx = this.opponentPlayerIndex;
			this.currentGameOppCharId = oppIdx != null
				? (players.find((p: any) => p.playerIndex === oppIdx)?.characterId ?? null)
				: null;

			this.currentGameValid = this.validateCurrentGame();

			// Broadcast to frontend so roster grids can highlight the active char
			this.messageHandler.sendMessage('IronManCurrentChar', {
				localCharId: this.currentGameLocalCharId,
				oppCharId: this.currentGameOppCharId,
			});

			if (!this.currentGameValid) {
				this.log.info(`IronMan: invalid char ${this.currentGameLocalCharId} for variant ${this.session.settings.variant}`);
				this.messageHandler.sendMessage('IronManGameResult', { valid: false, reason: 'Wrong character — game will be discarded' });
			}
		});

		this.localEmitter.on('PostGameStats', (game: GameStats | undefined) => {
			if (!game || !this.session) return;
			this.processGameEnd(game);
		});
	}

	// ── Session management ────────────────────────────────────────────────────

	private startSession(session: IronManSession) {
		this.session = session;
		this.localPlayerIndex = session.localPlayerIndex;
		this.pendingSettings = null;
		this.currentGameLocalCharId = null;
		this.currentGameOppCharId = null;
		this.currentGameValid = true;

		this.challengeStartTime = null;
		this.fullRosterStartTime = null;
		this.standardStartTime = null;
		this.sessionWins = 0;

		if (session.role === 'solo') {
			if (session.settings.variant === 'challenge') this.challengeStartTime = Date.now();
			else if (session.settings.variant === 'full_roster') this.fullRosterStartTime = Date.now();
			else if (session.settings.variant === 'standard') this.standardStartTime = Date.now();
		}

		// Host: send session start to peer if connected
		if (session.role === 'host' && this.peerSocket?.readyState === WebSocket.OPEN) {
			this.lobby = null;
			this.messageHandler.sendMessage('IronManLobbyState', null);
			if (session.opponentRoster) {
				this.peerSocket.send(JSON.stringify({
					type: 'IronManStart',
					roster: session.localRoster,
				} as IronManPeerMessage));
			}
		}

		this.emitState();
		this.log.info(`IronMan: session started (${session.settings.variant}, ${session.settings.rosterSize} chars, ${session.role})`);
	}

	private stopSession() {
		if (this.session?.role === 'host' && this.peerSocket?.readyState === WebSocket.OPEN) {
			this.peerSocket.send(JSON.stringify({ type: 'IronManStop' } as IronManPeerMessage));
		}
		this.closePeerConnection();
		this.session = null;
		this.lobby = null;
		if (this.messageHandler.lobbyGame === 'ironman') this.messageHandler.lobbyGame = null;
		this.challengeStartTime = null;
		this.currentGameLocalCharId = null;
		this.currentGameOppCharId = null;
		this.messageHandler.sendMessage('IronManLobbyState', null);
		this.emitState();
	}

	private closePeerConnection() {
		if (this.pingInterval) {
			clearInterval(this.pingInterval);
			this.pingInterval = null;
		}
		if (this.peerSocket) {
			this.peerSocket.close();
			this.peerSocket = null;
		}
	}

	// ── Game validation ───────────────────────────────────────────────────────

	private validateCurrentGame(): boolean {
		if (!this.session) return false;
		const charId = this.currentGameLocalCharId;
		if (charId == null) return false;
		const { variant } = this.session.settings;

		if (variant === 'full_roster' || variant === 'challenge') {
			const activeSlot = this.session.localRoster.slots[this.session.localRoster.currentIndex];
			return activeSlot != null && activeSlot.characterId === charId;
		}

		// Standard: any undepleted roster char is valid
		return this.session.localRoster.slots.some(s => s.characterId === charId && !s.depleted);
	}

	// ── Game processing ───────────────────────────────────────────────────────

	private processGameEnd(game: GameStats) {
		if (!this.session || !this.currentGameValid) {
			this.currentGameLocalCharId = null;
			this.currentGameOppCharId = null;
			this.currentGameValid = true;
			return;
		}

		const myIdx = this.effectiveLocalIndex;
		const oppIdx = this.opponentPlayerIndex;
		if (myIdx == null) return;

		const myFinalStocks = game.lastFrame?.players?.[myIdx]?.post?.stocksRemaining ?? 0;
		const oppFinalStocks = oppIdx != null
			? (game.lastFrame?.players?.[oppIdx]?.post?.stocksRemaining ?? 0)
			: 0;
		const didWin = myFinalStocks > 0 && (oppIdx == null || oppFinalStocks === 0);

		// LRAS: if local player quit intentionally (no win), revert
		const isLocalQuit = game.gameEnd?.gameEndMethod === GameEndMethod.NO_CONTEST
			&& (game.gameEnd as any)?.lrasInitiatorIndex === myIdx
			&& !didWin;
		if (isLocalQuit) {
			this.log.info('IronMan: LRAS detected — ignoring game');
			this.resetCurrentGame();
			return;
		}

		const variant = this.session.settings.variant;

		if (variant === 'standard') {
			this.processStandard(didWin, myFinalStocks, oppFinalStocks);
		} else if (variant === 'full_roster') {
			this.processFullRoster(didWin);
		} else if (variant === 'challenge') {
			this.processChallenge(didWin);
		}

		this.resetCurrentGame();
		this.emitState();
		this.syncWithPeer();
	}

	private processStandard(didWin: boolean, myFinalStocks: number, oppFinalStocks: number) {
		if (!this.session) return;
		const localRoster = this.session.localRoster;
		const charId = this.currentGameLocalCharId!;

		const mySlot = localRoster.slots.find(s => s.characterId === charId && !s.depleted);
		if (!mySlot) return;

		if (didWin) {
			mySlot.stocksRemaining = myFinalStocks;
			this.session.pendingCarryStocks = myFinalStocks < this.session.settings.stocksPerChar
				? this.session.settings.stocksPerChar - myFinalStocks
				: 0;
			// Deplete opponent's char
			const oppCharId = this.currentGameOppCharId;
			if (this.session.opponentRoster && oppCharId != null) {
				const oppSlot = this.session.opponentRoster.slots.find(s => s.characterId === oppCharId && !s.depleted);
				if (oppSlot) oppSlot.depleted = true;
			}
		} else {
			mySlot.depleted = true;
			this.session.pendingCarryStocks = null;
			// Update opponent's carry stocks
			const oppCharId = this.currentGameOppCharId;
			if (this.session.opponentRoster && oppCharId != null) {
				const oppSlot = this.session.opponentRoster.slots.find(s => s.characterId === oppCharId && !s.depleted);
				if (oppSlot) oppSlot.stocksRemaining = oppFinalStocks;
			}
		}

		if (didWin) this.sessionWins++;

		// Check win/loss condition
		const localAllDepleted = localRoster.slots.every(s => s.depleted);
		const oppAllDepleted = this.session.opponentRoster?.slots.every(s => s.depleted) ?? false;
		if (oppAllDepleted) this.session.winner = 'local';
		else if (localAllDepleted) {
			if (this.session.role === 'solo') {
				// Solo run complete — all chars used up
				this.session.winner = 'local';
				if (this.standardStartTime != null) {
					const timeSeconds = Math.floor((Date.now() - this.standardStartTime) / 1000);
					this.saveStandardRecord(timeSeconds, localRoster.slots.length, this.sessionWins);
				}
			} else {
				this.session.winner = 'opponent';
			}
		}
	}

	private processFullRoster(didWin: boolean) {
		if (!this.session) return;
		if (!didWin) return; // Loss: stay on same char

		const roster = this.session.localRoster;
		const slot = roster.slots[roster.currentIndex];
		if (!slot) return;

		slot.completed = true;
		roster.currentIndex++;

		// Skip already-completed slots (shouldn't happen but safe)
		while (roster.currentIndex < roster.slots.length && roster.slots[roster.currentIndex].completed) {
			roster.currentIndex++;
		}

		// Win condition: all completed
		if (roster.slots.every(s => s.completed)) {
			this.session.winner = 'local';
			if (this.fullRosterStartTime != null) {
				const timeSeconds = Math.floor((Date.now() - this.fullRosterStartTime) / 1000);
				this.saveFullRosterRecord(timeSeconds, roster.slots.length);
			}
		}
	}

	private processChallenge(didWin: boolean) {
		if (!this.session) return;
		const roster = this.session.localRoster;

		if (!didWin) {
			// Reset all progress
			roster.slots.forEach(s => { s.completed = false; });
			roster.currentIndex = 0;
			this.messageHandler.sendMessage('Notification', 'Iron Man Challenge reset!', NotificationType.Warning);
			return;
		}

		const slot = roster.slots[roster.currentIndex];
		if (!slot) return;
		slot.completed = true;
		roster.currentIndex++;

		// Win: all completed
		if (roster.slots.every(s => s.completed)) {
			this.session.winner = 'local';
			if (this.challengeStartTime != null) {
				const timeSeconds = Math.floor((Date.now() - this.challengeStartTime) / 1000);
				this.saveChallengeRecord(timeSeconds, roster.slots.length);
			}
		}
	}

	// ── Peer sync ─────────────────────────────────────────────────────────────

	private syncWithPeer() {
		if (!this.session || !this.peerSocket?.readyState === null) return;
		if (this.peerSocket?.readyState !== WebSocket.OPEN) return;

		this.peerSocket.send(JSON.stringify({
			type: 'IronManRosterUpdate',
			roster: this.session.localRoster,
		} as IronManPeerMessage));
	}

	private applyOpponentRosterUpdate(roster: IronManRoster) {
		if (!this.session) return;
		this.session.opponentRoster = roster;
		this.emitState();
	}

	// ── Leaderboard ───────────────────────────────────────────────────────────

	private saveChallengeRecord(timeSeconds: number, rosterSize: number) {
		const entry: IronManLeaderboardEntry = { timeSeconds, completedAt: Date.now(), version: this.app.getVersion(), rosterSize };
		const updated = [...this.settingsStore.getIronManLeaderboard(), entry]
			.sort((a, b) => a.timeSeconds - b.timeSeconds).slice(0, 10);
		this.settingsStore.setIronManLeaderboard(updated);
		this.emitLeaderboard();
	}

	private saveFullRosterRecord(timeSeconds: number, rosterSize: number) {
		const entry: IronManLeaderboardEntry = { timeSeconds, completedAt: Date.now(), version: this.app.getVersion(), rosterSize };
		const updated = [...this.settingsStore.getIronManFullRosterLeaderboard(), entry]
			.sort((a, b) => a.timeSeconds - b.timeSeconds).slice(0, 10);
		this.settingsStore.setIronManFullRosterLeaderboard(updated);
		this.emitLeaderboard();
	}

	private saveStandardRecord(timeSeconds: number, rosterSize: number, wins: number) {
		const entry: IronManLeaderboardEntry = { timeSeconds, completedAt: Date.now(), version: this.app.getVersion(), rosterSize, wins };
		const updated = [...this.settingsStore.getIronManStandardLeaderboard(), entry]
			.sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0) || a.timeSeconds - b.timeSeconds).slice(0, 10);
		this.settingsStore.setIronManStandardLeaderboard(updated);
		this.emitLeaderboard();
	}

	private emitLeaderboard() {
		this.messageHandler.sendMessage('IronManLeaderboard', {
			currentVersion: this.app.getVersion(),
			records: this.settingsStore.getIronManLeaderboard(),
			fullRosterRecords: this.settingsStore.getIronManFullRosterLeaderboard(),
			standardRecords: this.settingsStore.getIronManStandardLeaderboard(),
		});
	}

	// ── Helpers ───────────────────────────────────────────────────────────────

	private resetCurrentGame() {
		this.currentGameLocalCharId = null;
		this.currentGameOppCharId = null;
		this.currentGameValid = true;
		this.messageHandler.sendMessage('IronManCurrentChar', { localCharId: null, oppCharId: null });
	}

	public getSession(): IronManSession | null {
		return this.session;
	}

	public getLobby(): IronManLobbyPayload | null {
		return this.lobby;
	}

	private emitState() {
		this.messageHandler.sendMessage('IronManState', { session: this.session });
	}
}
