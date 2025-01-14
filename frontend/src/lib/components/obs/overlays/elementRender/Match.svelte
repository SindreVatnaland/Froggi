<script lang="ts">
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { GameStartTypeExtended, Player } from '$lib/models/types/slippiData';
	import CurrentMatch from './Match/CurrentMatch.svelte';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
	export let currentPlayers: Player[];
	export let gameScore: number[];
	export let gameSettings: GameStartTypeExtended;
</script>

<CurrentMatch {dataItem} {defaultPreview} {style} {currentPlayers} {gameSettings} {gameScore} />
