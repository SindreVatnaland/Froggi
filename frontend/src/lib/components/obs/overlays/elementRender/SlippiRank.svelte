<script lang="ts">
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import Player1SlippiRank from './Slippi/Player1SlippiRank.svelte';
	import Player2SlippiRank from './Slippi/Player2SlippiRank.svelte';
	import CurrentPlayerSlippiRank from './Slippi/CurrentPlayerSlippiRank.svelte';
	import RankChange from './Slippi/RankChange.svelte';
	import { CurrentPlayer, Player } from '$lib/models/types/slippiData';
	import CurrentPlayerPredictedSlippiRank from './Slippi/CurrentPlayerPredictedSlippiRank.svelte';
	import Player1PredictedSlippiRank from './Slippi/Player1PredictedSlippiRank.svelte';
	import Player2PredictedSlippiRank from './Slippi/Player2PredictedSlippiRank.svelte';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
	export let currentPlayer: CurrentPlayer;
	export let currentPlayers: Player[];
</script>

<CurrentPlayerSlippiRank {dataItem} {defaultPreview} {style} player={currentPlayer} />
<CurrentPlayerPredictedSlippiRank {dataItem} {defaultPreview} {style} player={currentPlayer} />
<Player1SlippiRank {dataItem} {defaultPreview} {style} player={currentPlayers.at(0)} />
<Player1PredictedSlippiRank {dataItem} {defaultPreview} {style} player={currentPlayers[0]} />
<Player2SlippiRank {dataItem} {defaultPreview} {style} player={currentPlayers.at(1)} />
<Player2PredictedSlippiRank {dataItem} {defaultPreview} {style} player={currentPlayers[1]} />

<RankChange {dataItem} {defaultPreview} {style} {currentPlayer} />
