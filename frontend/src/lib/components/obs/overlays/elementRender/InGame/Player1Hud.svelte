<script lang="ts">
	import { CHARACTERS } from '$lib/models/constants/characterData';
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { Player } from '$lib/models/types/slippiData';
	import { FrameEntryType } from '@slippi/slippi-js';
	import PlayerPercent from '../../element/PlayerPercent.svelte';
	import PlayerPercentCustom from '../../element/PlayerPercentCustom.svelte';
	import TextElement from '../../element/TextElement.svelte';
	import InGameCharacterIcon from '../../element/inGame/InGameCharacterIcon.svelte';
	import InGameCharacterRender from '../../element/inGame/InGameCharacterRender.svelte';
	import InGameCharacterSeriesSymbol from '../../element/inGame/InGameCharacterSeriesSymbol.svelte';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
	export let player: Player | undefined;
	export let gameFrame: FrameEntryType | null | undefined;
</script>

{#if dataItem?.elementId === CustomElement.InGamePlayer1Percent}
	<PlayerPercent {style} {dataItem} {defaultPreview} numberOfDecimals={0} {player} />
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer1PercentDecimal}
	<PlayerPercent {style} {dataItem} {defaultPreview} numberOfDecimals={1} {player} />
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer1PercentCustom}
	<PlayerPercentCustom {style} {dataItem} {defaultPreview} numberOfDecimals={0} {player} />
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer1PercentDecimalCustom}
	<PlayerPercentCustom {style} {dataItem} {defaultPreview} numberOfDecimals={1} {player} />
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer1StocksRemaining}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? 4
			: gameFrame?.players?.[player?.playerIndex ?? 0]?.post.stocksRemaining ?? '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer1CharacterIcon}
	<InGameCharacterIcon
		{dataItem}
		{style}
		preview={defaultPreview}
		{player}
		defaultPreviewId={Number(CHARACTERS['fox'])}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer1CharacterRenderLeft}
	<InGameCharacterRender
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['fox'])}
		direction="left"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer1CharacterRenderRight}
	<InGameCharacterRender
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['fox'])}
		direction="right"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer1CharacterSeriesSymbol}
	<InGameCharacterSeriesSymbol
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['fox'])}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer1CharacterSeriesSymbolUltimate}
	<InGameCharacterSeriesSymbol
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['fox'])}
		series={'ultimate'}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer1ComboCounter}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? 3
			: gameFrame?.players?.[player?.playerIndex ?? 0]?.post.currentComboCount ?? '0'}
	</TextElement>
{/if}
