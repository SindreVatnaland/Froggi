<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { currentPlayer, postGame } from '$lib/utils/store.svelte';
	import TextElement from '$lib/components/obs/overlays/element/TextElement.svelte';
	import { isNil } from 'lodash';
	import { StatsType } from '@slippi/slippi-js';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;

	export let playerIndex: number;
	export let stats: StatsType | null;

	$: playerOverall = stats?.overall?.[playerIndex ?? 0];
	$: playerStocks = stats?.stocks.find((stock) => stock.playerIndex === playerIndex);
</script>

{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerOverallBeneficialTradeCount}
	<TextElement {style} {dataItem}>
		{![playerOverall?.beneficialTradeRatio.count, playerIndex].some(isNil)
			? playerOverall?.beneficialTradeRatio.count
			: defaultPreview
			? `${9 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerOverallBeneficialTradeRatio}
	<TextElement {style} {dataItem}>
		{![playerOverall?.beneficialTradeRatio.ratio, playerIndex].some(isNil)
			? (playerOverall?.beneficialTradeRatio?.ratio ?? 0) * 100
			: defaultPreview
			? `${75.0 + playerIndex}`
			: '0'}%
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerOverallCounterHitCount}
	<TextElement {style} {dataItem}>
		{![playerOverall?.counterHitRatio?.count, playerIndex].some(isNil)
			? playerOverall?.counterHitRatio.count
			: defaultPreview
			? `${10 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerOverallCounterHitRatio}
	<TextElement {style} {dataItem}>
		{![playerOverall?.counterHitRatio.ratio, playerIndex].some(isNil)
			? (playerOverall?.counterHitRatio.ratio ?? 0) * 100
			: defaultPreview
			? `${60.0 + playerIndex}`
			: '0.0'}%
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerOverallDamageTotal}
	<TextElement {style} {dataItem}>
		{![playerOverall?.totalDamage, playerIndex].some(isNil)
			? playerOverall?.totalDamage.toFixed(1)
			: defaultPreview
			? `${360.5 + playerIndex}`
			: '0.0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerOverallOpeningsTotal}
	<TextElement {style} {dataItem}>
		{![playerOverall?.openingsPerKill?.total, playerIndex].some(isNil)
			? playerOverall?.openingsPerKill.total
			: defaultPreview
			? `${27 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerOverallDamagePerOpening}
	<TextElement {style} {dataItem}>
		{![playerOverall?.damagePerOpening.ratio, playerIndex].some(isNil)
			? playerOverall?.damagePerOpening.ratio?.toFixed(1)
			: defaultPreview
			? `${15.6 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerOverallOpeningsPerKill}
	<TextElement {style} {dataItem}>
		{![playerOverall?.openingsPerKill.count, playerIndex].some(isNil)
			? playerOverall?.openingsPerKill.count.toFixed(1) ?? '0.0'
			: defaultPreview
			? `${6.7 + playerIndex}`
			: '0.0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerOverallDigitalInputsTotal}
	<TextElement {style} {dataItem}>
		{![playerOverall?.digitalInputsPerMinute.total, playerIndex].includes(undefined)
			? playerOverall?.digitalInputsPerMinute.total
			: defaultPreview
			? `${945 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerOverallDigitalInputsPerMinute}
	<TextElement {style} {dataItem}>
		{![playerOverall?.digitalInputsPerMinute.count, playerIndex].includes(undefined)
			? playerOverall?.digitalInputsPerMinute.count.toFixed(0)
			: defaultPreview
			? `${315 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerOverallDigitalInputsPerSecond}
	<TextElement {style} {dataItem}>
		{![playerOverall?.digitalInputsPerMinute.count, playerIndex].includes(undefined)
			? ((playerOverall?.digitalInputsPerMinute?.count ?? 0) / 60).toFixed(2)
			: defaultPreview
			? `${(5.25 + playerIndex / 60).toFixed(2)}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerOverallInputsTotal}
	<TextElement {style} {dataItem}>
		{![playerOverall?.inputsPerMinute.total, playerIndex].some(isNil)
			? playerOverall?.inputsPerMinute.total
			: defaultPreview
			? `${1200 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerOverallInputsPerMinute}
	<TextElement {style} {dataItem}>
		{![playerOverall?.inputsPerMinute.count, playerIndex].some(isNil)
			? playerOverall?.inputsPerMinute.count.toFixed(0)
			: defaultPreview
			? `${400 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerOverallInputsPerSecond}
	<TextElement {style} {dataItem}>
		{![playerOverall?.inputsPerMinute.count, playerIndex].some(isNil)
			? ((playerOverall?.inputsPerMinute.count ?? 0) / 60).toFixed(2)
			: defaultPreview
			? `${(6.67 + playerIndex / 60).toFixed(2)}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerOverallNeutralWinsCount}
	<TextElement {style} {dataItem}>
		{![playerOverall?.neutralWinRatio.count, playerIndex].some(isNil)
			? playerOverall?.neutralWinRatio.count
			: defaultPreview
			? `${18 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerOverallNeutralWinsRatio}
	<TextElement {style} {dataItem}>
		{![playerOverall?.neutralWinRatio.ratio, playerIndex].some(isNil)
			? (playerOverall?.neutralWinRatio?.ratio ?? 0 * 100).toFixed(1)
			: defaultPreview
			? `${56.0 + playerIndex}`
			: '0'}%
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerOverallStocksRemaining}
	<TextElement {style} {dataItem}>
		{![playerStocks?.count, playerIndex].some(isNil)
			? playerStocks?.count ?? 0
			: defaultPreview
			? `${2 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
