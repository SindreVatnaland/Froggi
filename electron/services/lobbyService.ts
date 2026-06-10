import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import type { App } from 'electron';
import WebSocket from 'ws';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { MessageHandler } from './messageHandler';
import { ElectronDolphinStore } from './store/storeDolphin';
import { BUILD_PUBLIC_GAME_WEBHOOK } from './reportWebhooks';
import { encryptUrl } from '../../frontend/src/lib/utils/urlCrypto';
import { NotificationType, ConnectionState } from '../../frontend/src/lib/models/enum';
import { scopedLog } from '../utils/logger';
import { newId } from '../utils/functions';
import type { CurrentPlayer } from '../../frontend/src/lib/models/types/slippiData';
import type { LobbyPlayer, LobbyState, MinigameType, LobbyPeerMessage } from '../../frontend/src/lib/models/types/lobby';
import type { BingoLobbyPayload, BingoStatePayload } from '../../frontend/src/lib/models/types/bingo';
import type { IronManLobbyPayload, IronManStatePayload } from '../../frontend/src/lib/models/types/ironman';

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
	private localDolphinConnected = false;

	private active = false;
	private isHost = false;
	private selectedGame: MinigameType | null = null;
	private maxPlayers = 2;
	private isPublic = false;

	// Host side: connected guests by player id.
	private guestSockets = new Map<string, WebSocket>();
	private players: LobbyPlayer[] = [];

	// Guest side.
	private hostSocket: WebSocket | null = null;
	private myAssignedId: string | null = null;

	// Public invite (Discord webhook). Posted on host open, deleted on start/stop.
	private readonly inviteWebhook = process.env.DISCORD_PUBLIC_GAME_WEBHOOK?.trim() || BUILD_PUBLIC_GAME_WEBHOOK || '';
	private inviteMessageId: string | null = null;

	// Bingo/Iron Man host lobby (hosting stays in those services — this only lets the
	// public invite track a host lobby). gameActive = a session is running.
	private minigameHost: { players: number; maxPlayers: number; gameActive: boolean } | null = null;

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('App') private app: App,
		@inject('LocalEmitter') private localEmitter: TypedEmitter,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(delay(() => ElectronDolphinStore)) private dolphinStore: ElectronDolphinStore,
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

		this.localEmitter.on('DolphinConnectionState', (state: ConnectionState | undefined) => {
			this.onDolphinState(state === ConnectionState.Connected);
		});

		this.clientEmitter.on('StartLobby', () => this.startLobby());
		this.clientEmitter.on('PeerConnect', (hostUrl: string) => this.connectToHost(hostUrl));
		this.clientEmitter.on('SelectMinigame', (game: MinigameType | null) => this.selectMinigame(game));
		this.clientEmitter.on('KickPlayer', (playerId: string) => this.kickPlayer(playerId));
		this.clientEmitter.on('LeaveLobby', () => this.leaveLobby());
		this.clientEmitter.on('StartMinigame', () => this.startMinigame());
		this.clientEmitter.on('SetLobbyPublic', (isPublic: boolean) => this.setPublic(isPublic));

		// The public invite also covers the bingo/ironman host lobby — those services
		// own hosting, we just mirror their lobby/session state to drive the Discord post.
		this.localEmitter.on('BingoLobbyState', (lobby: BingoLobbyPayload | null) => this.onMinigameLobby(lobby));
		this.localEmitter.on('IronManLobbyState', (lobby: IronManLobbyPayload | null) => this.onMinigameLobby(lobby));
		this.localEmitter.on('BingoState', (data: BingoStatePayload) => this.onMinigameSession(!!data?.session));
		this.localEmitter.on('IronManState', (data: IronManStatePayload) => this.onMinigameSession(!!data?.session));
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
					const data = (msg.payload ?? {}) as { name?: string; connectCode?: string; dolphinConnected?: boolean };
					playerId = newId();
					const player: LobbyPlayer = {
						id: playerId,
						name: data.name || 'Player',
						connectCode: data.connectCode,
						isHost: false,
						isLocal: false,
						dolphinConnected: !!data.dolphinConnected,
					};
					this.players.push(player);
					this.guestSockets.set(playerId, ws);
					ws.send(JSON.stringify({
						scope: 'lobby', type: 'Welcome', version: myVersion,
						payload: { yourId: playerId, players: this.players, selectedGame: this.selectedGame, maxPlayers: this.maxPlayers },
					} satisfies LobbyPeerMessage));
					this.broadcastRoster();
					this.emitState();
					void this.updateInvite();
					this.log.info(`Guest joined: ${player.name} (${this.players.length}/${this.maxPlayers})`);
					return;
				}

				// A guest reporting its Dolphin connection state.
				if (msg.scope === 'lobby' && msg.type === 'DolphinStatus' && playerId) {
					const connected = !!(msg.payload as { connected?: boolean })?.connected;
					const player = this.players.find(p => p.id === playerId);
					if (player && player.dolphinConnected !== connected) {
						player.dolphinConnected = connected;
						this.broadcastRoster();
						this.emitState();
					}
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
				void this.updateInvite();
				this.log.info(`Guest left (${this.players.length}/${this.maxPlayers})`);
			});

			ws.on('error', (err) => this.log.warn('Lobby peer socket error:', err));
		});
	}

	// ── Host actions ───────────────────────────────────────────────────────────

	/** Read current Dolphin connection from the store so a lobby opened after Dolphin connected is accurate. */
	private syncLocalDolphin() {
		this.localDolphinConnected = this.dolphinStore.getDolphinConnectionState() === ConnectionState.Connected;
	}

	private startLobby() {
		this.teardown();
		this.syncLocalDolphin();
		this.active = true;
		this.isHost = true;
		this.selectedGame = null;
		this.isPublic = false;
		this.players = [{
			id: this.localPlayerId,
			name: this.localPlayerName,
			connectCode: this.localConnectCode,
			isHost: true,
			isLocal: true,
			dolphinConnected: this.localDolphinConnected,
		}];
		this.log.info('Lobby opened (hosting)');
		this.emitState();
	}

	/** Host toggles public hosting. On → post a Discord invite (anyone can join); off → remove it. */
	private setPublic(isPublic: boolean) {
		if (isPublic === this.isPublic) return;
		this.isPublic = isPublic;
		// Post/delete now if a lobby is open; otherwise remember the intent — onMinigameLobby
		// posts once the host picks a game and the lobby opens.
		const hasLobby = (this.isHost && this.active) || (!!this.minigameHost && !this.minigameHost.gameActive);
		if (hasLobby) {
			if (isPublic) void this.postInvite();
			else void this.deleteInvite();
		}
		this.emitState();
	}

	/** Mirror a bingo/ironman host lobby so the public invite tracks it (post/update/delete). */
	private onMinigameLobby(lobby: BingoLobbyPayload | IronManLobbyPayload | null) {
		if (!lobby) {
			// Host stopped — tear down the invite and forget the lobby.
			if (this.minigameHost) {
				this.minigameHost = null;
				this.isPublic = false;
				void this.deleteInvite();
			}
			return;
		}
		this.minigameHost = { players: 1 + (lobby.opponentConnected ? 1 : 0), maxPlayers: 2, gameActive: false };
		if (this.isPublic) {
			if (this.inviteMessageId) void this.updateInvite();
			else void this.postInvite();
		}
	}

	/** A minigame session started/ended — pull the invite while a game is live. */
	private onMinigameSession(active: boolean) {
		if (!this.minigameHost) return;
		this.minigameHost.gameActive = active;
		// Game started: remove the post and reset public so it stays in sync with the
		// host UI (which resets its toggle). Host can re-toggle public on the next lobby.
		if (active) { this.isPublic = false; void this.deleteInvite(); }
	}

	/** Local Dolphin connection changed — reflect it in the roster (host) or report it (guest). */
	private onDolphinState(connected: boolean) {
		if (connected === this.localDolphinConnected) return;
		this.localDolphinConnected = connected;
		if (!this.active) return;
		if (this.isHost) {
			const me = this.players.find(p => p.id === this.localPlayerId);
			if (me) me.dolphinConnected = connected;
			this.broadcastRoster();
			this.emitState();
		} else {
			this.broadcast({ scope: 'lobby', type: 'DolphinStatus', payload: { connected } });
		}
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
		void this.updateInvite();
		this.log.info(`Kicked player ${playerId}`);
	}

	private startMinigame() {
		if (!this.isHost || !this.selectedGame) return;
		void this.deleteInvite();
		this.broadcast({ scope: 'lobby', type: 'Start', payload: { game: this.selectedGame } });
		// Handoff to the minigame service (wired in steps 2-3).
		this.localEmitter.emit('LobbyStartMinigame', { game: this.selectedGame, players: this.players });
		this.log.info(`Starting minigame: ${this.selectedGame}`);
	}

	// ── Public invite (Discord webhook) ────────────────────────────────────────

	/** Build the invite embed from current lobby state (host name, spots left, version, join link). */
	private buildInviteEmbed() {
		// ngrok-only — keeps the connect code consistent with the RPC join secret.
		const ngrok = this.messageHandler.getNgrokUrl();
		const code = ngrok ? encryptUrl(ngrok.replace(/\/$/, ''), this.app.getVersion()) : '';
		const deepLink = `froggi://join/${code}`;
		const maxPlayers = this.minigameHost?.maxPlayers ?? this.maxPlayers;
		const playerCount = this.minigameHost?.players ?? this.players.length;
		const spots = Math.max(0, maxPlayers - playerCount);
		const full = spots === 0 || !code;
		// Drop the join link once the lobby is full so no one else clicks in.
		const joinLines = full
			? '**Lobby full** — no spots left.'
			: `[Click here to join](${deepLink})\n` +
			  `or paste this code in Froggi → Minigames → Join:\n\`${code}\``;
		return {
			title: '🐸 Froggi lobby open',
			description:
				`**${this.localPlayerName}** is hosting a lobby.\n\n` +
				`**Spots:** ${spots} of ${maxPlayers} open\n` +
				`**Version:** ${this.app.getVersion()}\n\n` +
				joinLines,
			color: full ? 0xf59e0b : 0x4ade80,
		};
	}

	/** Post the public invite to the Discord channel. No-op without a webhook or active tunnel. */
	private async postInvite() {
		if (!this.inviteWebhook || this.inviteMessageId) return;
		if (!this.messageHandler.getNgrokUrl()) {
			this.log.info('Public invite skipped — no ngrok tunnel active');
			return;
		}
		try {
			const res = await fetch(`${this.inviteWebhook}?wait=true`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ embeds: [this.buildInviteEmbed()] }),
			});
			if (!res.ok) {
				this.log.warn(`Public invite POST failed: HTTP ${res.status}`);
				return;
			}
			const json = (await res.json().catch(() => null)) as { id?: string } | null;
			this.inviteMessageId = json?.id ?? null;
			this.log.info('Public invite posted', this.inviteMessageId);
		} catch (err) {
			this.log.warn('Public invite POST error:', err);
		}
	}

	/** Edit the live invite to reflect the current spot count. No-op unless public + already posted. */
	private async updateInvite() {
		if (!this.inviteWebhook || !this.isPublic || !this.inviteMessageId) return;
		try {
			const res = await fetch(`${this.inviteWebhook}/messages/${this.inviteMessageId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ embeds: [this.buildInviteEmbed()] }),
			});
			if (!res.ok && res.status !== 404) this.log.warn(`Public invite edit failed: HTTP ${res.status}`);
		} catch (err) {
			this.log.warn('Public invite edit error:', err);
		}
	}

	/** Delete the previously posted invite (on minigame start or lobby teardown). */
	private async deleteInvite() {
		const id = this.inviteMessageId;
		this.inviteMessageId = null;
		if (!this.inviteWebhook || !id) return;
		try {
			const res = await fetch(`${this.inviteWebhook}/messages/${id}`, { method: 'DELETE' });
			if (!res.ok && res.status !== 404) this.log.warn(`Public invite delete failed: HTTP ${res.status}`);
			else this.log.info('Public invite deleted');
		} catch (err) {
			this.log.warn('Public invite delete error:', err);
		}
	}

	// ── Guest: connect to a host ───────────────────────────────────────────────

	private connectToHost(hostUrl: string) {
		this.teardown();
		this.syncLocalDolphin();
		const wsUrl = hostUrl.replace(/^http/, 'ws').replace(/\/$/, '') + '/peer';
		this.log.info('Connecting to host lobby', wsUrl);

		const ws = new WebSocket(wsUrl);
		this.hostSocket = ws;
		this.isHost = false;

		ws.on('open', () => {
			ws.send(JSON.stringify({
				scope: 'lobby', type: 'Join', version: this.app.getVersion(),
				payload: { name: this.localPlayerName, connectCode: this.localConnectCode, dolphinConnected: this.localDolphinConnected },
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
							this.localEmitter.emit('LobbyStartMinigame', { game: p.game, players: this.players });
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
		return { active: true, isHost: this.isHost, players, maxPlayers: this.maxPlayers, selectedGame: this.selectedGame, isPublic: this.isPublic };
	}

	private emitState() {
		this.messageHandler.sendMessage('LobbyState', this.currentState());
	}

	private teardown() {
		void this.deleteInvite();
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
		this.isPublic = false;
		this.myAssignedId = null;
	}
}

/** Compatible if major.minor match (patch/beta differences allowed). */
function versionsCompatible(a: string, b: string): boolean {
	if (!a || !b) return false;
	const norm = (v: string) => v.split('-')[0].split('.').slice(0, 2).join('.');
	return norm(a) === norm(b);
}
