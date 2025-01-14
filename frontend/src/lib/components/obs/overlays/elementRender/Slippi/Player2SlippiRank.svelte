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

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2ConnectCode}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `GHIJ#456` : player?.rank?.current?.connectCode ?? ''}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2RankIcon}
	<PlayerRankIcon {dataItem} {style} {player} preview={defaultPreview} />
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2RankText}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `Silver 1` : player?.rank?.current?.rank ?? 'Unranked'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2Rating}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `1100.0` : player?.rank?.current?.rating ?? '-'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2Continent}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `N. America` : player?.rank?.current?.continent ?? 'N/A'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2ContinentInitials}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `NA` : player?.rank?.current?.continentInitials ?? 'N/A'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2DailyGlobalPlacement}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `223` : player?.rank?.current?.dailyGlobalPlacement ?? 'N/A'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2DailyRegionalPlacement}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `107` : player?.rank?.current?.dailyRegionalPlacement ?? 'N/A'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2Wins}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `30` : player?.rank?.current?.wins ?? 0}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2WinsPercent}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `90%`
			: !isNil(player?.rank?.current?.winsPercent)
			? `${player?.rank?.current?.winsPercent}%`
			: '100%'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2Losses}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `3` : player?.rank?.current?.losses ?? 0}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2LossesPercent}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `10.0%`
			: !isNil(player?.rank?.current?.lossesPercent)
			? `${player?.rank?.current?.lossesPercent}%`
			: '0%'}
	</TextElement>
{/if}

{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2Character1}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `Marth` : player?.rank?.current?.characters.at(0)?.characterName ?? ''}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2Character1Percent}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `82.0%`
			: !isNil(player?.rank?.current?.characters.at(0)?.gameCountPercent)
			? `${player?.rank?.current?.characters.at(0)?.gameCountPercent}%`
			: ''}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2Character1Icon}
	<RankedCharacterIcon
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		characterNumber={1}
		defaultPreviewId={Number(CHARACTERS['marth'])}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2Character2}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `Samus` : player?.rank?.current?.characters.at(1)?.characterName ?? ''}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2Character2Percent}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `13.8%`
			: !isNil(player?.rank?.current?.characters.at(1)?.gameCountPercent)
			? `${player?.rank?.current?.characters.at(1)?.gameCountPercent}%`
			: ''}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2Character2Icon}
	<RankedCharacterIcon
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		characterNumber={1}
		defaultPreviewId={Number(CHARACTERS['samus'])}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2Character3}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `Bowser` : player?.rank?.current?.characters.at(2)?.characterName ?? ''}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2Character3Percent}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `4.2%`
			: !isNil(player?.rank?.current?.characters.at(2)?.gameCountPercent)
			? `${player?.rank?.current?.characters.at(2)?.gameCountPercent}%`
			: ''}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SlippiRankPlayer2Character3Icon}
	<RankedCharacterIcon
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		characterNumber={2}
		defaultPreviewId={Number(CHARACTERS['bowser'])}
	/>
{/if}
