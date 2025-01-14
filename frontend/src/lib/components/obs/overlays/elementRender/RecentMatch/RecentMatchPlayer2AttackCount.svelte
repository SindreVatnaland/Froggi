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

	$: attackCount = stats?.actionCounts?.[playerIndex ?? 0]?.attackCount;
</script>

{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2AttackCountBair}
	<TextElement {style} {dataItem}>
		{![attackCount?.bair, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.bair
			: defaultPreview
			? `${28 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2AttackCountDair}
	<TextElement {style} {dataItem}>
		{![attackCount?.dair, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.dair
			: defaultPreview
			? `${28 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2AttackCountDash}
	<TextElement {style} {dataItem}>
		{![attackCount?.dash, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.dash
			: defaultPreview
			? `${28 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2AttackCountDsmash}
	<TextElement {style} {dataItem}>
		{![attackCount?.dsmash, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.dsmash
			: defaultPreview
			? `${8 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2AttackCountDtilt}
	<TextElement {style} {dataItem}>
		{![attackCount?.dtilt, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.dtilt
			: defaultPreview
			? `${14 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2AttackCountFair}
	<TextElement {style} {dataItem}>
		{![attackCount?.fair, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.fair
			: defaultPreview
			? `${7 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2AttackCountFsmash}
	<TextElement {style} {dataItem}>
		{![attackCount?.fsmash, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.fsmash
			: defaultPreview
			? `${13 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2AttackCountFtilt}
	<TextElement {style} {dataItem}>
		{![attackCount?.ftilt, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.ftilt
			: defaultPreview
			? `${13 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2AttackCountJab}
	<TextElement {style} {dataItem}>
		{![attackCount?.jab1, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.jab1
			: defaultPreview
			? `${11 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2AttackCountJab2}
	<TextElement {style} {dataItem}>
		{![attackCount?.jab2, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.jab2
			: defaultPreview
			? `${11 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2AttackCountJab3}
	<TextElement {style} {dataItem}>
		{![attackCount?.jab3, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.jab3
			: defaultPreview
			? `${10 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2AttackCountJabMulti}
	<TextElement {style} {dataItem}>
		{![attackCount?.jabm, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.jabm
			: defaultPreview
			? `${2 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2AttackCountNair}
	<TextElement {style} {dataItem}>
		{![attackCount?.nair, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.nair
			: defaultPreview
			? `${22 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2AttackCountUair}
	<TextElement {style} {dataItem}>
		{![attackCount?.uair, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.uair
			: defaultPreview
			? `${16 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2AttackCountUsmash}
	<TextElement {style} {dataItem}>
		{![attackCount?.usmash, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.usmash
			: defaultPreview
			? `${5 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2AttackCountUtilt}
	<TextElement {style} {dataItem}>
		{![attackCount?.utilt, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.utilt
			: defaultPreview
			? `${5 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
