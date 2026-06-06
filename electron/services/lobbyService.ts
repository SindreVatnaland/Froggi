import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import type { App } from 'electron';
import WebSocket from 'ws';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { MessageHandler } from './messageHandler';
import { NotificationType } from '../../frontend/src/lib/models/enum';
import { scopedLog } from '../utils/logger';
import { newId } from '../utils/functions';
import type { CurrentPlayer } from '../../frontend/src/lib/models/types/slippiData';
import type { LobbyPlayer, LobbyState, MinigameType, LobbyPeerMessage } from '../../frontend/src/lib/models/types/lobby';

/**
 * Game-agnostic lobby and peer transport.
 *
 * Host opens a lobby, others join over the shared `/peer` socket, then the host
 * picks a minigame and starts it for everyone. Minigame services (bingo, ironman)
 * ride on top via the `scope` envelope — they no longer own a peer connection.
 *
 * Capped at 2 players today; the roster is an array so raising the cap later does
 * not change the shape.
 */
@singleton()
export class LobbyService {
	private readonly localPlayerId = newId();
	private localPlayerName = 'Player';
	private localConnectCode: string | undefined;

	private active = false;
	private isHost = false;
	private selectedGame: MinigameType | null = null;
	private maxPlayers = 2;

	// Host side: connected guests by player id.
	private guestSockets = new Map<string, WebSocket>();
	private players: LobbyPlayer[] = [];

