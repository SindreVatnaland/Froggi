<script lang="ts">
	import { CHARACTERS } from '$lib/models/constants/characterData';
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { CurrentPlayer } from '$lib/models/types/slippiData';
	import { currentPlayer } from '$lib/utils/store.svelte';
	import PlayerRankIcon from '../../element/PlayerRankIcon.svelte';
	import RankedCharacterIcon from '../../element/RankedCharacterIcon.svelte';
	import TextElement from '../../element/TextElement.svelte';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;

	export let player: CurrentPlayer;
</script>

{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerTag}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `Current Player`
			: $currentPlayer?.rank?.current?.displayName
			? $currentPlayer?.rank?.current?.displayName
			: 'Current Player'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerConnectCode}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `ABCDEF#0`
			: $currentPlayer?.rank?.current?.connectCode
			? $currentPlayer?.rank?.current?.connectCode
			: ''}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerRankIcon}
	<PlayerRankIcon
		{dataItem}
		{style}
		player={$currentPlayer}
		preview={defaultPreview}
		fallbackIcon="GOLD 2"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerRankText}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `GOLD 2`
			: player.rank?.current?.rank
			? player.rank?.current?.rank
			: 'Unranked'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerRating}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `1429.3`
			: player.rank?.current?.rating.toFixed(1)
			? player.rank?.current?.rating.toFixed(1)
			: '-'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerContinent}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `North America`
			: $currentPlayer?.rank?.current?.continent
			? $currentPlayer?.rank?.current?.continent
			: 'N/A'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerContinentInitials}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `NA`
			: $currentPlayer?.rank?.current?.continentInitials
			? $currentPlayer?.rank?.current?.continentInitials
			: 'N/A'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerDailyGlobalPlacement}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `270`
			: $currentPlayer?.rank?.current?.dailyGlobalPlacement
			? $currentPlayer?.rank?.current?.dailyGlobalPlacement
			: 'N/A'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerDailyRegionalPlacement}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `138`
			: $currentPlayer?.rank?.current?.dailyRegionalPlacement
			? $currentPlayer?.rank?.current?.dailyRegionalPlacement
			: 'N/A'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerWins}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `50` : player.rank?.current?.wins ? player.rank?.current?.wins : 0}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerWinsPercent}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `66.7%`
			: player?.rank?.current?.winsPercent
			? `${player?.rank?.current?.winsPercent}%`
			: ''}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerLosses}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `25` : player?.rank?.current?.losses ? player?.rank?.current?.losses : 0}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerLossesPercent}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `33.3%`
			: player?.rank?.current?.lossesPercent
			? `${player?.rank?.current?.lossesPercent}%`
			: ''}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerCharacter1}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `Fox`
			: $currentPlayer?.rank?.current?.characters.at(0)?.characterName ?? ''}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerCharacter1Percent}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `74.3%`
			: $currentPlayer?.rank?.current?.characters.at(0)?.gameCountPercent
			? `${$currentPlayer?.rank?.current?.characters.at(0)?.gameCountPercent}%`
			: ''}%
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerCharacter1Icon}
	<RankedCharacterIcon
		{dataItem}
		{style}
		player={$currentPlayer}
		preview={defaultPreview}
		characterNumber={0}
		defaultPreviewId={Number(CHARACTERS['fox'])}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerCharacter2}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `Ganondorf`
			: $currentPlayer?.rank?.current?.characters.at(1)?.characterName ?? ''}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerCharacter2Percent}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `18.3%`
			: $currentPlayer?.rank?.current?.characters.at(1)?.gameCountPercent
			? `${$currentPlayer?.rank?.current?.characters.at(1)?.gameCountPercent}%`
			: ''}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerCharacter2Icon}
	<RankedCharacterIcon
		{dataItem}
		{style}
		player={$currentPlayer}
		preview={defaultPreview}
		characterNumber={1}
		defaultPreviewId={Number(CHARACTERS['ganondorf'])}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerCharacter3}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `Falco`
			: $currentPlayer?.rank?.current?.characters.at(2)?.characterName ?? ''}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerCharacter3Percent}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `7.4%`
			: $currentPlayer?.rank?.current?.characters.at(2)?.gameCountPercent
			? `${$currentPlayer?.rank?.current?.characters.at(2)?.gameCountPercent}%`
			: ''}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankCurrentPlayerCharacter3Icon}
	<RankedCharacterIcon
		{dataItem}
		{style}
		player={$currentPlayer}
		preview={defaultPreview}
		characterNumber={2}
		defaultPreviewId={Number(CHARACTERS['falco'])}
	/>
{/if}
