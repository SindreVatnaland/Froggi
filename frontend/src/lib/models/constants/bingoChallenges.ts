import type { BingoChallengeId, BingoDifficulty } from '../types/bingo';

export interface ChallengeRange {
	min: number;
	max: number;
	step?: number;
}

export interface ChallengeDifficultyConfig {
	target: ChallengeRange | number;
	/** For percent challenges */
	percent?: ChallengeRange | number;
}

export interface ChallengeDefinition {
	id: BingoChallengeId;
	label: (params: Record<string, unknown>) => string;
	description: (params: Record<string, unknown>) => string;
	hasProgress: boolean;
	maxPerBoard?: number;
	excludeWith?: BingoChallengeId[];
	difficulties: Record<BingoDifficulty, ChallengeDifficultyConfig>;
	/** If set, challenge only appears for these difficulties */
	availableDifficulties?: BingoDifficulty[];
}

function pick(range: ChallengeRange | number): number {
	if (typeof range === 'number') return range;
	const steps = range.step ?? 1;
	const count = Math.floor((range.max - range.min) / steps) + 1;
	return range.min + Math.floor(Math.random() * count) * steps;
}

export function resolveTarget(def: ChallengeDefinition, difficulty: BingoDifficulty): { target: number; percent?: number } {
	const cfg = def.difficulties[difficulty];
	return {
		target: pick(cfg.target),
		percent: cfg.percent !== undefined ? pick(cfg.percent) : undefined,
	};
}

