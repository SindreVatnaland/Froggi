<script lang="ts">
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import Player1SlippiRank from './Slippi/Player1SlippiRank.svelte';
	import Player2SlippiRank from './Slippi/Player2SlippiRank.svelte';
	import CurrentPlayerSlippiRank from './Slippi/CurrentPlayerSlippiRank.svelte';
	import RankChange from './Slippi/RankChange.svelte';
	import { CurrentPlayer, GameStartTypeExtended, Player } from '$lib/models/types/slippiData';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
	export let currentPlayer: CurrentPlayer;
	export let currentPlayers: Player[];
	export let gameSettings: GameStartTypeExtended;
</script>

<CurrentPlayerSlippiRank {dataItem} {defaultPreview} {style} player={currentPlayer} />
<Player1SlippiRank {dataItem} {defaultPreview} {style} player={currentPlayers.at(0)} />
<Player2SlippiRank {dataItem} {defaultPreview} {style} player={currentPlayers.at(1)} />
<RankChange {dataItem} {defaultPreview} {style} {currentPlayer} {gameSettings} />
