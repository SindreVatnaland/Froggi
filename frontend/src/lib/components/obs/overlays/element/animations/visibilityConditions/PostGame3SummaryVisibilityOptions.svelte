<script lang="ts" context="module">
	import {
		SelectedVisibilityCondition,
		VisibilityOption,
		VisibilityToggle,
	} from '$lib/models/types/animationOption';
	import { getWinnerIndex } from '$lib/utils/gamePredicates';
	import type { CurrentPlayer, GameStats, Player } from '$lib/models/types/slippiData';

	export const postGame3SummaryVisibilityOption = (
		option: SelectedVisibilityCondition,
		players: Player[],
		player: Player | undefined,
		recentGames: GameStats[],
	) => {
		const gameIndex = recentGames.length > 5 ? 2 : 2;
		const game = recentGames.at(gameIndex);

		const winnerIndex = getWinnerIndex(game);

		if (option[VisibilityOption.PostGame3SummaryCompleted] === VisibilityToggle.True)
			if (game) return true;
		if (option[VisibilityOption.PostGame3SummaryCompleted] === VisibilityToggle.False)
			if (!game) return true;
		if (option[VisibilityOption.PostGame3SummaryCurrentPlayerWin] === VisibilityToggle.True)
			if (winnerIndex === player?.playerIndex) return true;
		if (option[VisibilityOption.PostGame3SummaryCurrentPlayerWin] === VisibilityToggle.False)
			if (winnerIndex !== player?.playerIndex) return true;

		if (option[VisibilityOption.PostGame3SummaryPlayer1Stock1] === VisibilityToggle.True)
			if (
				(game?.lastFrame?.players?.[players?.at(0)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) >= 1
			)
				return true;
		if (option[VisibilityOption.PostGame3SummaryPlayer1Stock1] === VisibilityToggle.False)
			if (
				(game?.lastFrame?.players?.[players?.at(0)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) < 1
			)
				return true;
		if (option[VisibilityOption.PostGame3SummaryPlayer1Stock2] === VisibilityToggle.True)
			if (
				(game?.lastFrame?.players?.[players?.at(0)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) >= 2
			)
				return true;
		if (option[VisibilityOption.PostGame3SummaryPlayer1Stock2] === VisibilityToggle.False)
			if (
				(game?.lastFrame?.players?.[players?.at(0)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) < 2
			)
				return true;
		if (option[VisibilityOption.PostGame3SummaryPlayer1Stock3] === VisibilityToggle.True)
			if (
				(game?.lastFrame?.players?.[players?.at(0)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) >= 3
			)
				return true;
		if (option[VisibilityOption.PostGame3SummaryPlayer1Stock3] === VisibilityToggle.False)
			if (
				(game?.lastFrame?.players?.[players?.at(0)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) < 3
			)
				return true;
		if (option[VisibilityOption.PostGame3SummaryPlayer1Stock4] === VisibilityToggle.True)
			if (
				(game?.lastFrame?.players?.[players?.at(0)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) >= 4
			)
				return true;
		if (option[VisibilityOption.PostGame3SummaryPlayer1Stock4] === VisibilityToggle.False)
			if (
				(game?.lastFrame?.players?.[players?.at(0)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) < 4
			)
				return true;

		if (option[VisibilityOption.PostGame3SummaryPlayer2Stock1] === VisibilityToggle.True)
			if (
				(game?.lastFrame?.players?.[players?.at(1)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) >= 1
			)
				return true;
		if (option[VisibilityOption.PostGame3SummaryPlayer2Stock1] === VisibilityToggle.False)
			if (
				(game?.lastFrame?.players?.[players?.at(1)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) < 1
			)
				return true;
		if (option[VisibilityOption.PostGame3SummaryPlayer2Stock2] === VisibilityToggle.True)
			if (
				(game?.lastFrame?.players?.[players?.at(1)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) >= 2
			)
				return true;
		if (option[VisibilityOption.PostGame3SummaryPlayer2Stock2] === VisibilityToggle.False)
			if (
				(game?.lastFrame?.players?.[players?.at(1)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) < 2
			)
				return true;
		if (option[VisibilityOption.PostGame3SummaryPlayer2Stock3] === VisibilityToggle.True)
			if (
				(game?.lastFrame?.players?.[players?.at(1)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) >= 3
			)
				return true;
		if (option[VisibilityOption.PostGame3SummaryPlayer2Stock3] === VisibilityToggle.False)
			if (
				(game?.lastFrame?.players?.[players?.at(1)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) < 3
			)
				return true;
		if (option[VisibilityOption.PostGame3SummaryPlayer2Stock4] === VisibilityToggle.True)
			if (
				(game?.lastFrame?.players?.[players?.at(1)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) >= 4
			)
				return true;
		if (option[VisibilityOption.PostGame3SummaryPlayer2Stock4] === VisibilityToggle.False)
			if (
				(game?.lastFrame?.players?.[players?.at(1)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) < 4
			)
				return true;

		return false;
	};
</script>
