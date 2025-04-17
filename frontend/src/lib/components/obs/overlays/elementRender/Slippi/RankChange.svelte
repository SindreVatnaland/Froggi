<script lang="ts">
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import RatingDifference from './RatingDifference.svelte';
	import { CurrentPlayer } from '$lib/models/types/slippiData';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean = false;
	export let style: GridContentItemStyle;
	export let currentPlayer: CurrentPlayer;
</script>

<RatingDifference {dataItem} {style} {defaultPreview} {currentPlayer} />
