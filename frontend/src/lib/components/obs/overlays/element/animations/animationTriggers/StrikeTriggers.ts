import {
	AnimationTrigger,
	type SelectedAnimationTriggerCondition,
} from '$lib/models/types/animationOption';
import type { StrikeState } from '$lib/models/types/stageStriking';

export const strikeStateTrigger = (
	option: SelectedAnimationTriggerCondition,
	strikeState: StrikeState | undefined,
	prevStrikeState: StrikeState | undefined,
): boolean => {
	if (option[AnimationTrigger.StrikeCurrentStrikerChange]) {
		if (strikeState?.currentStriker !== prevStrikeState?.currentStriker) return true;
	}
	if (option[AnimationTrigger.StrikePlayer1CharChange]) {
		if (strikeState?.characters?.p1 !== prevStrikeState?.characters?.p1) return true;
	}
	if (option[AnimationTrigger.StrikePlayer2CharChange]) {
		if (strikeState?.characters?.p2 !== prevStrikeState?.characters?.p2) return true;
	}
	const p1RpsChanged = strikeState?.rps?.p1 !== prevStrikeState?.rps?.p1;
	const p2RpsChanged = strikeState?.rps?.p2 !== prevStrikeState?.rps?.p2;
	if (option[AnimationTrigger.StrikePlayer1RpsSelected] && p1RpsChanged) return true;
	if (option[AnimationTrigger.StrikePlayer2RpsSelected] && p2RpsChanged) return true;
	if (option[AnimationTrigger.StrikeEitherRpsSelected] && (p1RpsChanged || p2RpsChanged)) return true;

	const newlyStruck = (id: number) =>
		(strikeState?.strikes?.includes(id) ?? false) &&
		!(prevStrikeState?.strikes?.includes(id) ?? false);
	const anyNewStrike = (strikeState?.strikes?.length ?? 0) > (prevStrikeState?.strikes?.length ?? 0);
	if (option[AnimationTrigger.StrikeAnyStageStruck] && anyNewStrike) return true;
	if (option[AnimationTrigger.StrikeFoDStruck] && newlyStruck(2))  return true;
	if (option[AnimationTrigger.StrikeBFStruck]  && newlyStruck(31)) return true;
	if (option[AnimationTrigger.StrikeFDStruck]  && newlyStruck(32)) return true;
	if (option[AnimationTrigger.StrikeDLStruck]  && newlyStruck(28)) return true;
	if (option[AnimationTrigger.StrikeYSStruck]  && newlyStruck(8))  return true;
	if (option[AnimationTrigger.StrikePSStruck]  && newlyStruck(3))  return true;
	return false;
};
