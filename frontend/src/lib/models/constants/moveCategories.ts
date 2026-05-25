/** Melee internal attack IDs used in slippi-js ComboType.lastHitBy / MoveLandedType.moveId */
export type MoveCategory =
	| 'jab'
	| 'dash_attack'
	| 'ftilt'
	| 'utilt'
	| 'dtilt'
	| 'fsmash'
	| 'usmash'
	| 'dsmash'
	| 'nair'
	| 'fair'
	| 'bair'
	| 'uair'
	| 'dair'
	| 'neutral_b'
	| 'side_b'
	| 'up_b'
	| 'down_b'
	| 'grab'
	| 'throw'
	| 'other';

export const MOVE_CATEGORY: Record<number, MoveCategory> = {
	2:  'jab',        // Jab 1
	3:  'jab',        // Jab 2
	4:  'jab',        // Jab 3
	5:  'jab',        // Rapid jabs
	6:  'dash_attack',
	7:  'ftilt',
	8:  'utilt',
	9:  'dtilt',
	10: 'fsmash',
	11: 'usmash',
	12: 'dsmash',
	13: 'nair',
	14: 'fair',
	15: 'bair',
	16: 'uair',
	17: 'dair',
	18: 'neutral_b',
	19: 'side_b',
	20: 'up_b',
	21: 'down_b',
	53: 'throw', // Forward throw
	54: 'throw', // Back throw
	55: 'throw', // Up throw
	56: 'throw', // Down throw
};

export const SPIKE_MOVE_IDS = new Set([20]); // dair — primary spike move (character-agnostic base)

/** Move IDs that are considered spikes/meteors — expanded per character knowledge */
export function isSpikeMove(moveId: number | null): boolean {
	if (moveId == null) return false;
	return SPIKE_MOVE_IDS.has(moveId);
}

export function getMoveCategory(moveId: number | null): MoveCategory {
	if (moveId == null) return 'other';
	return MOVE_CATEGORY[moveId] ?? 'other';
}
