<script lang="ts">
	import { overlays } from '$lib/utils/store.svelte';
	import SecondaryOverlay from '$lib/components/obs/overlays/SecondaryOverlay.svelte';

	export let overlayId: string;

	let containerWidth = 0;

	$: overlay = $overlays[overlayId];
	$: arW = overlay?.aspectRatio?.width ?? 16;
	$: arH = overlay?.aspectRatio?.height ?? 9;

	$: designWidth = arW >= arH ? 1920 : Math.round(1920 * arW / arH);
	$: designHeight = arW >= arH ? Math.round(1920 * arH / arW) : 1920;

	$: scale = containerWidth ? containerWidth / designWidth : 0;
</script>

<div
	class="relative overflow-hidden w-full"
	style="aspect-ratio: {arW} / {arH};"
	bind:clientWidth={containerWidth}
>
	{#if scale && overlay}
		<div
			class="absolute top-0 left-0 pointer-events-none select-none"
			style="width: {designWidth}px; height: {designHeight}px; transform: scale({scale}); transform-origin: top left;"
		>
			<SecondaryOverlay {overlayId} {designWidth} {designHeight} preview={true} />
		</div>
	{/if}
</div>
