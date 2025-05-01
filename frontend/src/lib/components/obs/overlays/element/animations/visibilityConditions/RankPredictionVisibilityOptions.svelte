<script lang="ts" context="module">
	import {
		SelectedVisibilityCondition,
		VisibilityOption,
		VisibilityToggle,
	} from '$lib/models/types/animationOption';
	import type {
		CurrentPlayer,
		CurrentPlayerRank,
		GameStartTypeExtended,
		RatingPredictionWithOrdinal,
	} from '$lib/models/types/slippiData';
	import { getPlayerRank } from '$lib/utils/playerRankHelper';

	const isRankChangeGame = (
		playerRank: CurrentPlayerRank | undefined,
		prediction: RatingPredictionWithOrdinal | undefined,
		settings: GameStartTypeExtended | undefined,
	): boolean => {
		const prevRank = getPlayerRank(
			playerRank?.current?.rating ?? 1100,
			playerRank?.current?.dailyRegionalPlacement,
			playerRank?.current?.dailyGlobalPlacement,
		);
		const newRank = getPlayerRank(
			prediction?.ordinal ?? 1100,
			playerRank?.current?.dailyRegionalPlacement,
			playerRank?.current?.dailyGlobalPlacement,
		);
		return prevRank !== newRank && settings?.matchInfo.mode === 'ranked';
	};

	export const rankPredictionVisibilityOption = (
		option: SelectedVisibilityCondition,
		player: CurrentPlayer | undefined,
		settings: GameStartTypeExtended | undefined,
	) => {
		const currentRank = player?.rank?.current;
		const newRank = player?.rank?.new;

		if (!currentRank || !newRank) return;

		if (option[VisibilityOption.RankPredictionIsPromotionGame] === VisibilityToggle.True) {
			if (isRankChangeGame(player.rank, player.rank?.predictedRating?.win, settings)) {
				return true;
			}
		}
		if (option[VisibilityOption.RankPredictionIsPromotionGame] === VisibilityToggle.False) {
			if (!isRankChangeGame(player.rank, player.rank?.predictedRating?.win, settings)) {
				return true;
			}
		}
		if (option[VisibilityOption.RankPredictionIsDemotionGame] === VisibilityToggle.True) {
			if (isRankChangeGame(player.rank, player.rank?.predictedRating?.loss, settings)) {
				return true;
			}
		}
		if (option[VisibilityOption.RankPredictionIsDemotionGame] === VisibilityToggle.False) {
			if (!isRankChangeGame(player.rank, player.rank?.predictedRating?.loss, settings)) {
				return true;
			}
		}

		return false;
	};
</script>
