<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import TextElement from '$lib/components/obs/overlays/element/TextElement.svelte';
	import { MatchStats } from '$lib/models/types/slippiData';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;

	export let playerIndex: number;
	export let stats: MatchStats;

	$: overall = stats?.overall?.[playerIndex ?? 0];
</script>

{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1OverallBeneficialTradeCount}
	<TextElement {style} {dataItem}>
		{![overall?.beneficialTradeRatio.count, playerIndex].some(
			(e) => e === undefined || e === null,
		)
			? overall?.beneficialTradeRatio.count
			: defaultPreview
			? `${8 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1OverallBeneficialTradeRatio}
	<TextElement {style} {dataItem}>
		{![overall?.beneficialTradeRatio.ratio, playerIndex].some(
			(e) => e === undefined || e === null,
		)
			? (overall?.beneficialTradeRatio?.ratio ?? 0) * 100
			: defaultPreview
			? `${75.0 + playerIndex}`
			: '0'}%
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1OverallCounterHitCount}
	<TextElement {style} {dataItem}>
		{![overall?.counterHitRatio?.count, playerIndex].some((e) => e === undefined || e === null)
			? overall?.counterHitRatio.count
			: defaultPreview
			? `${10 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1OverallCounterHitRatio}
	<TextElement {style} {dataItem}>
		{![overall?.counterHitRatio.ratio, playerIndex].some((e) => e === undefined || e === null)
			? (overall?.counterHitRatio.ratio ?? 0) * 100
			: defaultPreview
			? `${60.0 + playerIndex}`
			: '0.0'}%
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1OverallDamageTotal}
	<TextElement {style} {dataItem}>
		{![overall?.totalDamage, playerIndex].some((e) => e === undefined || e === null)
			? overall?.totalDamage.toFixed(1)
			: defaultPreview
			? `${360.5 + playerIndex}`
			: '0.0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1OverallOpeningsTotal}
	<TextElement {style} {dataItem}>
		{![overall?.openingsPerKill?.total, playerIndex].some((e) => e === undefined || e === null)
			? overall?.openingsPerKill.total
			: defaultPreview
			? `${27 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1OverallDamagePerOpening}
	<TextElement {style} {dataItem}>
		{![overall?.damagePerOpening.ratio, playerIndex].some((e) => e === undefined || e === null)
			? overall?.damagePerOpening.ratio?.toFixed(1)
			: defaultPreview
			? `${15.6 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1OverallOpeningsPerKill}
	<TextElement {style} {dataItem}>
		{![overall?.openingsPerKill.count, playerIndex].some((e) => e === undefined || e === null)
			? overall?.openingsPerKill.count.toFixed(1) ?? '0.0'
			: defaultPreview
			? `${6.7 + playerIndex}`
			: '0.0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1OverallDigitalInputsTotal}
	<TextElement {style} {dataItem}>
		{overall?.digitalInputsPerMinute.total !== undefined
			? overall?.digitalInputsPerMinute.total
			: defaultPreview
			? `${945 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1OverallDigitalInputsPerMinute}
	<TextElement {style} {dataItem}>
		{overall?.digitalInputsPerMinute.count !== undefined
			? overall?.digitalInputsPerMinute.count.toFixed(0)
			: defaultPreview
			? `${315 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1OverallDigitalInputsPerSecond}
	<TextElement {style} {dataItem}>
		{overall?.digitalInputsPerMinute.count !== undefined
			? ((overall?.digitalInputsPerMinute?.count ?? 0) / 60).toFixed(2)
			: defaultPreview
			? `${(5.25 + playerIndex / 60).toFixed(2)}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1OverallInputsTotal}
	<TextElement {style} {dataItem}>
		{![overall?.inputsPerMinute.total, playerIndex].some((e) => e === undefined || e === null)
			? overall?.inputsPerMinute.total
			: defaultPreview
			? `${1200 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1OverallInputsPerMinute}
	<TextElement {style} {dataItem}>
		{![overall?.inputsPerMinute.count, playerIndex].some((e) => e === undefined || e === null)
			? overall?.inputsPerMinute.count.toFixed(0)
			: defaultPreview
			? `${400 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1OverallInputsPerSecond}
	<TextElement {style} {dataItem}>
		{![overall?.inputsPerMinute.count, playerIndex].some((e) => e === undefined || e === null)
			? ((overall?.inputsPerMinute.count ?? 0) / 60).toFixed(2)
			: defaultPreview
			? `${(6.67 + playerIndex / 60).toFixed(2)}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1OverallNeutralWinsCount}
	<TextElement {style} {dataItem}>
		{![overall?.neutralWinRatio.count, playerIndex].some((e) => e === undefined || e === null)
			? overall?.neutralWinRatio.count
			: defaultPreview
			? `${18 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1OverallNeutralWinsRatio}
	<TextElement {style} {dataItem}>
		{![overall?.neutralWinRatio.ratio, playerIndex].some((e) => e === undefined || e === null)
			? (overall?.neutralWinRatio?.ratio ?? 0 * 100).toFixed(1)
			: defaultPreview
			? `${(56.0 + playerIndex).toFixed(1)}`
			: '0'}%
	</TextElement>
{/if}
