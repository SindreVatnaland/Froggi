<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { GameStartType } from '@slippi/slippi-js';
	import RatingDifference from './RatingDifference.svelte';
	import { CurrentPlayer, GameStartTypeExtended } from '$lib/models/types/slippiData';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean = false;
	export let style: GridContentItemStyle;
	export let currentPlayer: CurrentPlayer;
	export let gameSettings: GameStartTypeExtended;
</script>

{#if dataItem?.elementId === CustomElement.SlippiRankChangeRatingDifference}
	<RatingDifference {dataItem} {style} {defaultPreview} {currentPlayer} {gameSettings} />
{/if}