	// Guest side.
	private hostSocket: WebSocket | null = null;
	private myAssignedId: string | null = null;

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('App') private app: App,
		@inject('LocalEmitter') private localEmitter: TypedEmitter,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
	) {
		this.log = scopedLog(this.log, 'Lobby');
		this.log.info('Initializing Lobby Service');
		this.initPeerServer();
		this.initEventListeners();
	}

	// ── Local player identity ──────────────────────────────────────────────────

	private initEventListeners() {
		this.localEmitter.on('CurrentPlayer', (player: CurrentPlayer | undefined) => {
			if (player?.displayName) this.localPlayerName = player.displayName;
			this.localConnectCode = player?.connectCode ?? this.localConnectCode;
		});

		this.clientEmitter.on('StartLobby', () => this.startLobby());
		this.clientEmitter.on('PeerConnect', (hostUrl: string) => this.connectToHost(hostUrl));
		this.clientEmitter.on('SelectMinigame', (game: MinigameType | null) => this.selectMinigame(game));
		this.clientEmitter.on('KickPlayer', (playerId: string) => this.kickPlayer(playerId));
		this.clientEmitter.on('LeaveLobby', () => this.leaveLobby());
		this.clientEmitter.on('StartMinigame', () => this.startMinigame());
	}

	// ── Host: accept incoming peers ────────────────────────────────────────────

	private initPeerServer() {
		this.messageHandler.lobbyPeerWss.on('connection', (ws: WebSocket) => {
			if (!this.active || !this.isHost) {
				ws.close(1008, 'No open lobby');
				return;
			}
			if (this.players.length >= this.maxPlayers) {
				ws.close(1008, 'Lobby full');
				return;
			}

			let playerId: string | null = null;

			ws.on('message', (raw) => {
				let msg: LobbyPeerMessage;
				try {
					msg = JSON.parse(raw.toString());
				} catch (err) {
					this.log.error('Lobby peer message parse error:', err);
					return;
				}

				if (msg.scope === 'lobby' && msg.type === 'Join') {
					const theirVersion = msg.version ?? '';
					const myVersion = this.app.getVersion();
					if (!versionsCompatible(myVersion, theirVersion)) {
						ws.send(JSON.stringify({ scope: 'lobby', type: 'Error', payload: { reason: `Version mismatch: host ${myVersion}, guest ${theirVersion}` } } satisfies LobbyPeerMessage));
						ws.close(1008, 'Version mismatch');
						return;
					}
					const data = (msg.payload ?? {}) as { name?: string; connectCode?: string };
					playerId = newId();
					const player: LobbyPlayer = {
						id: playerId,
						name: data.name || 'Player',
						connectCode: data.connectCode,
						isHost: false,
						isLocal: false,
					};
					this.players.push(player);
					this.guestSockets.set(playerId, ws);
					ws.send(JSON.stringify({
						scope: 'lobby', type: 'Welcome', version: myVersion,
						payload: { yourId: playerId, players: this.players, selectedGame: this.selectedGame, maxPlayers: this.maxPlayers },
					} satisfies LobbyPeerMessage));
					this.broadcastRoster();
					this.emitState();
					this.log.info(`Guest joined: ${player.name} (${this.players.length}/${this.maxPlayers})`);
					return;
				}

				// Tunnel minigame traffic to the relevant service.
				if (msg.scope !== 'lobby') {
					this.localEmitter.emit('LobbyPeerMessage', { scope: msg.scope, type: msg.type, payload: msg.payload, fromPlayerId: playerId });
				}
			});

			ws.on('close', () => {
				if (!playerId) return;
				this.guestSockets.delete(playerId);
				this.players = this.players.filter(p => p.id !== playerId);
				this.broadcastRoster();
				this.emitState();
				this.log.info(`Guest left (${this.players.length}/${this.maxPlayers})`);
			});

			ws.on('error', (err) => this.log.warn('Lobby peer socket error:', err));
		});
	}

	// ── Host actions ───────────────────────────────────────────────────────────

	private startLobby() {
		this.teardown();
		this.active = true;
		this.isHost = true;
		this.selectedGame = null;
		this.players = [{
			id: this.localPlayerId,
			name: this.localPlayerName,
			connectCode: this.localConnectCode,
			isHost: true,
			isLocal: true,
		}];
		this.log.info('Lobby opened (hosting)');
		this.emitState();
	}

	private selectMinigame(game: MinigameType | null) {
		if (!this.isHost) return;
		this.selectedGame = game;
		this.broadcastRoster();
		this.emitState();
	}

	private kickPlayer(playerId: string) {
		if (!this.isHost) return;
		const ws = this.guestSockets.get(playerId);
		if (ws) {
			try { ws.send(JSON.stringify({ scope: 'lobby', type: 'Kick' } satisfies LobbyPeerMessage)); } catch { /* ignore */ }
			ws.close(1000, 'Kicked');
		}
		this.guestSockets.delete(playerId);
		this.players = this.players.filter(p => p.id !== playerId);
		this.broadcastRoster();
		this.emitState();
		this.log.info(`Kicked player ${playerId}`);
	}

	private startMinigame() {
		if (!this.isHost || !this.selectedGame) return;
		this.broadcast({ scope: 'lobby', type: 'Start', payload: { game: this.selectedGame } });
		// Handoff to the minigame service (wired in steps 2-3).
		this.localEmitter.emit('LobbyStartMinigame', { game: this.selectedGame, players: this.players });
		this.log.info(`Starting minigame: ${this.selectedGame}`);
	}

	// ── Guest: connect to a host ───────────────────────────────────────────────

	private connectToHost(hostUrl: string) {
		this.teardown();
		const wsUrl = hostUrl.replace(/^http/, 'ws').replace(/\/$/, '') + '/peer';
		this.log.info('Connecting to host lobby', wsUrl);

		const ws = new WebSocket(wsUrl);
		this.hostSocket = ws;
		this.isHost = false;

		ws.on('open', () => {
			ws.send(JSON.stringify({
				scope: 'lobby', type: 'Join', version: this.app.getVersion(),
				payload: { name: this.localPlayerName, connectCode: this.localConnectCode },
			} satisfies LobbyPeerMessage));
		});

		ws.on('message', (raw) => {
			let msg: LobbyPeerMessage;
			try { msg = JSON.parse(raw.toString()); } catch { return; }

			if (msg.scope === 'lobby') {
				const p = (msg.payload ?? {}) as { yourId?: string; players?: LobbyPlayer[]; selectedGame?: MinigameType | null; maxPlayers?: number; game?: MinigameType; reason?: string };
				switch (msg.type) {
					case 'Welcome':
						this.active = true;
						this.myAssignedId = p.yourId ?? null;
						this.players = p.players ?? [];
						this.selectedGame = p.selectedGame ?? null;
						this.maxPlayers = p.maxPlayers ?? 2;
						this.emitState();
						break;
					case 'Roster':
						this.players = p.players ?? this.players;
						this.selectedGame = p.selectedGame ?? this.selectedGame;
						this.emitState();
						break;
					case 'Start':
						if (p.game) {
							this.selectedGame = p.game;
							this.localEmitter.emit('LobbyStartMinigame', { game: p.game, players: this.players } as never);
						}
						break;
					case 'Kick':
						this.messageHandler.sendMessage('Notification', 'You were removed from the lobby', NotificationType.Warning, 4000);
						this.leaveLobby();
						break;
					case 'Error':
						this.messageHandler.sendMessage('Notification', p.reason ?? 'Failed to join lobby', NotificationType.Danger, 5000);
						this.leaveLobby();
						break;
				}
				return;
			}

			// Tunnel minigame traffic to the relevant service.
			this.localEmitter.emit('LobbyPeerMessage', { scope: msg.scope, type: msg.type, payload: msg.payload, fromPlayerId: null });
		});

		ws.on('close', () => {
			if (this.hostSocket === ws) {
				this.log.info('Disconnected from host lobby');
				this.teardown();
				this.emitState();
			}
		});
		ws.on('error', (err) => this.log.warn('Lobby host socket error:', err));
	}

	private leaveLobby() {
		this.log.info('Leaving lobby');
		this.teardown();
		this.emitState();
	}

	// ── Shared transport for minigame services (steps 2-3) ─────────────────────

	/** Broadcast a scoped message to all peers (host → guests, or guest → host). */
	sendToPeers(scope: MinigameType, type: string, payload?: unknown) {
		this.broadcast({ scope, type, payload });
	}

	getPlayers(): LobbyPlayer[] {
		return this.players;
	}

	isActive(): boolean {
		return this.active;
	}

	// ── Internals ──────────────────────────────────────────────────────────────

	private broadcast(msg: LobbyPeerMessage) {
		const json = JSON.stringify(msg);
		if (this.isHost) {
			for (const ws of this.guestSockets.values()) {
				if (ws.readyState === WebSocket.OPEN) ws.send(json);
			}
		} else if (this.hostSocket?.readyState === WebSocket.OPEN) {
			this.hostSocket.send(json);
		}
	}

	private broadcastRoster() {
		this.broadcast({ scope: 'lobby', type: 'Roster', payload: { players: this.players, selectedGame: this.selectedGame } });
	}

	/** Build this machine's view of the lobby (isLocal relative to us). */
	private currentState(): LobbyState | null {
		if (!this.active) return null;
		const myId = this.isHost ? this.localPlayerId : this.myAssignedId;
		const players = this.players.map(p => ({ ...p, isLocal: p.id === myId }));
		return { active: true, isHost: this.isHost, players, maxPlayers: this.maxPlayers, selectedGame: this.selectedGame };
	}

	private emitState() {
		this.messageHandler.sendMessage('LobbyState', this.currentState());
	}

	private teardown() {
		for (const ws of this.guestSockets.values()) {
			try { ws.close(1000, 'Lobby closed'); } catch { /* ignore */ }
		}
		this.guestSockets.clear();
		if (this.hostSocket) {
			try { this.hostSocket.close(1000, 'Left'); } catch { /* ignore */ }
			this.hostSocket = null;
		}
		this.players = [];
		this.active = false;
		this.isHost = false;
		this.selectedGame = null;
		this.myAssignedId = null;
	}
}

/** Compatible if major.minor match (patch/beta differences allowed). */
function versionsCompatible(a: string, b: string): boolean {
	if (!a || !b) return false;
	const norm = (v: string) => v.split('-')[0].split('.').slice(0, 2).join('.');
	return norm(a) === norm(b);
}
