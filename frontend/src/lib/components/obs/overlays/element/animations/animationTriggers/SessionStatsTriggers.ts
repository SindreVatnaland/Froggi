import {
	AnimationTrigger,
	type SelectedAnimationTriggerCondition,
} from '$lib/models/types/animationOption';
import type {
	SessionStats,
} from '$lib/models/types/slippiData';
import { isNil } from 'lodash';

export const sessionStatsTrigger = (
	option: SelectedAnimationTriggerCondition,
	sessionStats: SessionStats | undefined,
	prevSessionStats: SessionStats | undefined,
) => {
	if (isNil(sessionStats) || isNil(prevSessionStats)) return;
	if (isNil(sessionStats.currentRankStats) || isNil(sessionStats.startRankStats)) return;
	if (isNil(prevSessionStats.currentRankStats) || isNil(prevSessionStats.startRankStats)) return;
	let trigger = false;



	const totalSessionGames = sessionStats.currentRankStats.totalGames - sessionStats.currentRankStats.totalGames
	const prevTotalSessionGames = prevSessionStats.startRankStats.totalGames - prevSessionStats.startRankStats.totalGames
	const totalSessionWins = sessionStats.currentRankStats.wins - sessionStats.currentRankStats.wins
	const prevTotalSessionWins = prevSessionStats.startRankStats.wins - prevSessionStats.startRankStats.wins
	const totalSessionLosses = sessionStats.currentRankStats.losses - sessionStats.currentRankStats.losses
	const prevTotalSessionLosses = prevSessionStats.startRankStats.losses - prevSessionStats.startRankStats.losses
	const sessionRating = sessionStats.currentRankStats.rating - sessionStats.currentRankStats.rating
	const prevSessionRating = prevSessionStats.startRankStats.rating - prevSessionStats.startRankStats.rating

	if (option[AnimationTrigger.SessionGames])
		trigger =
			totalSessionGames !== prevTotalSessionGames ||
			trigger;
	if (option[AnimationTrigger.SessionWins])
		trigger =
			totalSessionWins !== prevTotalSessionWins ||
			trigger;
	if (option[AnimationTrigger.SessionLosses])
		trigger =
			totalSessionLosses !== prevTotalSessionLosses ||
			trigger;
	if (option[AnimationTrigger.SessionRating])
		trigger =
			sessionRating !== prevSessionRating ||
			trigger;

	return trigger;
};
