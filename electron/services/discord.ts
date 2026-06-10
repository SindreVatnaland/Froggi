import type { ElectronLog } from 'electron-log';
import { delay, inject, singleton } from 'tsyringe';
import { Client, Presence } from 'discord-rpc';
import { LiveStatsScene } from '../../frontend/src/lib/models/enum';
import type { FrameEntryType } from '@slippi/slippi-js/dist/types';
import { GameStartType } from '@slippi/slippi-js';
import type { BingoStatePayload, BingoSession, BingoLobbyPayload } from '../../frontend/src/lib/models/types/bingo';
import type { IronManStatePayload, IronManSession } from '../../frontend/src/lib/models/types/ironman';
import { ElectronLiveStatsStore } from './store/storeLiveStats';
import { ElectronPlayersStore } from './store/storePlayers';
import { ElectronGamesStore } from './store/storeGames';
import { ElectronCurrentPlayerStore } from './store/storeCurrentPlayer';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { encryptUrl } from '../../frontend/src/lib/utils/urlCrypto';
import { MessageHandler } from './messageHandler';
import { app } from 'electron';
import { debounce, throttle, startCase } from 'lodash';
import { BUILD_DISCORD_CLIENT_ID } from './reportWebhooks';

const FROGGI_URL = 'https://sindrevatnaland.github.io/Froggi/';

