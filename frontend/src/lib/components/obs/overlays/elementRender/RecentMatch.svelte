<script lang="ts">
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { currentMatch, currentPlayer } from '$lib/utils/store.svelte';
	import CurrentPlayerActionCount from './RecentMatch/RecentMatchCurrentPlayerActionCount.svelte';
	import CurrentPlayerAttackCount from './RecentMatch/RecentMatchCurrentPlayerAttackCount.svelte';
	import CurrentPlayerOverallStats from './RecentMatch/RecentMatchCurrentPlayerOverallStats.svelte';
	import Player1ActionCount from './RecentMatch/RecentMatchPlayer1ActionCount.svelte';
	import Player1AttackCount from './RecentMatch/RecentMatchPlayer1AttackCount.svelte';
	import Player1OverallStats from './RecentMatch/RecentMatchPlayer1OverallStats.svelte';
	import Player2ActionCount from './RecentMatch/RecentMatchPlayer2ActionCount.svelte';
	import Player2AttackCount from './RecentMatch/RecentMatchPlayer2AttackCount.svelte';
	import Player2OverallStats from './RecentMatch/RecentMatchPlayer2OverallStats.svelte';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;

	$: currentPlayerIndex = $currentPlayer?.playerIndex;

	$: stats = $currentMatch?.stats;
</script>

<CurrentPlayerAttackCount
	{dataItem}
	{defaultPreview}
	{style}
	playerIndex={currentPlayerIndex}
	{stats}
/>
<CurrentPlayerActionCount
	{dataItem}
	{defaultPreview}
	{style}
	playerIndex={currentPlayerIndex}
	{stats}
/>
<CurrentPlayerOverallStats
	{dataItem}
	{defaultPreview}
	{style}
	playerIndex={currentPlayerIndex}
	{stats}
/>

<Player1AttackCount {dataItem} {defaultPreview} {style} playerIndex={0} {stats} />
<Player1ActionCount {dataItem} {defaultPreview} {style} playerIndex={0} {stats} />
<Player1OverallStats {dataItem} {defaultPreview} {style} playerIndex={0} {stats} />

<Player2AttackCount {dataItem} {defaultPreview} {style} playerIndex={1} {stats} />
<Player2ActionCount {dataItem} {defaultPreview} {style} playerIndex={1} {stats} />
<Player2OverallStats {dataItem} {defaultPreview} {style} playerIndex={1} {stats} />
