<script lang="ts">
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import type { StatsType } from '../../../../models/types/slippiTypes';
	import PlayerActionCount from './RecentGame/RecentGameCurrentPlayerActionCount.svelte';
	import PlayerAttackCount from './RecentGame/RecentGameCurrentPlayerAttackCount.svelte';
	import PlayerOverallStats from './RecentGame/RecentGameCurrentPlayerOverallStats.svelte';
	// Player 1/2 elements have their own renderers (the Current Player ones only answer Current Player ids).
	import Player1ActionCount from './RecentGame/RecentGamePlayer1ActionCount.svelte';
	import Player1AttackCount from './RecentGame/RecentGamePlayer1AttackCount.svelte';
	import Player1OverallStats from './RecentGame/RecentGamePlayer1OverallStats.svelte';
	import Player2ActionCount from './RecentGame/RecentGamePlayer2ActionCount.svelte';
	import Player2AttackCount from './RecentGame/RecentGamePlayer2AttackCount.svelte';
	import Player2OverallStats from './RecentGame/RecentGamePlayer2OverallStats.svelte';
	import { CurrentPlayer, Player, GameStats } from '$lib/models/types/slippiData';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
	export let postGame: GameStats | undefined;
	export let currentPlayer: CurrentPlayer;
	// Element's player list (slot-aware): Player 1/2 stats follow the chosen doubles slot.
	export let currentPlayers: Player[] = [];

	$: currentPlayerIndex = currentPlayer?.playerIndex ?? 0;
</script>

<PlayerAttackCount
	{dataItem}
	{defaultPreview}
	{style}
	playerIndex={currentPlayerIndex}
	stats={postGame?.postGameStats}
/>
<PlayerActionCount
	{dataItem}
	{defaultPreview}
	{style}
	playerIndex={currentPlayerIndex}
	stats={postGame?.postGameStats}
/>
<PlayerOverallStats
	{dataItem}
	{defaultPreview}
	{style}
	playerIndex={currentPlayerIndex}
	stats={postGame?.postGameStats}
/>

<Player1AttackCount
	{dataItem}
	{defaultPreview}
	{style}
	playerIndex={currentPlayers[0]?.playerIndex ?? 0}
	stats={postGame?.postGameStats}
/>
<Player1ActionCount
	{dataItem}
	{defaultPreview}
	{style}
	playerIndex={currentPlayers[0]?.playerIndex ?? 0}
	stats={postGame?.postGameStats}
/>
<Player1OverallStats
	{dataItem}
	{defaultPreview}
	{style}
	playerIndex={currentPlayers[0]?.playerIndex ?? 0}
	stats={postGame?.postGameStats}
/>

<Player2AttackCount
	{dataItem}
	{defaultPreview}
	{style}
	playerIndex={currentPlayers[1]?.playerIndex ?? 1}
	stats={postGame?.postGameStats}
/>
<Player2ActionCount
	{dataItem}
	{defaultPreview}
	{style}
	playerIndex={currentPlayers[1]?.playerIndex ?? 1}
	stats={postGame?.postGameStats}
/>
<Player2OverallStats
	{dataItem}
	{defaultPreview}
	{style}
	playerIndex={currentPlayers[1]?.playerIndex ?? 1}
	stats={postGame?.postGameStats}
/>