@singleton()
export class DiscordRpc {
	rpc: Client = new Client({ transport: 'ipc' });
	activity: Presence;
	private activeBingoSession: BingoSession | null = null;
	private activeBingoLobby: BingoLobbyPayload | null = null;
	private activeIronManSession: IronManSession | null = null;
	private ngrokUrl: string | undefined = undefined;

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('LocalEmitter') private localEmitter: TypedEmitter,
		@inject(delay(() => ElectronGamesStore)) private storeGames: ElectronGamesStore,
		@inject(delay(() => ElectronLiveStatsStore)) private storeLiveStats: ElectronLiveStatsStore,
		@inject(delay(() => ElectronPlayersStore)) private storePlayers: ElectronPlayersStore,
		@inject(delay(() => ElectronCurrentPlayerStore))
		private storeCurrentPlayer: ElectronCurrentPlayerStore,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
	) {
		this.initDiscordJs();
	}

	initDiscordJs() {
		this.log.info('Initializing Discord RPC');
		const clientId = (BUILD_DISCORD_CLIENT_ID || process.env.DISCORD_FROGGI_CLIENT_ID || '').trim();
		if (!clientId) {
			this.log.warn('Discord RPC client id not set (BUILD_DISCORD_CLIENT_ID / DISCORD_FROGGI_CLIENT_ID) — skipping Rich Presence');
			return;
		}
		this.rpc
			.login({ clientId })
			.catch((err) => this.log.error('err', err));
		this.rpc.on('ready', async () => {
			this.setNonGameActivity('Menu');
			this.initDiscordEvents();
			try {
				await (this.rpc as Client & { subscribe: (event: string, cb: (data: unknown) => void) => Promise<unknown> })
					.subscribe('ACTIVITY_JOIN', (data: unknown) => {
						const secret = (data as { secret?: string })?.secret;
						this.log.info('Discord ACTIVITY_JOIN received, secret:', secret);
						// Route through the normal connect-code join (detects bingo/ironman via /lobby-info).
						if (secret) this.messageHandler.sendMessage('JoinWithCode', secret);
					});
				this.log.info('Discord: subscribed to ACTIVITY_JOIN');
			} catch (err) {
				this.log.warn('Discord: ACTIVITY_JOIN subscription failed (likely needs OAuth):', err);
			}
		});
	}

	private initDiscordEvents = () => {
		this.localEmitter.on('LiveStatsSceneChange', async (scene: LiveStatsScene) => {
			if ([LiveStatsScene.InGame].includes(scene)) return;
			await this.setNonGameActivity('Menu');
		});

		this.localEmitter.on('GameSettings', async (settings: GameStartType | undefined) => {
			if (!settings) return;
			const mode = startCase(this.storeLiveStats.getGameSettings()?.matchInfo.mode ?? 'Local');
			const score = this.storeGames.getGameScore() ?? [0, 0];
			const currentPlayer = await this.storeCurrentPlayer.getCurrentPlayer();
			const players = this.storePlayers.getCurrentPlayers();
			const player1 = players?.at(0);
			const player2 = players?.at(1);
			const timer = futureTimerEpoch(8 * 60 * 1000 + 2000);

			this.activity = {
				...this.activity,
				details: `${mode} - In Game`,
				endTimestamp: timer,
				buttons: [
					buttonBuilder(player1?.connectCode, player1?.characterId, player1?.startStocks),
					buttonBuilder(player2?.connectCode, player2?.characterId, player2?.startStocks),
				],
				largeImageKey: `stage_${settings.stageId}`,
				largeImageText: StageConversion[settings.stageId ?? 2],
				smallImageKey: rankImageKey(currentPlayer?.rank?.current?.rank),
				smallImageText: currentPlayer?.rank?.current?.rank
					? `${currentPlayer.rank.current.rank} · ${currentPlayer.rank.current.rating?.toFixed(0) ?? '?'}`
					: undefined,
				state: `${player1?.connectCode ?? 'Player1'} (${score?.at(0)} - ${score.at(1)}) ${player2?.connectCode ?? 'Player2'}`,
				// Slippi game presence is not joinable — clear any minigame party/join.
				joinSecret: undefined,
				partyId: undefined,
				partySize: undefined,
				partyMax: undefined,
			};
			this.updateActivity();
		});

		this.localEmitter.on('GameFrame', debounce((frame: FrameEntryType | undefined | null) => {
			if (!frame) return;
			if (this.storeLiveStats.getStatsScene() !== LiveStatsScene.InGame) return;
			const players = this.storePlayers.getCurrentPlayers();
			const player1 = players?.at(0);
			const player2 = players?.at(1);
			const player1frame = frame.players?.[player1?.playerIndex ?? 0]?.post;
			const player2frame = frame.players?.[player2?.playerIndex ?? 0]?.post;
			const timer = futureTimerEpoch(
				8 * 60 * 1000 - (8 * 60 * 1000 * (frame.frame > 0 ? frame.frame : 0)) / (60 * 60 * 8),
			);
			this.activity = {
				...this.activity,
				buttons: [
					buttonBuilder(player1?.connectCode, player1?.characterId, player1frame?.stocksRemaining, player1frame?.percent),
					buttonBuilder(player2?.connectCode, player2?.characterId, player2frame?.stocksRemaining, player2frame?.percent),
				],
				endTimestamp: timer,
			};
			this.updateActivity();
		}, 1000, { trailing: true, maxWait: 1200 }));

		this.localEmitter.on('PostGameStats', async () => {
			const players = this.storePlayers.getCurrentPlayers();
			const player1 = players?.at(0);
			const player2 = players?.at(1);
			const score = this.storeGames.getGameScore() ?? [0, 0];
			const mode = this.storeLiveStats.getGameSettings()?.matchInfo.mode ?? 'Local';
			const details = `${mode} - Menu`;
			const state = `${player1?.connectCode ?? 'Player1'} (${score?.at(0)} - ${score.at(1)}) ${player2?.connectCode ?? 'Player2'}`;
			await this.setNonGameActivity(details, state);
		});

		this.localEmitter.on('GameScore', (score: number[]) => {
			const players = this.storePlayers.getCurrentPlayers();
			const player1 = players?.at(0);
			const player2 = players?.at(1);
			this.activity = {
				...this.activity,
				state: `${player1?.connectCode ?? 'Player1'} - ${player2?.connectCode ?? 'Player2'} (${score.join(' - ')})`,
			};
			this.updateActivity();
		});

		this.localEmitter.on('RemoteAccessStatus', (url: string | undefined, provider: 'tailscale' | 'ngrok' | undefined) => {
			// Lobby invites only use ngrok — the join secret is the encrypted ngrok connect code.
			if (provider === 'ngrok') this.ngrokUrl = url || undefined;
		});

		this.localEmitter.on('BingoLobbyState', (data: BingoLobbyPayload | null) => {
			this.activeBingoLobby = data;
			if (data) {
				this.setLobbyActivity(data);
			} else if (!this.activeBingoSession && !this.activeIronManSession) {
				this.setNonGameActivity('Menu');
			}
		});

		// ── Minigame presence ────────────────────────────────────────────────────

		this.localEmitter.on('BingoState', debounce((data: BingoStatePayload) => {
			if (data.session) {
				this.activeBingoSession = data.session;
				this.setBingoActivity(data.session);
			} else {
				this.activeBingoSession = null;
				if (!this.activeIronManSession) this.setNonGameActivity('Menu');
			}
		}, 2000, { trailing: true, maxWait: 5000 }));

		this.localEmitter.on('IronManState', debounce((data: IronManStatePayload) => {
			if (data.session) {
				this.activeIronManSession = data.session;
				this.setIronManActivity(data.session);
			} else {
				this.activeIronManSession = null;
				if (!this.activeBingoSession) this.setNonGameActivity('Menu');
			}
		}, 2000, { trailing: true, maxWait: 5000 }));
	};

	/**
	 * Party + join fields for a minigame presence.
	 * - Discord only shows the "Join" button when secrets.join is paired with a party (id + size).
	 * - joinSecret is set only for the host and only while there's room (party not full).
	 * - The join secret is the encrypted ngrok connect code (no raw URL); the guest receives
	 *   it via ACTIVITY_JOIN and feeds it into BingoPeerConnect, which decrypts and connects.
	 * - Solo sessions get no party (nothing to join).
	 */
	private buildPartyJoin(
		gameKey: string,
		role: 'solo' | 'host' | 'guest' | 'local',
		opponentConnected: boolean,
	): Pick<Presence, 'partyId' | 'partySize' | 'partyMax' | 'joinSecret'> {
		if (role === 'solo' || role === 'local') {
			return { partyId: undefined, partySize: undefined, partyMax: undefined, joinSecret: undefined };
		}
		const hasRoom = !opponentConnected; // party is 2 max for now
		const joinSecret = role === 'host' && hasRoom && this.ngrokUrl
			? encryptUrl(this.ngrokUrl.replace(/\/$/, ''), app.getVersion())
			: undefined;
		return {
			partyId: `froggi-${gameKey}`,
			partySize: opponentConnected ? 2 : 1,
			partyMax: 2,
			joinSecret,
		};
	}

	private setLobbyActivity(lobby: BingoLobbyPayload) {
		// Only the host has an ngrok URL, so its presence is the joinable one.
		const role = this.ngrokUrl ? 'host' : 'guest';
		const party = this.buildPartyJoin('bingo-lobby', role, lobby.opponentConnected);
		const state = lobby.opponentConnected
			? `${shortName(lobby.opponentName)} connected`
			: 'Waiting for opponent…';
		this.activity = {
			...this.activity,
			details: 'Bingo · Lobby',
			state,
			startTimestamp: undefined,
			endTimestamp: undefined,
			largeImageKey: 'froggi',
			largeImageText: 'Lobby',
			smallImageKey: undefined,
			buttons: party.joinSecret ? undefined : [{ label: 'Get Froggi', url: FROGGI_URL }],
			...party,
		};
		this.updateActivity();
	}

	private setBingoActivity(session: BingoSession) {
		const { board, settings, localName, opponentName, role, startedAt, winState } = session;
		const wc = winConditionLabel(settings.winCondition);
		const scoreTarget = winState?.scoreTarget ?? 1;
		const localScore = winState?.localScore ?? 0;
		const oppScore = winState?.oppScore ?? 0;
		const localPct = Math.round((localScore / scoreTarget) * 100);
		const oppPct = Math.round((oppScore / scoreTarget) * 100);

		const state = role === 'solo'
			? `${localPct}% · ${settings.difficulty}`
			: `${shortName(localName)} ${localPct}% · ${shortName(opponentName)} ${oppPct}%`;

		const hasCountdown = settings.timer?.enabled && settings.timer.durationMinutes > 0;
		const endTs = hasCountdown ? startedAt + settings.timer.durationMinutes * 60 * 1000 : undefined;

		const party = this.buildPartyJoin(`bingo-${board.id}`, role, session.opponentConnected);
		this.activity = {
			...this.activity,
			details: `Bingo · ${board.size}×${board.size} · ${wc}`,
			state: state.slice(0, 128),
			startTimestamp: hasCountdown ? undefined : startedAt,
			endTimestamp: endTs,
			largeImageKey: 'bingo',
			largeImageText: 'Bingo',
			smallImageKey: undefined,
			buttons: party.joinSecret ? undefined : [{ label: 'Get Froggi', url: FROGGI_URL }],
			...party,
		};
		this.updateActivity();
	}

	private setIronManActivity(session: IronManSession) {
		const { settings, localRoster, opponentRoster, localName, opponentName, role, startedAt, winner } = session;
		const variantLabel = settings.variant === 'standard' ? 'Standard'
			: settings.variant === 'full_roster' ? 'Full Roster'
			: 'Challenge';
		const localProgress = settings.variant === 'standard'
			? localRoster.slots.filter(s => !s.depleted).length
			: localRoster.slots.filter(s => s.completed).length;
		const total = localRoster.slots.length;

		let state: string;
		if (winner) {
			state = winner === 'local' ? `${shortName(localName)} wins!` : `${shortName(opponentName)} wins!`;
		} else if (role === 'solo') {
			state = `${localProgress}/${total} · ${variantLabel}`;
		} else {
			const oppProgress = opponentRoster
				? (settings.variant === 'standard'
					? opponentRoster.slots.filter(s => !s.depleted).length
					: opponentRoster.slots.filter(s => s.completed).length)
				: 0;
			state = `${shortName(localName)} ${localProgress}/${total} · ${shortName(opponentName)} ${oppProgress}/${opponentRoster?.slots.length ?? total}`;
		}

		const party = this.buildPartyJoin(`ironman-${startedAt}`, role, session.opponentConnected);
		this.activity = {
			...this.activity,
			details: `Iron Man · ${variantLabel} · ${total} chars`,
			state: state.slice(0, 128),
			startTimestamp: startedAt,
			endTimestamp: undefined,
			largeImageKey: 'ironman',
			largeImageText: 'Iron Man',
			smallImageKey: undefined,
			buttons: party.joinSecret ? undefined : [{ label: 'Get Froggi', url: FROGGI_URL }],
			...party,
		};
		this.updateActivity();
	}

	setNonGameActivity = async (menuActivity: string, state: string | undefined = undefined) => {
		this.log.info('Discord activity:', menuActivity);
		const currentPlayer = await this.storeCurrentPlayer.getCurrentPlayer();

		// If a minigame is active between Slippi games, show minigame presence instead
		if (!state && this.activeBingoSession) {
			this.setBingoActivity(this.activeBingoSession);
			return;
		}
		if (!state && this.activeBingoLobby) {
			this.setLobbyActivity(this.activeBingoLobby);
			return;
		}
		if (!state && this.activeIronManSession) {
			this.setIronManActivity(this.activeIronManSession);
			return;
		}

		this.activity = {
			...this.activity,
			buttons: [{ label: 'Get Froggi', url: FROGGI_URL }],
			details: menuActivity,
			endTimestamp: undefined,
			joinSecret: undefined,
			partyId: undefined,
			partySize: undefined,
			partyMax: undefined,
			largeImageKey: 'menu',
			largeImageText: menuActivity,
			smallImageKey: rankImageKey(currentPlayer?.rank?.current?.rank),
			smallImageText: currentPlayer?.rank?.current?.rank
				? `${currentPlayer.rank.current.rank} · ${currentPlayer.rank.current.rating?.toFixed(0) ?? '?'}`
				: undefined,
			state: state ?? `${currentPlayer?.rank?.current?.rank ?? 'No rank'} - ${currentPlayer?.rank?.current?.rating?.toFixed(1) ?? 'No rating'}`,
		};
		this.updateActivity();
	};

	updateActivity = throttle(() => {
		try {
			const a = this.activity;
			// Use request() directly — setActivity() strips the buttons array before sending
			const payload: Record<string, unknown> = {
				state: a.state,
				details: a.details,
				instance: false,
			};
			if (a.startTimestamp || a.endTimestamp) {
				payload.timestamps = {
					start: a.startTimestamp ? Number(a.startTimestamp) : undefined,
					end: a.endTimestamp ? Number(a.endTimestamp) : undefined,
				};
			}
			if (a.largeImageKey || a.largeImageText || a.smallImageKey) {
				payload.assets = {
					large_image: a.largeImageKey,
					large_text: a.largeImageText,
					small_image: a.smallImageKey,
					small_text: a.smallImageText,
				};
			}
			// Party enables Discord's "X of Y" display and is required for the Join button.
			if (a.partyId) {
				payload.party = { id: a.partyId, size: [a.partySize ?? 1, a.partyMax ?? 2] };
			}
			// Join button only renders when secrets.join AND party are both present.
			if (a.joinSecret && a.partyId) payload.secrets = { join: a.joinSecret };
			else if (a.buttons?.length) payload.buttons = a.buttons;
			(this.rpc as Client & { request: (cmd: string, args: unknown) => unknown }).request('SET_ACTIVITY', { pid: process.pid, activity: payload });
		} catch (err) {
			this.log.error(err);
		}
	}, 2000, { leading: true, trailing: true });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const futureTimerEpoch = (milliseconds: number) => {
	return new Date(Date.now() + milliseconds).getTime();
};

