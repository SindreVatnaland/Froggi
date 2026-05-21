import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { ElectronWebhookStore } from './store/storeWebhook';
import { ElectronPlayersStore } from './store/storePlayers';
import {
	WebhookEvent,
	type GameEndPayload,
	type GameStartPayload,
	type PlayerInfoEntry,
	type PlayerInfoPayload,
	type PlayerStatChangePayload,
	type PlayerStatDiff,
	type RankChangePayload,
	type StrippedRankProfile,
	type WebhookPayload,
	type WebhookProfile,
	type RankChangeDiff,
} from '../../frontend/src/lib/models/types/webhook';
import type {
	CurrentPlayer,
	GameStartTypeExtended,
	GameStats,
	Player,
	RankedNetplayProfile,
} from '../../frontend/src/lib/models/types/slippiData';

interface OAuthTokenCache {
	token: string;
	expiresAt: number;
}

interface FrameState {
	percent: number;
	stocks: number;
}

const DUMMY_GAME_START: GameStartPayload = {
	stageId: 8,
	mode: 'ranked',
	matchId: 'mode.ranked-test-001',
	gameNumber: 1,
	bestOf: 5,
	players: [
		{ playerIndex: 0, port: 1, characterId: 20, characterColor: 0, connectCode: 'TEST#001', displayName: 'Player 1' },
		{ playerIndex: 1, port: 2, characterId: 9, characterColor: 2, connectCode: 'TEST#002', displayName: 'Player 2' },
	],
};

const DUMMY_GAME_END: GameEndPayload = {
	score: [1, 0],
	stageId: 8,
	mode: 'ranked',
	timestamp: new Date().toISOString(),
};

const DUMMY_RANK_PROFILE: StrippedRankProfile = {
	rating: 1612.4,
	rank: 'Gold 2',
	wins: 42,
	losses: 38,
	totalGames: 80,
	leaderboardPlacement: null,
	characters: [{ characterId: 20, characterName: 'Falco', gameCount: 72 }],
};

const DUMMY_PAYLOADS: Record<WebhookEvent, unknown> = {
	[WebhookEvent.GameStart]: DUMMY_GAME_START,
	[WebhookEvent.GameEnd]: DUMMY_GAME_END,
	[WebhookEvent.GameScore]: [1, 0],
	[WebhookEvent.StrikeState]: {
		p1Name: 'Player 1', p2Name: 'Player 2', bestOf: 5,
		score: { p1: 0, p2: 0 }, gameNum: 1, phase: 'striking',
		starters: [2, 3, 8, 28, 31], counterpicks: [4, 0, 36],
		strikes: [2], finalStageId: null, currentStriker: 2,
		rps: { p1: 'rock', p2: 'scissors', winner: 1 },
		characters: { p1: null, p2: null },
		dsrStages: { p1: [], p2: [] }, lastWinner: null, games: [],
	},
	[WebhookEvent.RankChange]: {
		connectCode: 'TEST#001', displayName: 'Player 1',
		before: DUMMY_RANK_PROFILE,
		after: { ...DUMMY_RANK_PROFILE, rating: 1628.1, wins: 43, totalGames: 81 },
		diff: { rating: 15.7, wins: 1, losses: 0, rankChanged: false },
	},
	[WebhookEvent.PercentChange]: {
		p1: { connectCode: 'TEST#001', displayName: 'Player 1', isCurrentPlayer: true, prev: 45.3, current: 67.8, diff: 22.5 },
		p2: { connectCode: 'TEST#002', displayName: 'Player 2', isCurrentPlayer: false, prev: 23.1, current: 28.9, diff: 5.8 },
		currentPlayer: { connectCode: 'TEST#001', displayName: 'Player 1', isCurrentPlayer: true, prev: 45.3, current: 67.8, diff: 22.5 },
	},
	[WebhookEvent.StockChange]: {
		p1: { connectCode: 'TEST#001', displayName: 'Player 1', isCurrentPlayer: true, prev: 4, current: 3, diff: -1 },
		p2: null,
		currentPlayer: { connectCode: 'TEST#001', displayName: 'Player 1', isCurrentPlayer: true, prev: 4, current: 3, diff: -1 },
	},
	[WebhookEvent.PlayerInfo]: {
		p1: { playerIndex: 0, port: 1, characterId: 20, characterColor: 0, connectCode: 'TEST#001', displayName: 'Player 1', rank: DUMMY_RANK_PROFILE },
		p2: { playerIndex: 1, port: 2, characterId: 9, characterColor: 2, connectCode: 'TEST#002', displayName: 'Player 2', rank: null },
		currentPlayer: { playerIndex: 0, port: 1, characterId: 20, characterColor: 0, connectCode: 'TEST#001', displayName: 'Player 1', rank: DUMMY_RANK_PROFILE },
	},
};