export const CHALLENGE_DEFINITIONS: ChallengeDefinition[] = [
	{
		id: 'win_with_character',
		label: ({ target, characterName }) => `Win ${target}x as ${characterName}`,
		description: ({ target, characterName }) => `Win ${target} game${Number(target) > 1 ? 's' : ''} playing as ${characterName}`,
		hasProgress: true,
		maxPerBoard: 6,
		difficulties: {
			easy:   { target: 1 },
			medium: { target: { min: 1, max: 2 } },
			hard:   { target: { min: 2, max: 3 } },
		},
	},
	{
		id: 'win_in_a_row',
		label: ({ target }) => `Win ${target} in a row`,
		description: ({ target }) => `Win ${target} consecutive games (opponent warmup quits skipped)`,
		hasProgress: true,
		difficulties: {
			easy:   { target: 2 },
			medium: { target: 2 },
			hard:   { target: 3 },
		},
	},
	{
		id: 'win_games_total',
		label: ({ target }) => `Win ${target} games`,
		description: ({ target }) => `Win ${target} total games this session (quitting a game doesn't count)`,
		hasProgress: true,
		difficulties: {
			easy:   { target: 2 },
			medium: { target: 3 },
			hard:   { target: 5 },
		},
	},
	{
		id: 'four_stock_opponent',
		label: ({ target }) => `4-stock opponent${Number(target) > 1 ? ` ×${target}` : ''}`,
		description: ({ target }) => `4-stock your opponent ${target} time${Number(target) > 1 ? 's' : ''}`,
		hasProgress: true,
		difficulties: {
			easy:   { target: 1 },
			medium: { target: 2 },
			hard:   { target: { min: 3, max: 5 } },
		},
	},
	{
		id: 'zero_death',
		label: ({ target }) => `Zero-death${Number(target) > 1 ? ` ×${target}` : ''}`,
		description: ({ target }) => `Take a stock from 0% without taking damage yourself, ${target} time${Number(target) > 1 ? 's' : ''}`,
		hasProgress: true,
		difficulties: {
			easy:   { target: 1 },
			medium: { target: { min: 2, max: 3 } },
			hard:   { target: { min: 3, max: 7 } },
		},
	},
	{
		id: 'win_under_90s',
		label: () => 'Win a game in <90s',
		description: () => 'Win a game in under 90 seconds',
		hasProgress: false,
		difficulties: {
			easy:   { target: 1 },
			medium: { target: 1 },
			hard:   { target: 1 },
		},
	},
	{
		id: 'deal_damage_game',
		label: ({ percent }) => `Deal ${percent}% in one game`,
		description: ({ percent }) => `Deal ${percent}% total damage in a single game`,
		hasProgress: true,
		difficulties: {
			easy:   { target: 1, percent: { min: 300, max: 400, step: 50 } },
			medium: { target: 1, percent: { min: 350, max: 450, step: 50 } },
			hard:   { target: 1, percent: { min: 400, max: 600, step: 50 } },
		},
	},
	{
		id: 'opponent_reach_percent',
		label: ({ percent }) => `Get opponent to ${percent}%`,
		description: ({ percent }) => `Have your opponent reach ${percent}% in a single game`,
		hasProgress: false,
		difficulties: {
			easy:   { target: 1, percent: 150 },
			medium: { target: 1, percent: 175 },
			hard:   { target: 1, percent: 200 },
		},
	},
	{
		id: 'stocks_under_percent',
		label: ({ target, percent }) => `Take ${target} stocks under ${percent}%`,
		description: ({ target, percent }) => `Take ${target} stocks while your opponent is under ${percent}%`,
		hasProgress: true,
		difficulties: {
			easy:   { target: { min: 5, max: 10 }, percent: { min: 40, max: 60, step: 10 } },
			medium: { target: { min: 5, max: 10 }, percent: { min: 30, max: 50, step: 10 } },
			hard:   { target: { min: 5, max: 10 }, percent: { min: 20, max: 40, step: 10 } },
		},
	},
	{
		id: 'spike_meteor_total',
		label: ({ target }) => `${target} spike/meteor stock${Number(target) > 1 ? 's' : ''}`,
		description: ({ target }) => `Take ${target} stocks with a spike or meteor smash (session total)`,
		hasProgress: true,
		excludeWith: ['kill_dair'],
		difficulties: {
			easy:   { target: { min: 5, max: 7 } },
			medium: { target: { min: 7, max: 11 } },
			hard:   { target: { min: 10, max: 15 } },
		},
	},
	{
		id: 'spike_meteor_single_game',
		label: ({ target }) => `${target} spike/meteor stocks in one game`,
		description: ({ target }) => `Take ${target} stocks with a spike or meteor in a single game`,
		hasProgress: true,
		excludeWith: ['kill_dair'],
		difficulties: {
			easy:   { target: 1 },
			medium: { target: 2 },
			hard:   { target: 4 },
		},
	},
	{
		id: 'kill_per_stock_diverse',
		label: ({ target }) => `Take ${target} stocks, ${target} different moves`,
		description: ({ target }) => `In one game, take ${target} stocks each with a different move type`,
		hasProgress: true,
		difficulties: {
			easy:   { target: 2 },
			medium: { target: 3 },
			hard:   { target: 4 },
		},
	},
	{
		id: 'spike_diverse_moves',
		label: ({ target }) => `Spike with ${target} different moves`,
		description: ({ target }) => `Take stocks with spike/meteor using ${target} different moves (session total)`,
		hasProgress: true,
		excludeWith: ['spike_meteor_total', 'spike_meteor_single_game'],
		difficulties: {
			easy:   { target: 3 },
			medium: { target: 4 },
			hard:   { target: 5 },
		},
	},
	{
		id: 'kill_fsmash',
		label: ({ target }) => `${target} F-Smash stock${Number(target) > 1 ? 's' : ''}`,
		description: ({ target }) => `Take ${target} stock${Number(target) > 1 ? 's' : ''} with forward smash (session total)`,
		hasProgress: true,
		maxPerBoard: 1,
		difficulties: {
			easy:   { target: 5 },
			medium: { target: { min: 5, max: 10 } },
			hard:   { target: { min: 5, max: 15 } },
		},
	},
	{
		id: 'kill_usmash',
		label: ({ target }) => `${target} Up-Smash stock${Number(target) > 1 ? 's' : ''}`,
		description: ({ target }) => `Take ${target} stock${Number(target) > 1 ? 's' : ''} with up smash (session total)`,
		hasProgress: true,
		maxPerBoard: 1,
		difficulties: {
			easy:   { target: 5 },
			medium: { target: { min: 5, max: 10 } },
			hard:   { target: { min: 5, max: 15 } },
		},
	},
	{
		id: 'kill_nair',
		label: ({ target }) => `${target} Nair stock${Number(target) > 1 ? 's' : ''}`,
		description: ({ target }) => `Take ${target} stock${Number(target) > 1 ? 's' : ''} with neutral air (session total)`,
		hasProgress: true,
		maxPerBoard: 1,
		difficulties: {
			easy:   { target: { min: 2, max: 5 } },
			medium: { target: { min: 3, max: 8 } },
			hard:   { target: { min: 5, max: 15 } },
		},
	},
	{
		id: 'kill_fair',
		label: ({ target }) => `${target} Fair stock${Number(target) > 1 ? 's' : ''}`,
		description: ({ target }) => `Take ${target} stock${Number(target) > 1 ? 's' : ''} with forward air (session total)`,
		hasProgress: true,
		maxPerBoard: 1,
		difficulties: {
			easy:   { target: { min: 1, max: 3 } },
			medium: { target: { min: 2, max: 6 } },
			hard:   { target: { min: 3, max: 10 } },
		},
	},
	{
		id: 'kill_bair',
		label: ({ target }) => `${target} Bair stock${Number(target) > 1 ? 's' : ''}`,
		description: ({ target }) => `Take ${target} stock${Number(target) > 1 ? 's' : ''} with back air (session total)`,
		hasProgress: true,
		maxPerBoard: 1,
		difficulties: {
			easy:   { target: { min: 1, max: 3 } },
			medium: { target: { min: 2, max: 6 } },
			hard:   { target: { min: 3, max: 10 } },
		},
	},
	{
		id: 'kill_uair',
		label: ({ target }) => `${target} Uair stock${Number(target) > 1 ? 's' : ''}`,
		description: ({ target }) => `Take ${target} stock${Number(target) > 1 ? 's' : ''} with up air (session total)`,
		hasProgress: true,
		maxPerBoard: 1,
		difficulties: {
			easy:   { target: { min: 1, max: 3 } },
			medium: { target: { min: 2, max: 5 } },
			hard:   { target: { min: 3, max: 8 } },
		},
	},
	{
		id: 'kill_dair',
		label: ({ target }) => `${target} Dair stock${Number(target) > 1 ? 's' : ''}`,
		description: ({ target }) => `Take ${target} stock${Number(target) > 1 ? 's' : ''} with down air (session total)`,
		hasProgress: true,
		maxPerBoard: 1,
		excludeWith: ['spike_meteor_total', 'spike_meteor_single_game'],
		difficulties: {
			easy:   { target: { min: 1, max: 2 } },
			medium: { target: { min: 1, max: 4 } },
			hard:   { target: { min: 2, max: 6 } },
		},
	},
	{
		id: 'kill_neutral_b',
		label: ({ target }) => `${target} Neutral-B stock${Number(target) > 1 ? 's' : ''}`,
		description: ({ target }) => `Take ${target} stock${Number(target) > 1 ? 's' : ''} with neutral B (session total)`,
		hasProgress: true,
		maxPerBoard: 1,
		difficulties: {
			easy:   { target: { min: 1, max: 2 } },
			medium: { target: { min: 2, max: 3 } },
			hard:   { target: { min: 2, max: 5 } },
		},
	},
	{
		id: 'kill_side_b',
		label: ({ target }) => `${target} Side-B stock${Number(target) > 1 ? 's' : ''}`,
		description: ({ target }) => `Take ${target} stock${Number(target) > 1 ? 's' : ''} with side B (session total)`,
		hasProgress: true,
		maxPerBoard: 1,
		difficulties: {
			easy:   { target: { min: 1, max: 2 } },
			medium: { target: { min: 2, max: 3 } },
			hard:   { target: { min: 2, max: 5 } },
		},
	},
	{
		id: 'kill_up_b',
		label: ({ target }) => `${target} Up-B stock${Number(target) > 1 ? 's' : ''}`,
		description: ({ target }) => `Take ${target} stock${Number(target) > 1 ? 's' : ''} with up B (session total)`,
		hasProgress: true,
		maxPerBoard: 1,
		difficulties: {
			easy:   { target: 1 },
			medium: { target: { min: 1, max: 2 } },
			hard:   { target: { min: 1, max: 3 } },
		},
	},
	{
		id: 'kill_throw',
		label: () => 'Take a stock with a throw',
		description: () => 'Take a stock with any throw',
		hasProgress: false,
		difficulties: {
			easy:   { target: 1 },
			medium: { target: 1 },
			hard:   { target: 1 },
		},
	},
	{
		id: 'blast_zone_direction',
		label: ({ target, direction }) => `${target} stocks off ${direction} side`,
		description: ({ target, direction }) => `Take ${target} stocks off the ${direction} blast zone (session total)`,
		hasProgress: true,
		maxPerBoard: 2,
		difficulties: {
			easy:   { target: 2 },
			medium: { target: { min: 2, max: 4 } },
			hard:   { target: { min: 2, max: 6 } },
		},
	},
	{
		id: 'star_ko',
		label: ({ target }) => `${target} star KOs`,
		description: ({ target }) => `Get ${target} star KOs (session total)`,
		hasProgress: true,
		difficulties: {
			easy:   { target: { min: 3, max: 4 } },
			medium: { target: { min: 4, max: 6 } },
			hard:   { target: { min: 5, max: 7 } },
		},
	},
	{
		id: 'same_blast_zone_game',
		label: ({ target }) => `${target} stocks same side in 1 game`,
		description: ({ target }) => `Take ${target} stocks off the same blast zone in one game`,
		hasProgress: false,
		difficulties: {
			easy:   { target: 2 },
			medium: { target: 2 },
			hard:   { target: { min: 3, max: 4 } },
		},
	},
	{
		id: 'screen_ko',
		label: () => `Screen KO`,
		description: () => `Send your opponent through the top of the screen (screen KO)`,
		hasProgress: false,
		difficulties: {
			easy:   { target: 1 },
			medium: { target: 1 },
			hard:   { target: 1 },
		},
	},
	{
		id: 'lcancel_rate',
		label: ({ percent, target }) => `${percent}% L-cancel rate ×${target}`,
		description: ({ percent, target }) => `Achieve ${percent}%+ L-cancel success rate in ${target} game${Number(target) > 1 ? 's' : ''} (min 5 attempts each)`,
		hasProgress: true,
		difficulties: {
			easy:   { target: 1, percent: 40 },
			medium: { target: { min: 2, max: 3 }, percent: { min: 60, max: 70, step: 10 } },
			hard:   { target: 5, percent: 90 },
		},
	},
	{
		id: 'wall_tech',
		label: ({ target }) => `${target} wall tech${Number(target) > 1 ? 's' : ''}`,
		description: ({ target }) => `Execute ${target} successful wall tech${Number(target) > 1 ? 's' : ''} (session total)`,
		hasProgress: true,
		difficulties: {
			easy:   { target: 1 },
			medium: { target: { min: 2, max: 3 } },
			hard:   { target: 5 },
		},
	},
	{
		id: 'all_blast_zones_game',
		label: () => 'All 4 blast zones in 1 game',
		description: () => 'Take a stock off every blast zone (left, right, top, bottom) in a single game',
		hasProgress: false,
		availableDifficulties: ['medium', 'hard'],
		difficulties: {
			easy:   { target: 1 },
			medium: { target: 1 },
			hard:   { target: 1 },
		},
	},
	{
		id: 'win_low_damage',
		label: ({ percent }) => `Win taking <${percent}% total damage`,
		description: ({ percent }) => `Win a game while taking less than ${percent}% total damage across all stocks`,
		hasProgress: false,
		difficulties: {
			easy:   { target: 1, percent: 150 },
			medium: { target: 1, percent: 100 },
			hard:   { target: 1, percent: 50 },
		},
	},
	{
		id: 'combo_damage',
		label: ({ percent }) => `${percent}%+ combo in one game`,
		description: ({ percent }) => `Deal ${percent}%+ damage in a single combo within one game (from PostGame conversions data)`,
		hasProgress: false,
		difficulties: {
			easy:   { target: 1, percent: 30 },
			medium: { target: 1, percent: 50 },
			hard:   { target: 1, percent: 80 },
		},
	},
	{
		id: 'airborne_win',
		label: ({ percent }) => `Win spending ${percent}%+ time airborne`,
		description: ({ percent }) => `Win a game while spending at least ${percent}% of frames in the air`,
		hasProgress: false,
		difficulties: {
			easy:   { target: 1, percent: 50 },
			medium: { target: 1, percent: 60 },
			hard:   { target: 1, percent: 70 },
		},
	},
	{
		id: 'same_move_kills',
		label: () => 'Win: take all 3 stocks w/ same move',
		description: () => 'Win a game where all 3 of the opponent\'s stocks are taken using the same move category (e.g., all fair kills)',
		hasProgress: true,
		availableDifficulties: ['hard'],
		difficulties: {
			easy:   { target: 3 },
			medium: { target: 3 },
			hard:   { target: 3 },
		},
	},
	{
		id: 'no_smash_win',
		label: () => 'Win: no smash attacks',
		description: () => 'Win a game without landing a forward smash, up smash, or down smash',
		hasProgress: false,
		difficulties: {
			easy:   { target: 1 },
			medium: { target: 1 },
			hard:   { target: 1 },
		},
	},
	{
		id: 'win_low_apm',
		label: ({ percent }) => `Win with <${percent} APM`,
		description: ({ percent }) => `Win a game with fewer than ${percent} actions per minute`,
		hasProgress: false,
		difficulties: {
			easy:   { target: 1, percent: 150 },
			medium: { target: 1, percent: 150 },
			hard:   { target: 1, percent: 150 },
		},
	},
	{
		id: 'edgeguard_rate',
		label: ({ percent }) => `${percent}% edgeguard success rate`,
		description: ({ percent }) => `Achieve ${percent}% edgeguard success rate (min 3 attempts). Starts when opponent is off-stage in hitstun — success if they lose a stock, fail if they return to stage`,
		hasProgress: false,
		difficulties: {
			easy:   { target: 1, percent: 20 },
			medium: { target: 1, percent: 50 },
			hard:   { target: 1, percent: 80 },
		},
	},
];

