<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { CurrentPlayer, CurrentPlayerRank } from '$lib/models/types/slippiData';
	import { getPlayerRank } from '$lib/utils/playerRankHelper';
	import PlayerRankIcon from '../../element/PlayerRankIcon.svelte';
	import TextElement from '../../element/TextElement.svelte';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;

	export let player: CurrentPlayer;

	$: rankWin = getPlayerRank(
		player.rank?.predictedRating?.win.ordinal ?? 0,
		player.rank?.current?.dailyRegionalPlacement,
		player.rank?.current?.dailyGlobalPlacement,
	);

	$: rankLoss = getPlayerRank(
		player.rank?.predictedRating?.loss.ordinal ?? 0,
		player.rank?.current?.dailyRegionalPlacement,
		player.rank?.current?.dailyGlobalPlacement,
	);

	$: winDifference = getPredictedWinDifference(player.rank);
	$: lossDifference = getPredictedLossDifference(player.rank);

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

{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerPredictedWinRankIcon}
	<PlayerRankIcon
		{dataItem}
		{style}
		rank={rankWin}
		preview={defaultPreview}
		fallbackIcon="GOLD 3"
	/>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerPredictedWinRankText}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `GOLD 3` : rankWin ? rankWin : 'UNRANKED'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerPredictedWinRating}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `1702.5`
			: player.rank?.predictedRating?.win.ordinal.toFixed(1)
			? player.rank?.predictedRating?.win.ordinal.toFixed(1)
			: '-'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerPredictedLossRankIcon}
	<PlayerRankIcon
		{dataItem}
		{style}
		rank={rankLoss}
		preview={defaultPreview}
		fallbackIcon="GOLD 1"
	/>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerPredictedLossRankText}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `GOLD 1` : rankLoss ? rankLoss : 'UNRANKED'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerPredictedLossRating}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `1650.2`
			: player.rank?.predictedRating?.loss.ordinal.toFixed(1)
			? player.rank?.predictedRating?.loss.ordinal.toFixed(1)
			: '-'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiCurrentPlayerRankChangePredictedWinRatingDifference}
	{#if defaultPreview || Math.abs(winDifference) > 0.001}
		<TextElement {style} {dataItem}>
			{defaultPreview
				? `+132.4`
				: winDifference
				? `+${winDifference >= 0 ? '+' : ''}${winDifference.toFixed(1)}`
				: ''}
		</TextElement>
	{/if}
{/if}

{#if dataItem?.elementId === CustomElement.SlippiCurrentPlayerRankChangePredictedLossRatingDifference}
	{#if defaultPreview || Math.abs(lossDifference) > 0.001}
		<TextElement {style} {dataItem}>
			{defaultPreview
				? `-70.4`
				: lossDifference
				? `${lossDifference >= 0 ? '+' : ''}${lossDifference.toFixed(1)}`
				: ''}
		</TextElement>
	{/if}
{/if}
