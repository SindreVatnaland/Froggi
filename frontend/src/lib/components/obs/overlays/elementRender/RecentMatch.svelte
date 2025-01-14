<script lang="ts">
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { currentMatch, currentPlayer } from '$lib/utils/store.svelte';
	import PlayerActionCount from './RecentMatch/RecentMatchPlayerActionCount.svelte';
	import PlayerAttackCount from './RecentMatch/RecentMatchPlayerAttackCount.svelte';
	import PlayerOverallStats from './RecentMatch/RecentMatchPlayerOverallStats.svelte';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;

	$: currentPlayerIndex = $currentPlayer?.playerIndex;

	$: stats = $currentMatch?.stats;
</script>

<PlayerAttackCount {dataItem} {defaultPreview} {style} playerIndex={currentPlayerIndex} {stats} />
<PlayerActionCount {dataItem} {defaultPreview} {style} playerIndex={currentPlayerIndex} {stats} />
<PlayerOverallStats {dataItem} {defaultPreview} {style} playerIndex={currentPlayerIndex} {stats} />

<PlayerAttackCount {dataItem} {defaultPreview} {style} playerIndex={0} {stats} />
<PlayerActionCount {dataItem} {defaultPreview} {style} playerIndex={0} {stats} />
<PlayerOverallStats {dataItem} {defaultPreview} {style} playerIndex={0} {stats} />

<PlayerAttackCount {dataItem} {defaultPreview} {style} playerIndex={1} {stats} />
<PlayerActionCount {dataItem} {defaultPreview} {style} playerIndex={1} {stats} />
<PlayerOverallStats {dataItem} {defaultPreview} {style} playerIndex={1} {stats} />
