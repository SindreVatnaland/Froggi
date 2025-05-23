<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { CurrentPlayer, CurrentPlayerRank, Player, Rank } from '$lib/models/types/slippiData';
	import { getPlayerRank } from '$lib/utils/playerRankHelper';
	import PlayerRankIcon from '../../element/PlayerRankIcon.svelte';
	import TextElement from '../../element/TextElement.svelte';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;

	export let player: Player;

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

	const getPredictedWinDifference = (rank: Rank | undefined) => {
		if (!rank) return 0;
		const difference =
			(rank?.predictedRating?.win?.ordinal ?? 0) - (rank?.current?.rating ?? 0);

		if (difference < 0.1) return Number(difference.toFixed(2));
		return Number(difference.toFixed(1));
	};

	const getPredictedLossDifference = (rank: Rank | undefined) => {
		if (!rank) return 0;
		const difference =
			(rank?.current?.rating ?? 0) - (rank?.predictedRating?.loss.ordinal ?? 0);

		if (difference < 0.1) return Number(difference.toFixed(2));
		return Number(difference.toFixed(1));
	};
</script>

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2PredictedWinRankIcon}
	<PlayerRankIcon
		{dataItem}
		{style}
		rank={rankWin}
		preview={defaultPreview}
		fallbackIcon="SILVER 2"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2PredictedWinRankText}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `SILVER 2` : rankWin ? rankWin : 'UNRANKED'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2PredictedWinRating}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `1416.3`
			: player.rank?.predictedRating?.win.ordinal.toFixed(1)
			? player.rank?.predictedRating?.win.ordinal.toFixed(1)
			: '-'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2PredictedLossRankIcon}
	<PlayerRankIcon
		{dataItem}
		{style}
		rank={rankLoss}
		preview={defaultPreview}
		fallbackIcon="SILVER 2"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2PredictedLossRankText}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `SILVER 2` : rankLoss ? rankLoss : 'UNRANKED'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2PredictedLossRating}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `1416.3`
			: player.rank?.predictedRating?.loss.ordinal.toFixed(1)
			? player.rank?.predictedRating?.loss.ordinal.toFixed(1)
			: '-'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiPlayer2RankChangePredictedWinRatingDifference}
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

{#if dataItem?.elementId === CustomElement.SlippiPlayer2RankChangePredictedLossRatingDifference}
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
