import type { StageStatus, StrikeState } from '../models/types/stageStriking';
import { VisibilityOption } from '../models/types/animationOption';

/**
 * Display state of one stage (Melee ruleset):
 *  - picked  — the stage this game is played on
 *  - struck  — struck in game 1, or banned by the previous winner for this game
 *  - dsr     — the player picking may not choose it (they already won on it); shown while a stage is
 *              being banned/picked for game 2+
 *  - locked  — not usable right now: a counterpick during game 1, or not in this ruleset at all
 *  - available
 */
export function stageStatus(state: StrikeState | undefined, stageId: number): StageStatus {
	if (!state) return 'available';
	const legal = [...(state.starters ?? []), ...(state.counterpicks ?? [])];
	if (!legal.includes(stageId)) return 'locked';
	if (state.finalStageId === stageId && state.phase !== 'stageBan' && state.phase !== 'stagePick') return 'picked';

	const firstGame = (state.gameNum ?? 1) === 1 && !state.lastWinner;
	if (firstGame) {
		if (!state.starters.includes(stageId)) return 'locked';
		return state.strikes?.includes(stageId) ? 'struck' : 'available';
	}

	if (state.bans?.includes(stageId) || (state.phase === 'stageBan' && state.strikes?.includes(stageId))) return 'struck';
	const picker: 1 | 2 | null = state.lastWinner ? (state.lastWinner === 1 ? 2 : 1) : null;
	const choosing = state.phase === 'stageBan' || state.phase === 'stagePick';
	if (choosing && picker && state.dsrStages?.[picker === 1 ? 'p1' : 'p2']?.includes(stageId)) return 'dsr';
	return 'available';
}

/** The legal-stage set shown by stage-striking overlays, with their per-state visibility conditions. */
export const STRIKE_STAGES: { stageId: number; name: string; conditions: Record<StageStatus, VisibilityOption> }[] = [
	{ stageId: 2, name: 'Fountain of Dreams', conditions: { available: VisibilityOption.StrikeFoDAvailable, locked: VisibilityOption.StrikeFoDLocked, struck: VisibilityOption.StrikeFoDStruckState, dsr: VisibilityOption.StrikeFoDDsr, picked: VisibilityOption.StrikeFoDPicked } },
	{ stageId: 31, name: 'Battlefield', conditions: { available: VisibilityOption.StrikeBFAvailable, locked: VisibilityOption.StrikeBFLocked, struck: VisibilityOption.StrikeBFStruckState, dsr: VisibilityOption.StrikeBFDsr, picked: VisibilityOption.StrikeBFPicked } },
	{ stageId: 32, name: 'Final Destination', conditions: { available: VisibilityOption.StrikeFDAvailable, locked: VisibilityOption.StrikeFDLocked, struck: VisibilityOption.StrikeFDStruckState, dsr: VisibilityOption.StrikeFDDsr, picked: VisibilityOption.StrikeFDPicked } },
	{ stageId: 28, name: 'Dream Land', conditions: { available: VisibilityOption.StrikeDLAvailable, locked: VisibilityOption.StrikeDLLocked, struck: VisibilityOption.StrikeDLStruckState, dsr: VisibilityOption.StrikeDLDsr, picked: VisibilityOption.StrikeDLPicked } },
	{ stageId: 8, name: 'Yoshi\'s Story', conditions: { available: VisibilityOption.StrikeYSAvailable, locked: VisibilityOption.StrikeYSLocked, struck: VisibilityOption.StrikeYSStruckState, dsr: VisibilityOption.StrikeYSDsr, picked: VisibilityOption.StrikeYSPicked } },
	{ stageId: 3, name: 'Pokémon Stadium', conditions: { available: VisibilityOption.StrikePSAvailable, locked: VisibilityOption.StrikePSLocked, struck: VisibilityOption.StrikePSStruckState, dsr: VisibilityOption.StrikePSDsr, picked: VisibilityOption.StrikePSPicked } },
];

export type StrikeAction =
	| 'waiting' | 'pickCharacter' | 'rps' | 'chooseStrikeOrder' | 'strike' | 'ban' | 'pick'
	| 'answerAgreement' | 'play' | 'done';

/** Who must act now and what they must do (null player = both, or nobody). */
export function strikeTurn(state: StrikeState | undefined): { player: 1 | 2 | null; action: StrikeAction } {
	switch (state?.phase) {
		case 'charSelect': return { player: null, action: 'pickCharacter' };
		case 'rps': return { player: null, action: 'rps' };
		case 'rpsResult': return { player: state.rps.winner, action: 'chooseStrikeOrder' };
		case 'striking': return { player: state.currentStriker, action: 'strike' };
		case 'stageBan': return { player: state.currentStriker, action: 'ban' };
		case 'stagePick':
			return state.agreement
				? { player: state.agreement.requestedBy === 1 ? 2 : 1, action: 'answerAgreement' }
				: { player: state.currentStriker, action: 'pick' };
		case 'charLock':
		case 'charPick': return { player: state.currentStriker, action: 'pickCharacter' };
		case 'playing': return { player: null, action: 'play' };
		case 'setComplete': return { player: null, action: 'done' };
		default: return { player: null, action: 'waiting' };
	}
}
