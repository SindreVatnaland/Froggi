<script lang="ts">
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { GameStats, Player } from '$lib/models/types/slippiData';
	import Game1 from './RecentMatchSummary/Game1.svelte';
	import Game2 from './RecentMatchSummary/Game2.svelte';
	import Game3 from './RecentMatchSummary/Game3.svelte';
	import Game4 from './RecentMatchSummary/Game4.svelte';
	import Game5 from './RecentMatchSummary/Game5.svelte';
	import RecentGame from './RecentMatchSummary/RecentGame.svelte';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
	export let recentGames: GameStats[][];
	export let currentPlayers: Player[];
</script>

<RecentGame
	{dataItem}
	{defaultPreview}
	{style}
	game={recentGames.at(-1)?.at(-1)}
	{currentPlayers}
/>
<Game1 {dataItem} {defaultPreview} {style} {recentGames} {currentPlayers} />
<Game2 {dataItem} {defaultPreview} {style} {recentGames} {currentPlayers} />
<Game3 {dataItem} {defaultPreview} {style} {recentGames} {currentPlayers} />
<Game4 {dataItem} {defaultPreview} {style} {recentGames} {currentPlayers} />
<Game5 {dataItem} {defaultPreview} {style} {recentGames} {currentPlayers} />
