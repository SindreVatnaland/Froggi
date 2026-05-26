export type BingoDifficulty = 'easy' | 'medium' | 'hard';

export type BingoChallengeId =
	| 'win_with_character'
	| 'win_in_a_row'
	| 'four_stock_opponent'
	| 'zero_death'
	| 'win_under_90s'
	| 'deal_damage_game'
	| 'opponent_reach_percent'
	| 'stocks_under_percent'
	| 'spike_meteor_total'
	| 'spike_meteor_single_game'
	| 'spike_diverse_moves'
	| 'kill_per_stock_diverse'
	| 'kill_fsmash'
	| 'kill_usmash'
	| 'kill_nair'
	| 'kill_fair'
	| 'kill_bair'
	| 'kill_uair'
	| 'kill_dair'
	| 'kill_neutral_b'
	| 'kill_side_b'
	| 'kill_up_b'
	| 'kill_throw'
	| 'blast_zone_direction'
	| 'star_ko'
	| 'screen_ko'
	| 'same_blast_zone_game'
	| 'lcancel_rate'
	| 'wall_tech'
	| 'win_games_total'
	| 'all_blast_zones_game'
	| 'win_low_damage'
	| 'edgeguard_rate'
	| 'combo_damage'
	| 'airborne_win'
	| 'same_move_kills'
	| 'no_smash_win'
	| 'win_low_apm'
	| 'win_high_apm'
	| 'win_low_damage_dealt'
	| 'rest_kill'
	| 'falcon_punch_kill'
	| 'gwm_judge_kill'
	| 'peach_turnip_hold'
	| 'yoshi_egg_lay';

export interface BingoChallengeConfig {
	id: BingoChallengeId;
	label: string;
	description: string;
	hasProgress: boolean;
	maxPerBoard?: number;
	excludeWith?: BingoChallengeId[];
	params: BingoChallengeParams;
}

export interface BingoChallengeParams {
	difficulty: BingoDifficulty;
	/** Resolved integer target for this specific box instance */
	target: number;
	/** For direction-specific challenges */
	direction?: 'left' | 'right';
	/** For character challenges */
	characterId?: number;
	characterName?: string;
	/** For percent-based challenges */
	percent?: number;
}

export interface BingoBox {
	instanceId: string;
	challengeId: BingoChallengeId;
	label: string;
	description: string;
	params: BingoChallengeParams;
	progress: number;
	target: number;
	completed: boolean;
	completedBy: 'local' | 'opponent' | 'both' | null;
	hasProgress: boolean;
	frozen?: boolean;
}

export interface BingoBoard {
	id: string;
	size: number;
	boxes: BingoBox[];
	difficulty: BingoDifficulty;
	createdAt: number;
}

export type BingoMode = 'solo' | 'lockout' | 'free';
export type BingoRole = 'solo' | 'host' | 'guest';
/** Number of lines needed to win, full board, or lockout (majority, no stealing) */
export type BingoWinCondition = 1 | 2 | 3 | 4 | 5 | 'full' | 'lockout' | 'rowcontrol';

export interface BingoSettings {
	mode: BingoMode;
	boardSize: 3 | 4 | 5;
	difficulty: BingoDifficulty;
	winCondition: BingoWinCondition;
	/** Which line types count for win: rows, columns, diagonals */
	lines: { rows: boolean; columns: boolean; diagonals: boolean };
	requireQueueAfterGame: boolean;
	timer: { enabled: boolean; durationMinutes: number };
	twitchEnabled: boolean;
	twitchChannel: string;
}

export interface BingoSession {
	board: BingoBoard;
	settings: BingoSettings;
	startedAt: number;
	localPlayerIndex: number | null;
	role: BingoRole;
	opponentConnected: boolean;
	localName: string;
	opponentName: string | null;
}

export type BingoChallengeUpdate = {
	instanceId: string;
	progress: number;
	completed: boolean;
	completedBy?: 'local' | 'opponent' | 'both';
	frozen?: boolean;
};

export type BingoVoteActionType = 'randomize_opponent_tile' | 'freeze_tile' | 'swap_tiles';

export interface BingoVoteOption {
	id: BingoVoteActionType;
	label: string;
	description: string;
	votes: number;
}

export interface BingoVoteState {
	active: boolean;
	options: BingoVoteOption[];
	startedAt: number;
	durationMs: number;
	result?: {
		winner: BingoVoteActionType;
		description: string;
	};
}

export interface BingoTileReplacedPayload {
	instanceId: string;
	box: BingoBox;
}

export interface BingoLobbyPayload {
	opponentConnected: boolean;
	opponentName: string | null;
	localName: string;
	settings?: BingoSettings;
	localTwitchUsername?: string;
	opponentTwitchUsername?: string;
}

export interface BingoStatePayload {
	session: BingoSession | null;
}

export interface BingoSoloWinPayload {
	timeSeconds: number;
	boardSize: 3 | 4 | 5;
	winCondition: BingoWinCondition;
	difficulty: BingoDifficulty;
}

export interface BingoLeaderboardEntry {
	timeSeconds: number;
	completedAt: number;
	version: string;
}

export interface BingoLeaderboard {
	currentVersion: string;
	records: Record<string, BingoLeaderboardEntry[]>;
}

export interface BingoChallengeUpdatePayload {
	updates: BingoChallengeUpdate[];
	reverted?: boolean;
	webhookData?: {
		totalCheckedLocal: number;
		totalCheckedOpponent: number;
		latestUpdate: {
			instanceId: string;
			label: string;
			completedBy: 'local' | 'opponent' | 'both' | null;
			reverted: boolean;
		} | null;
	};
}
