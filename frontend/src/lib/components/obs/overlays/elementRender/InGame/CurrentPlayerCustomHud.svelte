<script lang="ts">
	import { CHARACTERS } from '$lib/models/constants/characterData';
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { currentPlayer, gameFrame } from '$lib/utils/store.svelte';
	import PlayerPercent from '$lib/components/obs/overlays/element/PlayerPercent.svelte';
	import InGameCharacterIcon from '$lib/components/obs/overlays/element/inGame/InGameCharacterIcon.svelte';
	import InGameCharacterRender from '$lib/components/obs/overlays/element/inGame/InGameCharacterRender.svelte';
	import InGameCharacterSeriesSymbol from '$lib/components/obs/overlays/element/inGame/InGameCharacterSeriesSymbol.svelte';
	import TextElement from '$lib/components/obs/overlays/element/TextElement.svelte';
	import PlayerPercentCustom from '../../element/PlayerPercentCustom.svelte';
	import { Player } from '$lib/models/types/slippiData';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
	export let player: Player;
</script>

{#if dataItem?.elementId === CustomElement.InGameCurrentPlayerPercent}
	<PlayerPercent {style} {dataItem} {defaultPreview} numberOfDecimals={0} {player} />
{/if}
{#if dataItem?.elementId === CustomElement.InGameCurrentPlayerPercentDecimal}
	<PlayerPercent {style} {dataItem} {defaultPreview} numberOfDecimals={1} {player} />
{/if}
{#if dataItem?.elementId === CustomElement.InGameCurrentPlayerPercentCustom}
	<PlayerPercentCustom {style} {dataItem} {defaultPreview} numberOfDecimals={0} {player} />
{/if}
{#if dataItem?.elementId === CustomElement.InGameCurrentPlayerPercentDecimalCustom}
	<PlayerPercentCustom {style} {dataItem} {defaultPreview} numberOfDecimals={1} {player} />
{/if}
{#if dataItem?.elementId === CustomElement.InGameCurrentPlayerStocksRemaining}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? 4
			: $gameFrame?.players?.[player?.playerIndex ?? 0]?.post.stocksRemaining ?? '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.InGameCurrentPlayerCharacterIcon}
	<InGameCharacterIcon
		{dataItem}
		{style}
		preview={defaultPreview}
		{player}
		defaultPreviewId={Number(CHARACTERS['fox'])}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGameCurrentPlayerCharacterRenderLeft}
	<InGameCharacterRender
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['fox'])}
		direction={'left'}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGameCurrentPlayerCharacterRenderRight}
	<InGameCharacterRender
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['fox'])}
		direction={'right'}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGameCurrentPlayerCharacterSeriesSymbol}
	<InGameCharacterSeriesSymbol
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['fox'])}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGameCurrentPlayerCharacterSeriesSymbolUltimate}
	<InGameCharacterSeriesSymbol
		{dataItem}
		{style}
		{player}
		preview={defaultPreview}
		defaultPreviewId={Number(CHARACTERS['fox'])}
		series={'ultimate'}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGameCurrentPlayerComboCounter}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? '3'
			: $gameFrame?.players?.[player?.playerIndex ?? 0]?.post.currentComboCount ?? '0'}
	</TextElement>
{/if}
