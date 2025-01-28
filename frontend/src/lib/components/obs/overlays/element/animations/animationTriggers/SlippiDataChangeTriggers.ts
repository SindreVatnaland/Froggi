import {
	AnimationTrigger,
	type SelectedAnimationTriggerCondition,
} from '$lib/models/types/animationOption';
import type { Player } from '$lib/models/types/slippiData';

export const player1RankDataTrigger = (
	option: SelectedAnimationTriggerCondition,
	currentPlayer: Player | undefined, prevPlayer: Player | undefined,
) => {
	if (!currentPlayer || !currentPlayer) return;
	let trigger = false;

	if (option[AnimationTrigger.MatchPlayer1TagChange])
		trigger = currentPlayer?.displayName !== prevPlayer?.displayName || trigger
	if (option[AnimationTrigger.SlippiRankPlayer1ConnectCodeChange])
		trigger = currentPlayer?.connectCode !== prevPlayer?.connectCode || trigger;
	if (option[AnimationTrigger.SlippiRankPlayer1RankChange])
		trigger = currentPlayer?.rank?.current?.rank !== prevPlayer?.rank?.current?.rank || trigger;
	if (option[AnimationTrigger.SlippiRankPlayer1RatingChange])
		trigger = currentPlayer?.rank?.current?.rating !== prevPlayer?.rank?.current?.rating || trigger;

	return trigger;
};

export const player2RankDataTrigger = (
	option: SelectedAnimationTriggerCondition,
	currentPlayer: Player | undefined, prevPlayer: Player | undefined,
) => {
	if (!currentPlayer || !currentPlayer) return;
	let trigger = false;

	if (option[AnimationTrigger.MatchPlayer2TagChange])
		trigger = currentPlayer?.displayName !== prevPlayer?.displayName || trigger
	if (option[AnimationTrigger.SlippiRankPlayer2ConnectCodeChange])
		trigger = currentPlayer?.connectCode !== prevPlayer?.connectCode || trigger;
	if (option[AnimationTrigger.SlippiRankPlayer2RankChange])
		trigger = currentPlayer?.rank?.current?.rank !== prevPlayer?.rank?.current?.rank || trigger;
	if (option[AnimationTrigger.SlippiRankPlayer2RatingChange])
		trigger = currentPlayer?.rank?.current?.rating !== prevPlayer?.rank?.current?.rating || trigger;

	return trigger;
};
