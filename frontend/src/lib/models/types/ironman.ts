/** External character IDs (Slippi game settings) in CSS order + Sheik after Zelda */
export const IRONMAN_CHARS = [
	22,  8,  7,  5, 12, 17,  1,  0, 25,
	20,  2, 11, 14,  4, 16, 18, 19,  6, 21,
	24, 13, 15, 10,  3,  9, 23,
] as const; // 26 total

export const IRONMAN_CHAR_NAMES: Record<number, string> = {
	0: 'C. Falcon', 1: 'Donkey Kong', 2: 'Fox', 3: 'Mr. G&W', 4: 'Kirby',
	5: 'Bowser', 6: 'Link', 7: 'Luigi', 8: 'Mario', 9: 'Marth',
	10: 'Mewtwo', 11: 'Ness', 12: 'Peach', 13: 'Pikachu',
	14: 'Ice Climbers', 15: 'Jigglypuff', 16: 'Samus', 17: 'Yoshi',
	18: 'Zelda', 19: 'Sheik', 20: 'Falco', 21: 'Young Link',
	22: 'Dr. Mario', 23: 'Roy', 24: 'Pichu', 25: 'Ganondorf',
};

/** Fallback CSS icons for characters that share an icon slot */
export const IRONMAN_CHAR_FALLBACK: Record<number, number> = {};

/**
 * standard  — lose a game → your character is depleted. Last to have characters wins.
 * full_roster — win with each character to complete it. Race: first to complete all wins.
 * challenge — solo, full roster. Any loss resets all progress. Time-based.
 */
export type IronManVariant = 'standard' | 'full_roster' | 'challenge';
export type IronManRole = 'solo' | 'host' | 'guest' | 'local';

export interface IronManCharSlot {
	characterId: number;
	/** standard: char lost all stocks and is out. full_roster/challenge: unused. */
	depleted: boolean;
	/** full_roster/challenge: player won with this char. standard: unused. */
	completed: boolean;
	/** stocks remaining after winning a game (for carry-over display) */
	stocksRemaining: number;
}

export interface IronManRoster {
	slots: IronManCharSlot[];
	/** For full_roster/challenge: index of char that must be played next */
	currentIndex: number;
}

export type IronManCharOrder = 'free' | 'fixed' | 'random';
export type IronManCharSelection = 'pick' | 'random';
export type IronManRandomSync = 'shared' | 'independent';

export interface IronManSettings {
	variant: IronManVariant;
	rosterSize: number;      // 5–26
	hideOpponent: boolean;
	stocksPerChar: number;   // 4 for Melee standard
	charOrder: IronManCharOrder;
	charSelection: IronManCharSelection;
	randomSync: IronManRandomSync;
}

export interface IronManSession {
	settings: IronManSettings;
	localRoster: IronManRoster;
	opponentRoster: IronManRoster | null;
	role: IronManRole;
	localName: string;
	opponentName: string | null;
	localPlayerIndex: number | null;
	opponentConnected: boolean;
	startedAt: number;
	winner: 'local' | 'opponent' | null;
	/** For carry-over: how many stocks winner must SD at start of next game */
	pendingCarryStocks: number | null;
}

export interface IronManStatePayload {
	session: IronManSession | null;
}

export interface IronManLobbyPayload {
	opponentConnected: boolean;
	opponentName: string | null;
	localName: string;
	settings?: IronManSettings;
}

export interface IronManGameResultPayload {
	valid: boolean;
	reason?: string;
	carryStocks?: number;
}

export interface IronManLeaderboardEntry {
	timeSeconds: number;
	completedAt: number;
	version: string;
	rosterSize: number;
	wins?: number;
}

export interface IronManLeaderboard {
	currentVersion: string;
	records: IronManLeaderboardEntry[];         // challenge
	fullRosterRecords: IronManLeaderboardEntry[]; // full_roster solo
	standardRecords: IronManLeaderboardEntry[];   // standard solo (sorted by wins desc)
}