@singleton()
export class WebhookService {
	private oauthCache = new Map<string, OAuthTokenCache>();
	private lastGameSettingsId: string | null = null;
	private prevFrameState = new Map<number, FrameState>();
	private currentPlayerConnectCode: string | null = null;
	private cachedPlayers: Player[] | null = null;

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('LocalEmitter') private localEmitter: TypedEmitter,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => ElectronWebhookStore)) private webhookStore: ElectronWebhookStore,
		@inject(delay(() => ElectronPlayersStore)) private storePlayers: ElectronPlayersStore,
	) {
		this.log.info('Initializing Webhook Service');
		this.initEventListeners();
	}

	private initEventListeners() {
		this.localEmitter.on('CurrentPlayer', (player: CurrentPlayer | undefined) => {
			this.currentPlayerConnectCode = player?.connectCode ?? null;
			this.emitPlayerInfo();
		});

		this.localEmitter.on('CurrentPlayers', (players: Player[] | undefined) => {
			this.cachedPlayers = players ?? null;
			this.emitPlayerInfo();
		});

		this.localEmitter.on('GameSettings', (settings) => {
			if (!settings) return;
			const gameId = `${settings.matchInfo?.matchId}-${settings.matchInfo?.gameNumber}`;
			if (gameId === this.lastGameSettingsId) return;
			this.lastGameSettingsId = gameId;
			this.prevFrameState.clear();
			this.dispatch(WebhookEvent.GameStart, this.stripGameStart(settings));
		});

		this.localEmitter.on('PostGameStats', (stats) => {
			if (!stats) return;
			this.dispatch(WebhookEvent.GameEnd, this.stripGameEnd(stats));
		});

		this.localEmitter.on('GameScore', (score) => {
			this.dispatch(WebhookEvent.GameScore, score);
		});

		this.localEmitter.on('StrikeState', (state) => {
			if (!state) return;
			this.dispatch(WebhookEvent.StrikeState, state);
		});

		this.localEmitter.on('RankChange', (diff: RankChangeDiff) => {
			this.dispatch(WebhookEvent.RankChange, this.stripRankChange(diff));
		});

		this.localEmitter.on('GameFrame', (frame) => {
			if (!frame) return;
			const players = this.storePlayers.getCurrentPlayers();
			if (!players?.length) return;

			const p1 = players[0];
			const p2 = players[1] ?? null;
			const p1post = frame.players?.[p1?.playerIndex ?? 0]?.post;
			const p2post = p2 ? frame.players?.[p2.playerIndex ?? 1]?.post : null;

			const p1prev = this.prevFrameState.get(p1?.playerIndex ?? 0);
			const p2prev = p2 ? this.prevFrameState.get(p2.playerIndex ?? 1) : null;
			const p1curr = p1post ? { percent: p1post.percent ?? 0, stocks: p1post.stocksRemaining ?? 0 } : null;
			const p2curr = p2post ? { percent: p2post.percent ?? 0, stocks: p2post.stocksRemaining ?? 0 } : null;

			if (p1curr) this.prevFrameState.set(p1.playerIndex ?? 0, p1curr);
			if (p2curr && p2) this.prevFrameState.set(p2.playerIndex ?? 1, p2curr);
			if (!p1prev || !p1curr) return;

			const ccCode = this.currentPlayerConnectCode;
			const cpPlayer = ccCode ? ([p1, p2].find((p) => p?.connectCode === ccCode) ?? null) : null;

			const percentChanged =
				Math.round(p1curr.percent * 10) !== Math.round(p1prev.percent * 10) ||
				(p2curr && p2prev && Math.round(p2curr.percent * 10) !== Math.round(p2prev.percent * 10));

			const stockChanged =
				p1curr.stocks !== p1prev.stocks ||
				(p2curr && p2prev && p2curr.stocks !== p2prev.stocks);

			if (percentChanged) {
				const p1diff = this.buildDiff(p1, p1prev.percent, p1curr.percent, ccCode);
				const p2diff = p2 && p2curr && p2prev ? this.buildDiff(p2, p2prev.percent, p2curr.percent, ccCode) : null;
				const cpPrev = cpPlayer === p2 ? p2prev?.percent : p1prev.percent;
				const cpCurr = cpPlayer === p2 ? p2curr?.percent : p1curr.percent;
				const payload: PlayerStatChangePayload = {
					p1: p1diff, p2: p2diff,
					currentPlayer: cpPlayer && cpPrev != null && cpCurr != null
						? this.buildDiff(cpPlayer, cpPrev, cpCurr, ccCode) : null,
				};
				this.dispatch(WebhookEvent.PercentChange, payload);
			}

			if (stockChanged) {
				const p1diff = this.buildDiff(p1, p1prev.stocks, p1curr.stocks, ccCode);
				const p2diff = p2 && p2curr && p2prev ? this.buildDiff(p2, p2prev.stocks, p2curr.stocks, ccCode) : null;
				const cpPrev = cpPlayer === p2 ? p2prev?.stocks : p1prev.stocks;
				const cpCurr = cpPlayer === p2 ? p2curr?.stocks : p1curr.stocks;
				const payload: PlayerStatChangePayload = {
					p1: p1diff, p2: p2diff,
					currentPlayer: cpPlayer && cpPrev != null && cpCurr != null
						? this.buildDiff(cpPlayer, cpPrev, cpCurr, ccCode) : null,
				};
				this.dispatch(WebhookEvent.StockChange, payload);
			}
		});

		this.clientEmitter.on('TestWebhookProfile', (profileId: string) => {
			this.testProfile(profileId);
		});
	}

	// ── Strip helpers ─────────────────────────────────────────────────────────

	private stripGameStart(settings: GameStartTypeExtended): GameStartPayload {
		return {
			stageId: settings.stageId ?? null,
			mode: settings.matchInfo?.mode ?? null,
			matchId: settings.matchInfo?.matchId ?? null,
			gameNumber: settings.matchInfo?.gameNumber ?? null,
			bestOf: settings.matchInfo?.bestOf ?? null,
			players: (settings.players ?? [])
				.filter((p) => p != null)
				.map((p) => ({
					playerIndex: p.playerIndex,
					port: p.port,
					characterId: p.characterId,
					characterColor: p.characterColor,
					connectCode: p.connectCode,
					displayName: p.displayName,
				})),
		};
	}

	private stripGameEnd(stats: GameStats): GameEndPayload {
		return {
			score: stats.score,
			stageId: stats.settings?.stageId ?? null,
			mode: stats.settings?.matchInfo?.mode ?? null,
			timestamp: stats.timestamp ? new Date(stats.timestamp).toISOString() : null,
		};
	}

	private stripRankChange(diff: RankChangeDiff): RankChangePayload {
		return {
			connectCode: diff.connectCode,
			displayName: diff.displayName,
			before: this.stripRankProfile(diff.before),
			after: this.stripRankProfile(diff.after),
			diff: diff.diff,
		};
	}

	private stripRankProfile(profile: RankedNetplayProfile): StrippedRankProfile {
		return {
			rating: profile.rating,
			rank: profile.rank,
			wins: profile.wins,
			losses: profile.losses,
			totalGames: profile.totalGames,
			leaderboardPlacement: profile.leaderboardPlacement ?? null,
			characters: (profile.characters ?? []).map((c) => ({
				characterId: c.characterId,
				characterName: c.characterName,
				gameCount: c.gameCount,
			})),
		};
	}

	private buildPlayerInfoEntry(player: Player): PlayerInfoEntry {
		const rank = player.rank?.current;
		return {
			playerIndex: player.playerIndex,
			port: player.port,
			characterId: player.characterId,
			characterColor: player.characterColor,
			connectCode: player.connectCode,
			displayName: player.displayName,
			rank: rank ? this.stripRankProfile(rank) : null,
		};
	}

	private emitPlayerInfo() {
		const players = this.cachedPlayers;
		if (!players?.length) return;
		const p1 = players[0] ?? null;
		const p2 = players[1] ?? null;
		const ccCode = this.currentPlayerConnectCode;
		const cpPlayer = ccCode ? (players.find((p) => p.connectCode === ccCode) ?? null) : null;
		const payload: PlayerInfoPayload = {
			p1: p1 ? this.buildPlayerInfoEntry(p1) : null,
			p2: p2 ? this.buildPlayerInfoEntry(p2) : null,
			currentPlayer: cpPlayer ? this.buildPlayerInfoEntry(cpPlayer) : null,
		};
		this.dispatch(WebhookEvent.PlayerInfo, payload);
	}

	private buildDiff(player: Player, prev: number, current: number, ccCode: string | null): PlayerStatDiff {
		return {
			connectCode: player.connectCode ?? null,
			displayName: player.displayName ?? null,
			isCurrentPlayer: Boolean(ccCode && player.connectCode === ccCode),
			prev,
			current,
			diff: current - prev,
		};
	}

	// ── Test / dispatch ───────────────────────────────────────────────────────

	private async testProfile(profileId: string) {
		const profile = this.webhookStore.getProfiles().find((p) => p.id === profileId);
		if (!profile) return;
		for (const event of profile.events) {
			await this.send(profile, event, DUMMY_PAYLOADS[event]).catch((err: Error) => {
				this.log.error(`Webhook test "${profile.name}" (${event}) failed: ${err.message}`);
			});
		}
	}

	private async dispatch<T>(eventName: WebhookEvent, payload: T) {
		if (!this.webhookStore.getEnabled()) return;
		const profiles = this.webhookStore
			.getProfiles()
			.filter((p) => p.enabled && p.events.includes(eventName));
		for (const profile of profiles) {
			await this.send(profile, eventName, payload).catch((err: Error) => {
				this.log.error(`Webhook "${profile.name}" (${eventName}) failed: ${err.message}`);
			});
		}
	}

	private async send<T>(profile: WebhookProfile, eventName: WebhookEvent, payload: T) {
		const body: WebhookPayload<T> = {
			eventName,
			timestamp: new Date().toISOString(),
			payload,
		};
		const headers: Record<string, string> = { 'Content-Type': 'application/json' };
		if (profile.authType !== 'none') {
			const token = await this.getToken(profile);
			headers['Authorization'] = `Bearer ${token}`;
		}
		const res = await fetch(profile.url, {
			method: 'POST',
			headers,
			body: JSON.stringify(body),
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
	}

	private async getToken(profile: WebhookProfile): Promise<string> {
		if (profile.authType === 'bearer') return profile.bearerToken;
		const cached = this.oauthCache.get(profile.id);
		if (cached && Date.now() < cached.expiresAt) return cached.token;
		const res = await fetch(profile.loginUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'client_credentials',
				client_id: profile.clientId,
				client_secret: profile.clientSecret,
			}),
		});
		if (!res.ok) throw new Error(`OAuth token fetch failed: HTTP ${res.status}`);
		const data = (await res.json()) as { access_token: string; expires_in?: number };
		const expiresAt = Date.now() + ((data.expires_in ?? 3600) - 60) * 1000;
		this.oauthCache.set(profile.id, { token: data.access_token, expiresAt });
		return data.access_token;
	}
}
