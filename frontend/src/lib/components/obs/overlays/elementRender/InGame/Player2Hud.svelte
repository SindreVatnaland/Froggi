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

{#if dataItem?.elementId === CustomElement.InGamePlayer2Percent}
	<PlayerPercent {style} {dataItem} {defaultPreview} numberOfDecimals={0} {player} />
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer2PercentDecimal}
	<PlayerPercent {style} {dataItem} {defaultPreview} numberOfDecimals={1} {player} />
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer2PercentCustom}
	<PlayerPercentCustom {style} {dataItem} {defaultPreview} numberOfDecimals={0} {player} />
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer2PercentDecimalCustom}
	<PlayerPercentCustom {style} {dataItem} {defaultPreview} numberOfDecimals={1} {player} />
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer2StocksRemaining}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? 4
			: gameFrame?.players?.[player?.playerIndex ?? 1]?.post.stocksRemaining ?? '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer2CharacterIcon}
	<InGameCharacterIcon
		{dataItem}
		{style}
		preview={defaultPreview}
		{player}
		defaultPreviewId={Number(CHARACTERS['falco'])}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer2CharacterRenderLeft}
	<InGameCharacterRender
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['falco'])}
		direction="left"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer2CharacterRenderRight}
	<InGameCharacterRender
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['falco'])}
		direction="right"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer2CharacterSeriesSymbol}
	<InGameCharacterSeriesSymbol
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['falco'])}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer2CharacterSeriesSymbolUltimate}
	<InGameCharacterSeriesSymbol
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['falco'])}
		series={'ultimate'}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer2ComboCounter}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? 3
			: gameFrame?.players?.[player?.playerIndex ?? 0]?.post.currentComboCount ?? '0'}
	</TextElement>
{/if}
