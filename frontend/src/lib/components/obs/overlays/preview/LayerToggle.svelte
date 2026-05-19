<script lang="ts">
	import { page } from '$app/stores';
	import { currentOverlayEditor, overlays, statsScene } from '$lib/utils/store.svelte';
	import { fly } from 'svelte/transition';
	import LayerDisplayRow from '$lib/components/obs/overlays/preview/LayerDisplayRow.svelte';
	import { newLayer } from '$lib/components/obs/overlays/edit/OverlayHandler.svelte';
	import { flip } from 'svelte/animate';
	import { Layer, Overlay } from '$lib/models/types/overlay';
	import { LiveStatsScene } from '$lib/models/enum';

	const overlayId: string | undefined = $page.params.overlay;

	let selectedLayerIndex: number = $currentOverlayEditor.layerIndex ?? 0;

	$: curOverlay = $overlays[overlayId];
	$: scene = curOverlay?.[$statsScene];
	let layers: Layer[] = [];

	const updateLayers = (overlay: Overlay | undefined, statsScene: LiveStatsScene) => {
		if (!overlay) return;
		layers = overlay[statsScene]?.layers ?? [];
	};

	$: updateLayers(curOverlay, $statsScene);

	let scrollElement: HTMLElement;
	const scrollToBottom = () => {
		scrollElement.scroll({ top: scrollElement.scrollHeight, behavior: 'smooth' });
	};

	const updateSelectedLayer = () => {
		selectedLayerIndex = 0;
	};
	$: $statsScene, updateSelectedLayer();
</script>

{#if layers && curOverlay}
	<div class="h-full flex flex-col">
		<div
			class="w-full h-7 border-b-1 border-secondary-color px-2 grid grid-flow-col grid-cols-6 justify-between items-center background-primary-color bg-opacity-50"
		>
			<div class="col-span-1 grid justify-center">
				<span class="text-[10px] font-semibold text-secondary-color uppercase opacity-50">Vis</span>
			</div>
			<div class="col-span-2 grid justify-center">
				<span class="text-[10px] font-semibold text-secondary-color uppercase opacity-50">Preview</span>
			</div>
			<div class="col-span-1 grid justify-center">
				<span class="text-[10px] font-semibold text-secondary-color uppercase opacity-50">#</span>
			</div>
			<div class="col-span-1 grid justify-center">
				<span class="text-[10px] font-semibold text-secondary-color uppercase opacity-50">Move</span>
			</div>
			<div class="col-span-1 grid justify-center">
				<span class="text-[10px] font-semibold text-secondary-color uppercase opacity-50">Del</span>
			</div>
		</div>
		<div class={`w-full max-h-full overflow-auto flex-1`} bind:this={scrollElement}>
			<div class="w-full h-6 items-center overflow-hidden">
				<button
					class="w-full h-full justify-center background-primary-color bg-opacity-40 hover:bg-opacity-60"
					on:click={async () => {
						await newLayer(overlayId, $statsScene, scene.id, 0);
					}}
				>
					<h1 class="text-secondary-color text-shadow-md">+</h1>
				</button>
			</div>
			{#each layers as layer, layerIndex (layer.id)}
				<div class="w-full visible" animate:flip={{ duration: 80 }}>
					<LayerDisplayRow
						{curOverlay}
						{layer}
						{layerIndex}
						{scrollToBottom}
						bind:selectedLayerIndex
					/>
				</div>
			{/each}
		</div>
	</div>
{/if}
