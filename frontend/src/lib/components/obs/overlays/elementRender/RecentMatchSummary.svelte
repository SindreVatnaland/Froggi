<script lang="ts">
	import { LiveStatsScene } from '$lib/models/enum';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { currentPlayers, recentGames, statsScene } from '$lib/utils/store.svelte';
	import Game1 from './RecentMatchSummary/Game1.svelte';
	import Game2 from './RecentMatchSummary/Game2.svelte';
	import Game3 from './RecentMatchSummary/Game3.svelte';
	import Game4 from './RecentMatchSummary/Game4.svelte';
	import Game5 from './RecentMatchSummary/Game5.svelte';
	import RecentGame from './RecentMatchSummary/RecentGame.svelte';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
</script>

<RecentGame {dataItem} {defaultPreview} {style} game={$recentGames.at(-1)?.at(-1)} />
<Game1
	{dataItem}
	{defaultPreview}
	{style}
	recentGames={$recentGames}
	currentPlayers={$currentPlayers}
/>
<Game2
	{dataItem}
	{defaultPreview}
	{style}
	recentGames={$recentGames}
	currentPlayers={$currentPlayers}
/>
<Game3
	{dataItem}
	{defaultPreview}
	{style}
	recentGames={$recentGames}
	currentPlayers={$currentPlayers}
/>
<Game4
	{dataItem}
	{defaultPreview}
	{style}
	recentGames={$recentGames}
	currentPlayers={$currentPlayers}
/>
<Game5
	{dataItem}
	{defaultPreview}
	{style}
	recentGames={$recentGames}
	currentPlayers={$currentPlayers}
/>
