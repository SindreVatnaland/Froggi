<script lang="ts">
	/**
	 * Live Camera element — the /live game view as an overlay element: the game rendered from the
	 * live frames with a camera that follows and zooms on the players. Empty when no game is
	 * running (no waiting screen); the editor preview plays the demo clip.
	 */
	import type { FrameEntryType } from '@slippi/slippi-js';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import type { GameStartTypeExtended } from '$lib/models/types/slippiData';
	import { InGameState } from '$lib/models/enum';
	import { gameState } from '$lib/utils/store.svelte';
	import GameStateRender from '$lib/components/viewer/GameStateRender.svelte';
	import ReplayDemo from '$lib/components/viewer/ReplayDemo.svelte';

	export let dataItem: GridContentItem;
	export let defaultPreview = false;
	export let style: GridContentItemStyle;
	export let settings: GameStartTypeExtended | null | undefined;
	export let frame: FrameEntryType | null | undefined;

	$: live = $gameState === InGameState.Running || $gameState === InGameState.Paused;
	$: hasGame = live && settings?.stageId != null && !!frame?.players;
</script>

<div
	class="live-camera {style.classValue}"
	style={`${style.cssValue}; ${dataItem?.data.advancedStyling ? dataItem?.data.css.customBox : ''}`}
>
	{#if defaultPreview}
		<ReplayDemo />
	{:else if hasGame}
		<GameStateRender {settings} {frame} camera="live" fit="cover" />
	{/if}
</div>

<style>
	.live-camera {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
</style>
