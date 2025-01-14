<script lang="ts">
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { currentPlayer, postGame } from '$lib/utils/store.svelte';
	import PlayerActionCount from './RecentGame/RecentGameCurrentPlayerActionCount.svelte';
	import PlayerAttackCount from './RecentGame/RecentGameCurrentPlayerAttackCount.svelte';
	import PlayerOverallStats from './RecentGame/RecentGameCurrentPlayerOverallStats.svelte';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;

	$: stats = $postGame?.postGameStats;

	$: currentPlayerIndex = $currentPlayer?.playerIndex ?? 0;
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
