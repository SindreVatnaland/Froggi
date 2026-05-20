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
	return false;
};