export const CHALLENGE_MAP = new Map(CHALLENGE_DEFINITIONS.map((c) => [c.id, c]));

/** Kill method challenge IDs — limited on board */
export const KILL_METHOD_CHALLENGES = new Set<BingoChallengeId>([
	'spike_meteor_total', 'spike_meteor_single_game',
	'kill_fsmash', 'kill_usmash', 'kill_nair', 'kill_fair',
	'kill_bair', 'kill_uair', 'kill_dair', 'kill_neutral_b',
	'kill_side_b', 'kill_up_b', 'kill_throw',
]);

/** Character challenge IDs — limited on board */
export const CHARACTER_CHALLENGES = new Set<BingoChallengeId>(['win_with_character']);

// 19 (Sheik) omitted — Zelda/Sheik share a slot; both normalize to 18
export const PLAYABLE_CHARACTER_IDS = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,20,21,22,23,24,25];
export const CHARACTER_NAMES: Record<number, string> = {
	0: 'Captain Falcon', 1: 'Donkey Kong', 2: 'Fox', 3: 'Mr. G&W',
	4: 'Kirby', 5: 'Bowser', 6: 'Link', 7: 'Luigi', 8: 'Mario',
	9: 'Marth', 10: 'Mewtwo', 11: 'Ness', 12: 'Peach', 13: 'Pikachu',
	14: 'Ice Climbers', 15: 'Jigglypuff', 16: 'Samus', 17: 'Yoshi',
	18: 'Zelda/Sheik', 20: 'Falco', 21: 'Young Link',
	22: 'Dr. Mario', 23: 'Roy', 24: 'Pichu', 25: 'Ganondorf',
};
