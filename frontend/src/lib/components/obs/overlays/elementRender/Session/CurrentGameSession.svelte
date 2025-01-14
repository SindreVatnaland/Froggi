<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { sessionStats } from '$lib/utils/store.svelte';
	import TextElement from '../../element/TextElement.svelte';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;

	$: wins =
		Number($sessionStats?.currentRankStats?.wins) - Number($sessionStats?.startRankStats?.wins);
	$: losses =
		Number($sessionStats?.currentRankStats?.losses) -
		Number($sessionStats?.startRankStats?.losses);
	$: numberOfGames = (wins ?? 0) + (losses ?? 0);
	$: rating =
		Number($sessionStats?.currentRankStats?.rating) -
		Number($sessionStats?.startRankStats?.rating);
</script>

{#if dataItem?.elementId === CustomElement.SessionWins}
	<TextElement {style} {dataItem}>
		{wins ? `${wins}` : defaultPreview ? `13` : '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SessionLosses}
	<TextElement {style} {dataItem}>
		{losses ? `${losses}` : defaultPreview ? `7` : '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SessionGameNumber}
	<TextElement {style} {dataItem}>
		{numberOfGames ? `${numberOfGames}` : defaultPreview ? `20` : '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.SessionRating}
	<TextElement {style} {dataItem}>
		{rating ? `${rating > 0 ? '+' : ''}${rating.toFixed(1)}` : defaultPreview ? `+130` : '+0'}
	</TextElement>
{/if}
