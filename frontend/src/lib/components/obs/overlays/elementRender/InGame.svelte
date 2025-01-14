<script lang="ts">
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import GameCustomHud from './InGame/GameCustomHud.svelte';
	import CurrentPlayerCustomHud from './InGame/CurrentPlayerCustomHud.svelte';
	import Player1Hud from './InGame/Player1Hud.svelte';
	import Player2Hud from './InGame/Player2Hud.svelte';
	import CurrentPlayerController from './InGame/CurrentPlayerController.svelte';
	import Player1Controller from './InGame/Player1Controller.svelte';
	import Player2Controller from './InGame/Player2Controller.svelte';
	import { currentPlayer, currentPlayers, gameFrame } from '$lib/utils/store.svelte';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;

	$: player1 = $currentPlayers.at(0);
	$: player2 = $currentPlayers.at(1);
</script>

<GameCustomHud {dataItem} {defaultPreview} {style} />
<CurrentPlayerCustomHud {dataItem} {defaultPreview} {style} player={$currentPlayer} />
<Player1Hud {dataItem} {defaultPreview} {style} player={player1} />
<Player2Hud {dataItem} {defaultPreview} {style} player={player2} />
<CurrentPlayerController
	{dataItem}
	{style}
	playerIndex={$currentPlayer?.playerIndex ?? 0}
	gameFrame={$gameFrame}
/>
<Player1Controller
	{dataItem}
	{style}
	playerIndex={player1?.playerIndex ?? 0}
	gameFrame={$gameFrame}
/>
<Player2Controller
	{dataItem}
	{style}
	playerIndex={player2?.playerIndex ?? 1}
	gameFrame={$gameFrame}
/>
