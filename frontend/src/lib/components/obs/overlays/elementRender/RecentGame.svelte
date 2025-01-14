<script lang="ts">
	import { LiveStatsScene } from '$lib/models/enum';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { statsScene } from '$lib/utils/store.svelte';
	import CurrentPlayerActionCount from './RecentGame/RecentGameCurrentPlayerActionCount.svelte';
	import CurrentPlayerAttackCount from './RecentGame/RecentGameCurrentPlayerAttackCount.svelte';
	import CurrentPlayerOverallStats from './RecentGame/RecentGameCurrentPlayerOverallStats.svelte';
	import Player1ActionCount from './RecentGame/RecentGamePlayer1ActionCount.svelte';
	import Player1AttackCount from './RecentGame/RecentGamePlayer1AttackCount.svelte';
	import Player1OverallStats from './RecentGame/RecentGamePlayer1OverallStats.svelte';
	import Player2ActionCount from './RecentGame/RecentGamePlayer2ActionCount.svelte';
	import Player2AttackCount from './RecentGame/RecentGamePlayer2AttackCount.svelte';
	import Player2OverallStats from './RecentGame/RecentGamePlayer2OverallStats.svelte';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
</script>

<CurrentPlayerAttackCount {dataItem} {defaultPreview} {style} />
<CurrentPlayerActionCount {dataItem} {defaultPreview} {style} />
<CurrentPlayerOverallStats {dataItem} {defaultPreview} {style} />
<Player1AttackCount {dataItem} {defaultPreview} {style} />
<Player1ActionCount {dataItem} {defaultPreview} {style} />
<Player1OverallStats {dataItem} {defaultPreview} {style} />
<Player2AttackCount {dataItem} {defaultPreview} {style} />
<Player2ActionCount {dataItem} {defaultPreview} {style} />
<Player2OverallStats {dataItem} {defaultPreview} {style} />
