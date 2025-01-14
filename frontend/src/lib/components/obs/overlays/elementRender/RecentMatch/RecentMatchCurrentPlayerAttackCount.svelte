<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { currentPlayer, currentMatch } from '$lib/utils/store.svelte';
	import TextElement from '$lib/components/obs/overlays/element/TextElement.svelte';
	import { MatchStats } from '$lib/models/types/slippiData';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;

	export let playerIndex: number;
	export let stats: MatchStats;

	$: attackCount = stats?.actionCounts?.[playerIndex ?? 0]?.attackCount;
</script>

{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerAttackCountBair}
	<TextElement {style} {dataItem}>
		{![attackCount?.bair, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.bair
			: defaultPreview
			? `${28 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerAttackCountDair}
	<TextElement {style} {dataItem}>
		{![attackCount?.dair, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.dair
			: defaultPreview
			? `${28 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerAttackCountDash}
	<TextElement {style} {dataItem}>
		{![attackCount?.dash, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.dash
			: defaultPreview
			? `${28 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerAttackCountDsmash}
	<TextElement {style} {dataItem}>
		{![attackCount?.dsmash, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.dsmash
			: defaultPreview
			? `${8 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerAttackCountDtilt}
	<TextElement {style} {dataItem}>
		{![attackCount?.dtilt, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.dtilt
			: defaultPreview
			? `${14 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerAttackCountFair}
	<TextElement {style} {dataItem}>
		{![attackCount?.fair, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.fair
			: defaultPreview
			? `${7 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerAttackCountFsmash}
	<TextElement {style} {dataItem}>
		{![attackCount?.fsmash, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.fsmash
			: defaultPreview
			? `${13 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerAttackCountFtilt}
	<TextElement {style} {dataItem}>
		{![attackCount?.ftilt, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.ftilt
			: defaultPreview
			? `${13 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerAttackCountJab}
	<TextElement {style} {dataItem}>
		{![attackCount?.jab1, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.jab1
			: defaultPreview
			? `${11 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerAttackCountJab2}
	<TextElement {style} {dataItem}>
		{![attackCount?.jab2, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.jab2
			: defaultPreview
			? `${11 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerAttackCountJab3}
	<TextElement {style} {dataItem}>
		{![attackCount?.jab3, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.jab3
			: defaultPreview
			? `${10 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerAttackCountJabMulti}
	<TextElement {style} {dataItem}>
		{![attackCount?.jabm, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.jabm
			: defaultPreview
			? `${2 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerAttackCountNair}
	<TextElement {style} {dataItem}>
		{![attackCount?.nair, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.nair
			: defaultPreview
			? `${22 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerAttackCountUair}
	<TextElement {style} {dataItem}>
		{![attackCount?.uair, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.uair
			: defaultPreview
			? `${16 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerAttackCountUsmash}
	<TextElement {style} {dataItem}>
		{![attackCount?.usmash, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.usmash
			: defaultPreview
			? `${5 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerAttackCountUtilt}
	<TextElement {style} {dataItem}>
		{![attackCount?.utilt, playerIndex].some((e) => e === undefined || e === null)
			? attackCount?.utilt
			: defaultPreview
			? `${5 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
