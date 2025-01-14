<script lang="ts">
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { StatsType } from '@slippi/slippi-js';
	import PlayerActionCount from './RecentGame/RecentGameCurrentPlayerActionCount.svelte';
	import PlayerAttackCount from './RecentGame/RecentGameCurrentPlayerAttackCount.svelte';
	import PlayerOverallStats from './RecentGame/RecentGameCurrentPlayerOverallStats.svelte';
	import { CurrentPlayer, GameStats } from '$lib/models/types/slippiData';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
	export let postGame: GameStats | undefined;
	export let currentPlayer: CurrentPlayer;

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

<PlayerAttackCount
	{dataItem}
	{defaultPreview}
	{style}
	playerIndex={0}
	stats={postGame?.postGameStats}
/>
<PlayerActionCount
	{dataItem}
	{defaultPreview}
	{style}
	playerIndex={0}
	stats={postGame?.postGameStats}
/>
<PlayerOverallStats
	{dataItem}
	{defaultPreview}
	{style}
	playerIndex={0}
	stats={postGame?.postGameStats}
/>

<PlayerAttackCount
	{dataItem}
	{defaultPreview}
	{style}
	playerIndex={1}
	stats={postGame?.postGameStats}
/>
<PlayerActionCount
	{dataItem}
	{defaultPreview}
	{style}
	playerIndex={1}
	stats={postGame?.postGameStats}
/>
<PlayerOverallStats
	{dataItem}
	{defaultPreview}
	{style}
	playerIndex={1}
	stats={postGame?.postGameStats}
/>
