import type { RankedNetplayProfile } from './slippiData';

export enum WebhookEvent {
	GameStart = 'GameStart',
	GameEnd = 'GameEnd',
	GameScore = 'GameScore',
	StrikeState = 'StrikeState',
	RankChange = 'RankChange',
	PercentChange = 'PercentChange',
	StockChange = 'StockChange',
	PlayerInfo = 'PlayerInfo',
}

export type WebhookAuthType = 'none' | 'bearer' | 'oauth2';

export interface WebhookProfile {
	id: string;
	name: string;
	url: string;
	enabled: boolean;
	authType: WebhookAuthType;
	bearerToken: string;
	clientId: string;
	clientSecret: string;
	loginUrl: string;
	events: WebhookEvent[];
}

export interface WebhookPayload<T = unknown> {
	eventName: string;
	timestamp: string;
	payload: T;
}

// ── Stripped payload types (only these fields are sent) ──────────────────────

export interface GameStartPlayer {
	playerIndex: number;
	port: number;
	characterId: number | null;
	characterName: string | null;
	characterColor: number | null;
	connectCode: string;
	displayName: string;
}

export interface GameStartPayload {
	stageId: number | null;
	mode: string | null;
	matchId: string | null;
	gameNumber: number | null;
	bestOf: number | null;
	players: GameStartPlayer[];
}

export interface GameEndPayload {
	score: number[];
	stageId: number | null;
	mode: string | null;
	timestamp: string | null;
}

export interface StrippedRankProfile {
	rating: number;
	rank: string;
	wins: number;
	losses: number;
	totalGames: number;
	leaderboardPlacement: number | null;
	characters: Array<{ characterId: number; characterName: string; gameCount: number }>;
}

export interface RankChangePayload {
	connectCode: string;
	displayName: string;
	before: StrippedRankProfile;
	after: StrippedRankProfile;
	diff: {
		rating: number;
		wins: number;
		losses: number;
		rankChanged: boolean;
	};
}

export interface PlayerStatDiff {
	connectCode: string | null;
	displayName: string | null;
	isCurrentPlayer: boolean;
	prev: number;
	current: number;
	diff: number;
}

export interface PlayerStatChangePayload {
	p1: PlayerStatDiff | null;
	p2: PlayerStatDiff | null;
	currentPlayer: PlayerStatDiff | null;
}

export interface PlayerInfoEntry {
	playerIndex: number;
	port: number;
	characterId: number | null;
	characterName: string | null;
	characterColor: number | null;
	connectCode: string;
	displayName: string;
	rank: StrippedRankProfile | null;
}

export interface PlayerInfoPayload {
	p1: PlayerInfoEntry | null;
	p2: PlayerInfoEntry | null;
	currentPlayer: PlayerInfoEntry | null;
}

// ── Internal type used by storeCurrentPlayer ─────────────────────────────────

export interface RankChangeDiff {
	connectCode: string;
	displayName: string;
	before: RankedNetplayProfile;
	after: RankedNetplayProfile;
	diff: {
		rating: number;
		wins: number;
		losses: number;
		rankChanged: boolean;
	};
}
