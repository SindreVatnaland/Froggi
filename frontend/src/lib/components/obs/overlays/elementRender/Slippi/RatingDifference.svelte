<script lang="ts">
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import TextElement from '../../element/TextElement.svelte';
	import { CurrentPlayer, CurrentPlayerRank } from '$lib/models/types/slippiData';
	import { CustomElement } from '$lib/models/constants/customElement';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean = false;
	export let style: GridContentItemStyle;
	export let currentPlayer: CurrentPlayer;

	$: currentDifference = getCurrentDifference(currentPlayer.rank);
	$: predictedWinDifference = getPredictedWinDifference(currentPlayer.rank);
	$: predictedLossDifference = getPredictedLossDifference(currentPlayer.rank);

	const getCurrentDifference = (rank: CurrentPlayerRank | undefined): number => {
		if (!rank) return 0;
		const difference = (rank?.new?.rating ?? 0) - (rank?.current?.rating ?? 0);

		if (difference < 0.1) return Number(difference.toFixed(2));
		return Number(difference.toFixed(1));
	};

	const getPredictedWinDifference = (rank: CurrentPlayerRank | undefined) => {
		if (!rank) return 0;
		const difference = (rank?.predictedRating?.win?.ordinal ?? 0) - (rank?.new?.rating ?? 0);

		if (difference < 0.1) return Number(difference.toFixed(2));
		return Number(difference.toFixed(1));
	};

	const getPredictedLossDifference = (rank: CurrentPlayerRank | undefined) => {
		if (!rank) return 0;
		const difference = (rank?.new?.rating ?? 0) - (rank?.predictedRating?.loss.ordinal ?? 0);

		if (difference < 0.1) return Number(difference.toFixed(2));
		return Number(difference.toFixed(1));
	};
</script>

{#if dataItem?.elementId === CustomElement.SlippiRankChangeRatingDifference}
	{#if defaultPreview || Math.abs(currentDifference) > 0.001}
		<TextElement {style} {dataItem}>
			{defaultPreview
				? `+132.4`
				: currentDifference
				? `${currentDifference >= 0 ? '+' : ''}${currentDifference.toFixed(1)}`
				: '+0'}
		</TextElement>
	{/if}
{/if}
