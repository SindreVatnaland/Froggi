import {
	CHALLENGE_DEFINITIONS,
	KILL_METHOD_CHALLENGES,
	CHARACTER_CHALLENGES,
	resolveTarget,
	PLAYABLE_CHARACTER_IDS,
	CHARACTER_NAMES,
	type ChallengeDefinition,
} from '../models/constants/bingoChallenges';
import type { BingoBoard, BingoBox, BingoChallengeId, BingoDifficulty, BingoSettings } from '../models/types/bingo';

const CHALLENGE_CATEGORY: Partial<Record<BingoChallengeId, string>> = {
	win_with_character:      'character',
	win_in_a_row:            'win',
	win_games_total:         'win',
	win_low_damage:          'win',
	combo_damage:            'damage',
	airborne_win:            'execution',
	same_move_kills:         'kill_method',
	no_smash_win:            'execution',
	win_low_apm:             'execution',
	edgeguard_rate:          'execution',
	four_stock_opponent:     'win',
	win_under_90s:           'win',
	zero_death:              'execution',
	lcancel_rate:            'execution',
	wall_tech:               'execution',
	deal_damage_game:        'damage',
	opponent_reach_percent:  'damage',
	stocks_under_percent:    'damage',
	blast_zone_direction:    'blast_zone',
	star_ko:                 'blast_zone',
	screen_ko:               'blast_zone',
	same_blast_zone_game:    'blast_zone',
	all_blast_zones_game:    'blast_zone',
	spike_meteor_total:      'kill_method',
	spike_meteor_single_game:'kill_method',
	spike_diverse_moves:     'kill_method',
	kill_per_stock_diverse:  'kill_method',
	kill_fsmash:             'kill_method',
	kill_usmash:             'kill_method',
	kill_nair:               'kill_method',
	kill_fair:               'kill_method',
	kill_bair:               'kill_method',
	kill_uair:               'kill_method',
	kill_dair:               'kill_method',
	kill_neutral_b:          'kill_method',
	kill_side_b:             'kill_method',
	kill_up_b:               'kill_method',
	kill_throw:              'kill_method',
};

export function generateBoard(settings: BingoSettings): BingoBoard {
	const { boardSize, difficulty } = settings;
	const totalBoxes = boardSize * boardSize;

	const boxes = pickChallenges(totalBoxes, difficulty);

	return {
		id: uid(),
		size: boardSize,
		boxes,
		difficulty,
		createdAt: Date.now(),
	};
}

function buildPool(difficulty: BingoDifficulty): ChallengeDefinition[] {
	const pool: ChallengeDefinition[] = [];
	for (const def of CHALLENGE_DEFINITIONS) {
		if (def.availableDifficulties && !def.availableDifficulties.includes(difficulty)) continue;
		const copies = def.maxPerBoard ?? 1;
		for (let i = 0; i < copies; i++) {
			pool.push(def);
		}
	}
	shuffle(pool);
	return pool;
}

