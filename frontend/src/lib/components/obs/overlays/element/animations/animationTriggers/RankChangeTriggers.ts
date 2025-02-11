import {
	AnimationTrigger,
	type SelectedAnimationTriggerCondition,
} from '$lib/models/types/animationOption';
import type { CurrentPlayerRank } from '$lib/models/types/slippiData';

export const rankStateTrigger = (
	option: SelectedAnimationTriggerCondition,
	rank: CurrentPlayerRank | undefined,
	prevRank: CurrentPlayerRank | undefined,
) => {
	if (!rank || !prevRank) return;
	let trigger = false;

	if (option[AnimationTrigger.SlippiRankStatsRankChange])
		trigger = rank.current?.rank !== prevRank.current?.rank || trigger;

	if (option[AnimationTrigger.SlippiRankStatsRatingChange])
		trigger = rank.current?.rating !== prevRank.current?.rating || trigger;

	if (option[AnimationTrigger.SlippiRankStatsRatingDifferenceChange])
		trigger = rank.current?.rating !== rank.new?.rating || trigger;

	if (option[AnimationTrigger.SlippiRankStatsWinsChange])
		trigger = rank.current?.wins !== prevRank.current?.wins || trigger;

	if (option[AnimationTrigger.SlippiRankStatsLossesChange])
		trigger = rank.current?.losses !== prevRank.current?.losses || trigger;

	return trigger;
};
