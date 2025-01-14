<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import TextElement from '$lib/components/obs/overlays/element/TextElement.svelte';
	import { isNil } from 'lodash';
	import { StatsType } from '@slippi/slippi-js';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;

	export let playerIndex: number;
	export let stats: StatsType | null | undefined;

	$: playerOverall = stats?.overall?.[playerIndex ?? 0];
	$: playerStocks = stats?.stocks.find((stock) => stock.playerIndex === playerIndex);
</script>

{#if dataItem?.elementId === CustomElement.PostGamePlayer2OverallBeneficialTradeCount}
	<TextElement {style} {dataItem}>
		{![playerOverall?.beneficialTradeRatio.count, playerIndex].some(isNil)
			? playerOverall?.beneficialTradeRatio.count
			: defaultPreview
			? `${9 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2OverallBeneficialTradeRatio}
	<TextElement {style} {dataItem}>
		{![playerOverall?.beneficialTradeRatio.ratio, playerIndex].some(isNil)
			? (playerOverall?.beneficialTradeRatio?.ratio ?? 0) * 100
			: defaultPreview
			? `${75.0 + playerIndex}`
			: '0'}%
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2OverallCounterHitCount}
	<TextElement {style} {dataItem}>
		{![playerOverall?.counterHitRatio?.count, playerIndex].some(isNil)
			? playerOverall?.counterHitRatio.count
			: defaultPreview
			? `${10 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2OverallCounterHitRatio}
	<TextElement {style} {dataItem}>
		{![playerOverall?.counterHitRatio.ratio, playerIndex].some(isNil)
			? (playerOverall?.counterHitRatio.ratio ?? 0) * 100
			: defaultPreview
			? `${60.0 + playerIndex}`
			: '0.0'}%
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2OverallDamageTotal}
	<TextElement {style} {dataItem}>
		{![playerOverall?.totalDamage, playerIndex].some(isNil)
			? playerOverall?.totalDamage.toFixed(1)
			: defaultPreview
			? `${360.5 + playerIndex}`
			: '0.0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2OverallOpeningsTotal}
	<TextElement {style} {dataItem}>
		{![playerOverall?.openingsPerKill?.total, playerIndex].some(isNil)
			? playerOverall?.openingsPerKill.total
			: defaultPreview
			? `${27 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2OverallDamagePerOpening}
	<TextElement {style} {dataItem}>
		{![playerOverall?.damagePerOpening.ratio, playerIndex].some(isNil)
			? playerOverall?.damagePerOpening.ratio?.toFixed(1)
			: defaultPreview
			? `${15.6 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2OverallOpeningsPerKill}
	<TextElement {style} {dataItem}>
		{![playerOverall?.openingsPerKill.count, playerIndex].some(isNil)
			? playerOverall?.openingsPerKill.count.toFixed(1) ?? '0.0'
			: defaultPreview
			? `${6.7 + playerIndex}`
			: '0.0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2OverallDigitalInputsTotal}
	<TextElement {style} {dataItem}>
		{![playerOverall?.digitalInputsPerMinute.total, playerIndex].includes(undefined)
			? playerOverall?.digitalInputsPerMinute.total
			: defaultPreview
			? `${945 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2OverallDigitalInputsPerMinute}
	<TextElement {style} {dataItem}>
		{![playerOverall?.digitalInputsPerMinute.count, playerIndex].includes(undefined)
			? playerOverall?.digitalInputsPerMinute.count.toFixed(0)
			: defaultPreview
			? `${315 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2OverallDigitalInputsPerSecond}
	<TextElement {style} {dataItem}>
		{![playerOverall?.digitalInputsPerMinute.count, playerIndex].includes(undefined)
			? ((playerOverall?.digitalInputsPerMinute?.count ?? 0) / 60).toFixed(2)
			: defaultPreview
			? `${(5.25 + playerIndex / 60).toFixed(2)}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2OverallInputsTotal}
	<TextElement {style} {dataItem}>
		{![playerOverall?.inputsPerMinute.total, playerIndex].some(isNil)
			? playerOverall?.inputsPerMinute.total
			: defaultPreview
			? `${1200 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2OverallInputsPerMinute}
	<TextElement {style} {dataItem}>
		{![playerOverall?.inputsPerMinute.count, playerIndex].some(isNil)
			? playerOverall?.inputsPerMinute.count.toFixed(0)
			: defaultPreview
			? `${400 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2OverallInputsPerSecond}
	<TextElement {style} {dataItem}>
		{![playerOverall?.inputsPerMinute.count, playerIndex].some(isNil)
			? ((playerOverall?.inputsPerMinute.count ?? 0) / 60).toFixed(2)
			: defaultPreview
			? `${(6.67 + playerIndex / 60).toFixed(2)}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2OverallNeutralWinsCount}
	<TextElement {style} {dataItem}>
		{![playerOverall?.neutralWinRatio.count, playerIndex].some(isNil)
			? playerOverall?.neutralWinRatio.count
			: defaultPreview
			? `${18 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2OverallNeutralWinsRatio}
	<TextElement {style} {dataItem}>
		{![playerOverall?.neutralWinRatio.ratio, playerIndex].some(isNil)
			? (playerOverall?.neutralWinRatio?.ratio ?? 0 * 100).toFixed(1)
			: defaultPreview
			? `${56.0 + playerIndex}`
			: '0'}%
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2OverallStocksRemaining}
	<TextElement {style} {dataItem}>
		{![playerStocks?.count, playerIndex].some(isNil)
			? playerStocks?.count ?? 0
			: defaultPreview
			? `${2 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