const rankImageKey = (rank: string | undefined): string | undefined => {
	if (!rank) return undefined;
	return rank.toLowerCase().replace(/ /g, '_');
};

// Keep names short so presence strings stay on one line (Discord best practice).
const shortName = (name: string | null | undefined, max = 12): string => {
	const n = (name ?? 'Player').trim();
	return n.length > max ? `${n.slice(0, max - 1)}…` : n;
};

const winConditionLabel = (wc: import('../../frontend/src/lib/models/types/bingo').BingoWinCondition): string => {
	if (wc === 'full') return 'Full Board';
	if (wc === 'lockout') return 'Lockout';
	if (wc === 'rowcontrol') return 'Row Control';
	return `${wc} line${wc > 1 ? 's' : ''}`;
};


const buttonBuilder = (
	connectCode: string | undefined,
	characterId: number | null | undefined,
	stocks: number | null | undefined = 4,
	percent: number | null | undefined = 0,
) => {
	let label = connectCode ? `${connectCode.split('#').at(0)}` : 'Player';
	if (characterId != null) label += ` - ${CharacterConversion[characterId] ?? '?'}`;
	if (stocks != null) label += ` - ${stocks}`;
	if (percent != null) label += ` - ${percent.toFixed()}%`;
	const url = `https://slippi.gg${connectCode ? `/user/${connectCode.replace('#', '-')}` : '/leaderboards'}`;
	return { label: label.slice(0, 32), url };
};

