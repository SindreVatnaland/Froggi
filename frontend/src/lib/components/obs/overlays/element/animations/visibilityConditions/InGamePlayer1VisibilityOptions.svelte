<script lang="ts" context="module">
	import {
		SelectedVisibilityCondition,
		VisibilityOption,
		VisibilityToggle,
	} from '$lib/models/types/animationOption';
	import type { Player } from '$lib/models/types/slippiData';
	import {
		getComboCount,
		hasStocksRemaining,
		isPlayerAlive,
		isPlayerEnteringOnHalo,
	} from '$lib/utils/gamePredicates';
	import type { FrameEntryType } from '../../../../../../models/types/slippiTypes';
	import { isNil } from 'lodash';

	export const inGamePlayer1VisibilityOption = (
		option: SelectedVisibilityCondition,
		gameFrame: FrameEntryType | null | undefined,
		players: Player[],
	): boolean => {
		const player = players?.at(0);

		if (isNil(player)) return false;

		const postFrame = gameFrame?.players?.[player?.playerIndex ?? 0]?.post;

		if (option[VisibilityOption.InGamePlayer1Alive] === VisibilityToggle.True)
			if (isPlayerAlive(postFrame)) return true;
		if (option[VisibilityOption.InGamePlayer1Alive] === VisibilityToggle.False)
			if (!isPlayerAlive(postFrame)) return true;
		if (option[VisibilityOption.InGamePlayer1EnteringHalo] === VisibilityToggle.True)
			if (isPlayerEnteringOnHalo(postFrame)) return true;
		if (option[VisibilityOption.InGamePlayer1EnteringHalo] === VisibilityToggle.False)
			if (!isPlayerEnteringOnHalo(postFrame)) return true;
		if (option[VisibilityOption.InGamePlayer1Stock1] === VisibilityToggle.True)
			if (hasStocksRemaining(postFrame, 1)) return true;
		if (option[VisibilityOption.InGamePlayer1Stock1] === VisibilityToggle.False)
			if (!hasStocksRemaining(postFrame, 1)) return true;
		if (option[VisibilityOption.InGamePlayer1Stock2] === VisibilityToggle.True)
			if (hasStocksRemaining(postFrame, 2)) return true;
		if (option[VisibilityOption.InGamePlayer1Stock2] === VisibilityToggle.False)
			if (!hasStocksRemaining(postFrame, 2)) return true;
		if (option[VisibilityOption.InGamePlayer1Stock3] === VisibilityToggle.True)
			if (hasStocksRemaining(postFrame, 3)) return true;
		if (option[VisibilityOption.InGamePlayer1Stock3] === VisibilityToggle.False)
			if (!hasStocksRemaining(postFrame, 3)) return true;
		if (option[VisibilityOption.InGamePlayer1Stock4] === VisibilityToggle.True)
			if (hasStocksRemaining(postFrame, 4)) return true;
		if (option[VisibilityOption.InGamePlayer1Stock4] === VisibilityToggle.False)
			if (!hasStocksRemaining(postFrame, 4)) return true;
		if (option[VisibilityOption.InGamePlayer1Combo] === VisibilityToggle.True)
			if (getComboCount(postFrame)) return true;
		if (option[VisibilityOption.InGamePlayer1Combo] === VisibilityToggle.False)
			if (!getComboCount(postFrame)) return true;

		return false;
	};
</script>
