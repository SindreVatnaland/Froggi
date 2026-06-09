<script lang="ts">
	/**
	 * Animated Player Radar element — a static-camera stage view with live
	 * character renders + projectiles (SlippiLab-style), in place of the dot radar.
	 * Driven by the live frame/settings; the editor preview plays the demo clip.
	 */
	import type { FrameEntryType } from '@slippi/slippi-js';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import type { GameStartTypeExtended } from '$lib/models/types/slippiData';
	import GameStateRender from '$lib/components/viewer/GameStateRender.svelte';
	import ReplayDemo from '$lib/components/viewer/ReplayDemo.svelte';

	export let dataItem: GridContentItem;
	export let defaultPreview = false;
	export let style: GridContentItemStyle;
	export let settings: GameStartTypeExtended | null | undefined;
	export let frame: FrameEntryType | null | undefined;

	$: hasGame = settings?.stageId != null && !!frame?.players;
</script>

<div
	class="radar-anim {style.classValue}"
	style={`${style.cssValue}; ${dataItem?.data.advancedStyling ? dataItem?.data.css.customBox : ''}`}
>
	{#if defaultPreview}
		<ReplayDemo />
	{:else if hasGame}
		<GameStateRender {settings} {frame} />
	{/if}
</div>

<style>
	.radar-anim {
		width: 100%;
		height: 100%;
	}
</style>
