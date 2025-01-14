<script lang="ts">
	import { CHARACTERS } from '$lib/models/constants/characterData';
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { isNil } from 'lodash';
	import PlayerRankIcon from '../../element/PlayerRankIcon.svelte';
	import RankedCharacterIcon from '../../element/RankedCharacterIcon.svelte';
	import TextElement from '../../element/TextElement.svelte';
	import { Player } from '$lib/models/types/slippiData';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
	export let player: Player | undefined;
</script>

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer1ConnectCode}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `ABCD#123` : player?.rank?.current?.connectCode}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankPlayer1RankIcon}
	<PlayerRankIcon
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		fallbackIcon={'SILVER 2'}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankPlayer1RankText}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `Silver 2` : player?.rank?.current?.rank ?? 'Unranked'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer1Rating}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `1174.0` : player?.rank?.current?.rating ?? '-'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer1Continent}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `Europe` : player?.rank?.current?.continent ?? 'N/A'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer1ContinentInitials}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `EU` : player?.rank?.current?.continentInitials ?? 'N/A'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer1DailyGlobalPlacement}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `243` : player?.rank?.current?.dailyGlobalPlacement ?? 'N/A'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer1DailyRegionalPlacement}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `117` : player?.rank?.current?.dailyRegionalPlacement ?? 'N/A'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer1Wins}
	<TextElement {style} {dataItem}>
		{defaultPreview ? 40 : player?.rank?.current?.wins ?? 0}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer1WinsPercent}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `80.0%`
			: !isNil(player?.rank?.current?.winsPercent)
			? `${player?.rank?.current?.winsPercent}%`
			: '100%'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer1Losses}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `10` : player?.rank?.current?.losses ?? 0}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer1LossesPercent}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `20.0%`
			: !isNil(player?.rank?.current?.lossesPercent)
			? `${player?.rank?.current?.lossesPercent}%`
			: '0%'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer1Character1}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `Peach` : player?.rank?.current?.characters.at(0)?.characterName ?? ''}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankPlayer1Character1Percent}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `75.0%`
			: !isNil(player?.rank?.current?.characters.at(0)?.gameCountPercent)
			? `${player?.rank?.current?.characters.at(0)?.gameCountPercent}%`
			: ''}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankPlayer1Character1Icon}
	<RankedCharacterIcon
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		characterNumber={0}
		defaultPreviewId={Number(CHARACTERS['peach'])}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankPlayer1Character2}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `Sheik` : player?.rank?.current?.characters.at(1)?.characterName ?? ''}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankPlayer1Character2Percent}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `20.4%`
			: !isNil(player?.rank?.current?.characters.at(1)?.gameCountPercent)
			? `${player?.rank?.current?.characters.at(1)?.gameCountPercent}%`
			: ''}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankPlayer1Character2Icon}
	<RankedCharacterIcon
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		characterNumber={1}
		defaultPreviewId={Number(CHARACTERS['sheik'])}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankPlayer1Character3}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `Marth` : player?.rank?.current?.characters.at(2)?.characterName ?? ''}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankPlayer1Character3Percent}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `4.6%`
			: !isNil(player?.rank?.current?.characters.at(2)?.gameCountPercent)
			? `${player?.rank?.current?.characters.at(2)?.gameCountPercent}%`
			: ''}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankPlayer1Character3Icon}
	<RankedCharacterIcon
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		characterNumber={2}
		defaultPreviewId={Number(CHARACTERS['marth'])}
	/>
{/if}