function pickChallenges(count: number, difficulty: BingoDifficulty): BingoBox[] {
	const pool = buildPool(difficulty);
	// Max ~40% of board as kill-method boxes to preserve variety
	const maxKillMethod = Math.ceil(count * 0.4);
	const maxCharacter = Math.min(6, count);
	const minCharacter = Math.min(4, count);

	// Prioritise character boxes so we reliably hit the minimum of 4.
	// Within each group the shuffle order from buildPool is preserved.
	const charPool = pool.filter(d => CHARACTER_CHALLENGES.has(d.id));
	const otherPool = pool.filter(d => !CHARACTER_CHALLENGES.has(d.id));
	const orderedPool = [...charPool, ...otherPool];

	const selected: BingoBox[] = [];
	const usedIds = new Set<BingoChallengeId>();
	let killMethodCount = 0;
	let characterCount = 0;

	for (const def of orderedPool) {
		if (selected.length >= count) break;

		// Exclusion constraints
		if (def.excludeWith?.some((excId) => usedIds.has(excId))) continue;
		if (usedIds.has(def.id) && !def.maxPerBoard) continue;

		// Per-type limits
		if (KILL_METHOD_CHALLENGES.has(def.id) && killMethodCount >= maxKillMethod) continue;
		if (CHARACTER_CHALLENGES.has(def.id) && characterCount >= maxCharacter) continue;

		// maxPerBoard count (how many instances of same id allowed)
		const existingCount = selected.filter((b) => b.challengeId === def.id).length;
		if (def.maxPerBoard != null && existingCount >= def.maxPerBoard) continue;

		let { target, percent } = resolveTarget(def, difficulty);

		// 90%+ L-cancel rate is already hard — only require 1 game
		if (def.id === 'lcancel_rate' && (percent ?? 0) >= 90) target = 1;

		const params: BingoBox['params'] = {
			difficulty,
			target,
			...(percent !== undefined ? { percent } : {}),
		};

		// Direction for blast_zone_direction — alternate left/right
		if (def.id === 'blast_zone_direction') {
			const leftCount = selected.filter((b) => b.challengeId === 'blast_zone_direction' && b.params.direction === 'left').length;
			const rightCount = selected.filter((b) => b.challengeId === 'blast_zone_direction' && b.params.direction === 'right').length;
			params.direction = leftCount <= rightCount ? 'left' : 'right';
		}

		// Character for win_with_character — pick a random unused character
		if (def.id === 'win_with_character') {
			const usedCharIds = selected
				.filter((b) => b.challengeId === 'win_with_character')
				.map((b) => b.params.characterId);
			const available = PLAYABLE_CHARACTER_IDS.filter((id) => !usedCharIds.includes(id));
			if (available.length === 0) continue;
			const charId = available[Math.floor(Math.random() * available.length)];
			params.characterId = charId;
			params.characterName = CHARACTER_NAMES[charId] ?? `Character ${charId}`;
		}

		const labelParams = { target, percent, direction: params.direction, characterName: params.characterName };

		selected.push({
			instanceId: uid(),
			challengeId: def.id,
			label: def.label(labelParams),
			description: def.description(labelParams),
			params,
			progress: 0,
			target,
			completed: false,
			completedBy: null,
			hasProgress: def.hasProgress,
		});

		usedIds.add(def.id);
		if (KILL_METHOD_CHALLENGES.has(def.id)) killMethodCount++;
		if (CHARACTER_CHALLENGES.has(def.id)) characterCount++;
	}

	return spreadByCategory(selected);
}

function spreadByCategory(boxes: BingoBox[]): BingoBox[] {
	const n = boxes.length;
	const groups = new Map<string, BingoBox[]>();
	for (const box of boxes) {
		const cat = CHALLENGE_CATEGORY[box.challengeId] ?? 'other';
		if (!groups.has(cat)) groups.set(cat, []);
		groups.get(cat)!.push(box);
	}
	for (const group of groups.values()) shuffle(group);

	// Shuffle category order so the same category doesn't always get column 0
	const lists = [...groups.values()];
	shuffle(lists);

	// Build a flat round-robin sequence (same-category items spaced ~numCategories apart)
	const sequence: BingoBox[] = [];
	let i = 0;
	while (sequence.length < n) {
		for (const list of lists) {
			if (i < list.length) {
				sequence.push(list[i]);
				if (sequence.length >= n) break;
			}
		}
		i++;
	}

	// Scatter using a stride coprime to n (7 is coprime to 9, 16, and 25).
	// Pure round-robin maps sequence[k] → grid position k, which on a 5-wide
	// board places every Nth item in the same column. The stride breaks that.
	const result = new Array<BingoBox>(n);
	let pos = 0;
	for (let j = 0; j < n; j++) {
		result[pos] = sequence[j];
		pos = (pos + 7) % n;
	}
	return result;
}

function uid(): string {
	return `b${Math.random().toString(36).slice(-8)}`;
}

function shuffle<T>(arr: T[]): void {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
}