const CharacterConversion: Record<number, string> = {
	0: 'CF', 1: 'DK', 2: 'Fox', 3: 'G&W', 4: 'Kirby', 5: 'Bowser',
	6: 'Link', 7: 'Luigi', 8: 'Mario', 9: 'Marth', 10: 'Mew2', 11: 'Ness',
	12: 'Peach', 13: 'Pika', 14: 'ICs', 15: 'Puff', 16: 'Samus', 17: 'Yoshi',
	18: 'Zelda', 19: 'Sheik', 20: 'Falco', 21: 'YLink', 22: 'Dr.M',
	23: 'Roy', 24: 'Pichu', 25: 'Ganon',
};

const StageConversion: Record<number, string> = {
	2: 'Fountain of Dreams', 3: 'Pokémon Stadium', 4: "Peach's Castle",
	5: 'Kongo Jungle', 6: 'Brinstar', 7: 'Corneria', 8: "Yoshi's Story",
	9: 'Onett', 10: 'Mute City', 11: 'Rainbow Cruise', 12: 'Jungle Japes',
	13: 'Great Bay', 14: 'Temple', 15: 'Brinstar Depths', 16: "Yoshi's Island",
	17: 'Green Greens', 18: 'Fourside', 19: 'Mushroom Kingdom', 20: 'Mushroom Kingdom II',
	22: 'Venom', 23: 'Poké Floats', 24: 'Big Blue', 25: 'Icicle Mountain',
	27: 'Flat Zone', 28: 'Dream Land', 29: "Yoshi's Island", 30: 'Kongo Jungle',
	31: 'Battlefield', 32: 'Final Destination',
};
