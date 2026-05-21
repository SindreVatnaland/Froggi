<script lang="ts">
	import { overlays } from '$lib/utils/store.svelte';
	import { fade } from 'svelte/transition';
	import Board from '$lib/components/obs/overlays/Board.svelte';
	import { page } from '$app/stores';

	export let layerIds: number[] | undefined = undefined;
	export let preview: boolean = false;
	export let overlayId: string | undefined = undefined;
	export let designWidth: number | undefined = undefined;
	export let designHeight: number | undefined = undefined;

	$: _overlayId = overlayId ?? $page.params.overlay;
	$: curOverlay = $overlays[_overlayId];

	const handleError = (e: Error) => {
		console.error(e);
		setTimeout(location.reload, 2000);
	};
</script>

<svelte:window on:error={handleError} />

{#if curOverlay}
	<div
		class="fixed top-0 left-0 h-full w-full"
		style="margin: 0; padding: 0"
		in:fade={{ delay: 50, duration: 150 }}
		out:fade={{ duration: 300 }}
	>
		<Board bind:curOverlay bind:layerIds {preview} {designWidth} {designHeight} />
	</div>
{/if}
