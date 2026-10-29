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

	export const inGamePlayer2VisibilityOption = (
		option: SelectedVisibilityCondition,
		gameFrame: FrameEntryType | null | undefined,
		players: Player[],
	) => {
		const player = players?.at(1);

		if (isNil(player)) return false;

		const postFrame = gameFrame?.players?.[player?.playerIndex ?? 0]?.post;

		if (option[VisibilityOption.InGamePlayer2Alive] === VisibilityToggle.True)
			if (isPlayerAlive(postFrame)) return true;
		if (option[VisibilityOption.InGamePlayer2Alive] === VisibilityToggle.False)
			if (!isPlayerAlive(postFrame)) return true;
		if (option[VisibilityOption.InGamePlayer2EnteringHalo] === VisibilityToggle.True)
			if (isPlayerEnteringOnHalo(postFrame)) return true;
		if (option[VisibilityOption.InGamePlayer2EnteringHalo] === VisibilityToggle.False)
			if (!isPlayerEnteringOnHalo(postFrame)) return true;
		if (option[VisibilityOption.InGamePlayer2Stock1] === VisibilityToggle.True)
			if (hasStocksRemaining(postFrame, 1)) return true;
		if (option[VisibilityOption.InGamePlayer2Stock1] === VisibilityToggle.False)
			if (!hasStocksRemaining(postFrame, 1)) return true;
		if (option[VisibilityOption.InGamePlayer2Stock2] === VisibilityToggle.True)
			if (hasStocksRemaining(postFrame, 2)) return true;
		if (option[VisibilityOption.InGamePlayer2Stock2] === VisibilityToggle.False)
			if (!hasStocksRemaining(postFrame, 2)) return true;
		if (option[VisibilityOption.InGamePlayer2Stock3] === VisibilityToggle.True)
			if (hasStocksRemaining(postFrame, 3)) return true;
		if (option[VisibilityOption.InGamePlayer2Stock3] === VisibilityToggle.False)
			if (!hasStocksRemaining(postFrame, 3)) return true;
		if (option[VisibilityOption.InGamePlayer2Stock4] === VisibilityToggle.True)
			if (hasStocksRemaining(postFrame, 4)) return true;
		if (option[VisibilityOption.InGamePlayer2Stock4] === VisibilityToggle.False)
			if (!hasStocksRemaining(postFrame, 4)) return true;
		if (option[VisibilityOption.InGamePlayer2Combo] === VisibilityToggle.True)
			if (getComboCount(postFrame)) return true;
		if (option[VisibilityOption.InGamePlayer2Combo] === VisibilityToggle.False)
			if (!getComboCount(postFrame)) return true;

		return false;
	};
</script>
