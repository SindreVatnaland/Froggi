<script lang="ts" context="module">
	import {
		SelectedVisibilityCondition,
		VisibilityOption,
		VisibilityToggle,
	} from '$lib/models/types/animationOption';
	import type { GameStats, Player } from '$lib/models/types/slippiData';

	export const postGameVisibilityOption = (
		option: SelectedVisibilityCondition,
		players: Player[],
		player: Player | undefined,
		gameStats: GameStats,
	) => {
		const winnerIndex = gameStats?.gameEnd?.placements.findIndex(
			(placement) => placement.position === 0,
		);

		if (option[VisibilityOption.PostGameCurrentPlayerWin] === VisibilityToggle.True)
			if (winnerIndex === player?.playerIndex) return true;
		if (option[VisibilityOption.PostGameCurrentPlayerWin] === VisibilityToggle.False)
			if (winnerIndex !== player?.playerIndex) return true;
		if (option[VisibilityOption.PostGamePlayer1Win] === VisibilityToggle.True)
			if (winnerIndex === players.at(0)?.playerIndex) return true;
		if (option[VisibilityOption.PostGamePlayer1Win] === VisibilityToggle.False)
			if (winnerIndex !== players.at(0)?.playerIndex) return true;
		if (option[VisibilityOption.PostGamePlayer2Win] === VisibilityToggle.True)
			if (winnerIndex === players.at(1)?.playerIndex) return true;
		if (option[VisibilityOption.PostGamePlayer2Win] === VisibilityToggle.False)
			if (winnerIndex !== players.at(1)?.playerIndex) return true;

		if (option[VisibilityOption.PostGamePlayer1Stock1] === VisibilityToggle.True)
			if (
				(gameStats.lastFrame?.players?.[players?.at(0)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) >= 1
			)
				return true;
		if (option[VisibilityOption.PostGamePlayer1Stock1] === VisibilityToggle.False)
			if (
				(gameStats.lastFrame?.players?.[players?.at(0)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) < 1
			)
				return true;
		if (option[VisibilityOption.PostGamePlayer1Stock2] === VisibilityToggle.True)
			if (
				(gameStats.lastFrame?.players?.[players?.at(0)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) >= 2
			)
				return true;
		if (option[VisibilityOption.PostGamePlayer1Stock2] === VisibilityToggle.False)
			if (
				(gameStats.lastFrame?.players?.[players?.at(0)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) < 2
			)
				return true;
		if (option[VisibilityOption.PostGamePlayer1Stock3] === VisibilityToggle.True)
			if (
				(gameStats.lastFrame?.players?.[players?.at(0)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) >= 3
			)
				return true;
		if (option[VisibilityOption.PostGamePlayer1Stock3] === VisibilityToggle.False)
			if (
				(gameStats.lastFrame?.players?.[players?.at(0)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) < 3
			)
				return true;
		if (option[VisibilityOption.PostGamePlayer1Stock4] === VisibilityToggle.True)
			if (
				(gameStats.lastFrame?.players?.[players?.at(0)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) >= 4
			)
				return true;
		if (option[VisibilityOption.PostGamePlayer1Stock4] === VisibilityToggle.False)
			if (
				(gameStats.lastFrame?.players?.[players?.at(0)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) < 4
			)
				return true;

		if (option[VisibilityOption.PostGamePlayer2Stock1] === VisibilityToggle.True)
			if (
				(gameStats.lastFrame?.players?.[players?.at(1)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) >= 1
			)
				return true;
		if (option[VisibilityOption.PostGamePlayer2Stock1] === VisibilityToggle.False)
			if (
				(gameStats.lastFrame?.players?.[players?.at(1)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) < 1
			)
				return true;
		if (option[VisibilityOption.PostGamePlayer2Stock2] === VisibilityToggle.True)
			if (
				(gameStats.lastFrame?.players?.[players?.at(1)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) >= 2
			)
				return true;
		if (option[VisibilityOption.PostGamePlayer2Stock2] === VisibilityToggle.False)
			if (
				(gameStats.lastFrame?.players?.[players?.at(1)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) < 2
			)
				return true;
		if (option[VisibilityOption.PostGamePlayer2Stock3] === VisibilityToggle.True)
			if (
				(gameStats.lastFrame?.players?.[players?.at(1)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) >= 3
			)
				return true;
		if (option[VisibilityOption.PostGamePlayer2Stock3] === VisibilityToggle.False)
			if (
				(gameStats.lastFrame?.players?.[players?.at(1)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) < 3
			)
				return true;
		if (option[VisibilityOption.PostGamePlayer2Stock4] === VisibilityToggle.True)
			if (
				(gameStats.lastFrame?.players?.[players?.at(1)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) >= 4
			)
				return true;
		if (option[VisibilityOption.PostGamePlayer2Stock4] === VisibilityToggle.False)
			if (
				(gameStats.lastFrame?.players?.[players?.at(1)?.playerIndex ?? -1]?.post
					.stocksRemaining ?? 0) < 4
			)
				return true;

		return false;
	};
</script>
