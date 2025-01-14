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

	$: attackCount = stats?.actionCounts?.[playerIndex ?? 0]?.attackCount;
</script>

{#if dataItem?.elementId === CustomElement.PostGamePlayer1AttackCountBair}
	<TextElement {style} {dataItem}>
		{![attackCount?.bair, playerIndex].some(isNil)
			? attackCount?.bair
			: defaultPreview
			? `${28 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1AttackCountDair}
	<TextElement {style} {dataItem}>
		{![attackCount?.dair, playerIndex].some(isNil)
			? attackCount?.dair
			: defaultPreview
			? `${28 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1AttackCountDash}
	<TextElement {style} {dataItem}>
		{![attackCount?.dash, playerIndex].some(isNil)
			? attackCount?.dash
			: defaultPreview
			? `${28 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1AttackCountDsmash}
	<TextElement {style} {dataItem}>
		{![attackCount?.dsmash, playerIndex].some(isNil)
			? attackCount?.dsmash
			: defaultPreview
			? `${8 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1AttackCountDtilt}
	<TextElement {style} {dataItem}>
		{![attackCount?.dtilt, playerIndex].some(isNil)
			? attackCount?.dtilt
			: defaultPreview
			? `${14 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1AttackCountFair}
	<TextElement {style} {dataItem}>
		{![attackCount?.fair, playerIndex].some(isNil)
			? attackCount?.fair
			: defaultPreview
			? `${7 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1AttackCountFsmash}
	<TextElement {style} {dataItem}>
		{![attackCount?.fsmash, playerIndex].some(isNil)
			? attackCount?.fsmash
			: defaultPreview
			? `${13 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1AttackCountFtilt}
	<TextElement {style} {dataItem}>
		{![attackCount?.ftilt, playerIndex].some(isNil)
			? attackCount?.ftilt
			: defaultPreview
			? `${13 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1AttackCountJab}
	<TextElement {style} {dataItem}>
		{![attackCount?.jab1, playerIndex].some(isNil)
			? attackCount?.jab1
			: defaultPreview
			? `${11 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1AttackCountJab2}
	<TextElement {style} {dataItem}>
		{![attackCount?.jab2, playerIndex].some(isNil)
			? attackCount?.jab2
			: defaultPreview
			? `${11 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1AttackCountJab3}
	<TextElement {style} {dataItem}>
		{![attackCount?.jab3, playerIndex].some(isNil)
			? attackCount?.jab3
			: defaultPreview
			? `${10 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1AttackCountJabMulti}
	<TextElement {style} {dataItem}>
		{![attackCount?.jabm, playerIndex].some(isNil)
			? attackCount?.jabm
			: defaultPreview
			? `${2 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1AttackCountNair}
	<TextElement {style} {dataItem}>
		{![attackCount?.nair, playerIndex].some(isNil)
			? attackCount?.nair
			: defaultPreview
			? `${22 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1AttackCountUair}
	<TextElement {style} {dataItem}>
		{![attackCount?.uair, playerIndex].some(isNil)
			? attackCount?.uair
			: defaultPreview
			? `${16 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1AttackCountUsmash}
	<TextElement {style} {dataItem}>
		{![attackCount?.usmash, playerIndex].some(isNil)
			? attackCount?.usmash
			: defaultPreview
			? `${5 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1AttackCountUtilt}
	<TextElement {style} {dataItem}>
		{![attackCount?.utilt, playerIndex].some(isNil)
			? attackCount?.utilt
			: defaultPreview
			? `${5 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
