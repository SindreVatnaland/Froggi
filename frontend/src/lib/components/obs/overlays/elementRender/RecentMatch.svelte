<script lang="ts">
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { CurrentPlayer, Match, MatchStats } from '$lib/models/types/slippiData';
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
	export let matchStats: MatchStats;
	export let currentPlayer: CurrentPlayer;

	$: currentPlayerIndex = currentPlayer?.playerIndex;
</script>

<CurrentPlayerAttackCount
	{dataItem}
	{defaultPreview}
	{style}
	playerIndex={currentPlayerIndex}
	stats={matchStats}
/>
<CurrentPlayerActionCount
	{dataItem}
	{defaultPreview}
	{style}
	playerIndex={currentPlayerIndex}
	stats={matchStats}
/>
<CurrentPlayerOverallStats
	{dataItem}
	{defaultPreview}
	{style}
	playerIndex={currentPlayerIndex}
	stats={matchStats}
/>

<Player1AttackCount {dataItem} {defaultPreview} {style} playerIndex={0} stats={matchStats} />
<Player1ActionCount {dataItem} {defaultPreview} {style} playerIndex={0} stats={matchStats} />
<Player1OverallStats {dataItem} {defaultPreview} {style} playerIndex={0} stats={matchStats} />

<Player2AttackCount {dataItem} {defaultPreview} {style} playerIndex={1} stats={matchStats} />
<Player2ActionCount {dataItem} {defaultPreview} {style} playerIndex={1} stats={matchStats} />
<Player2OverallStats {dataItem} {defaultPreview} {style} playerIndex={1} stats={matchStats} />
