<script lang="ts">
	import { overlays } from '$lib/utils/store.svelte';
	import { fade } from 'svelte/transition';
	import Board from '$lib/components/obs/overlays/Board.svelte';
	import { page } from '$app/stores';
	import type { LiveStatsScene } from '$lib/models/enum';

	export let layerIds: number[] | undefined = undefined;
	export let preview: boolean = false;
	export let overlayId: string | undefined = undefined;
	export let designWidth: number | undefined = undefined;
	export let designHeight: number | undefined = undefined;
	export let sceneOverride: LiveStatsScene | undefined = undefined;

	$: _overlayId = overlayId ?? $page.params.overlay;
	$: curOverlay = $overlays[_overlayId];

	// The live overlay page (OBS / injection) recovers from a crash by reloading; previews never
	// reload — any error would otherwise reload the whole app page.
	const handleError = (e: Event) => {
		console.error(e);
		if (!preview) setTimeout(() => location.reload(), 2000);
	};
</script>

<svelte:window on:error={handleError} />

<!-- |local: a preview card must not hold up page navigation (Svelte 3 waits for nested global outros
     and a still-delayed intro can stall them, leaving the old page stacked above the new one). -->
{#if curOverlay}
	<div
		class="fixed top-0 left-0 h-full w-full"
		style="margin: 0; padding: 0"
		in:fade|local={{ delay: 50, duration: 150 }}
		out:fade|local={{ duration: 300 }}
	>
		<Board bind:curOverlay bind:layerIds {preview} {designWidth} {designHeight} {sceneOverride} />
	</div>
{/if}
