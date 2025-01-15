<script lang="ts">
	import { page } from '$app/stores';
	import { localEmitter, overlays, statsScene } from '$lib/utils/store.svelte';
	import { fly } from 'svelte/transition';
	import LayerDisplayRow from '$lib/components/obs/overlays/preview/LayerDisplayRow.svelte';
	import { newLayer } from '$lib/components/obs/overlays/edit/OverlayHandler.svelte';
	import { flip } from 'svelte/animate';
	import { onMount } from 'svelte';
	import { Layer, Overlay } from '$lib/models/types/overlay';
	import { LiveStatsScene } from '$lib/models/enum';

	const overlayId: string | undefined = $page.params.overlay;

	let selectedLayerIndex: number = 0;

	$: curOverlay = $overlays[overlayId];
	let layers: Layer[] = [];

	onMount(() => {
		updateLayers(curOverlay, $statsScene);
		$localEmitter.on('LayerPreviewChange', handleLayerPreviewChange);

		return () => {
			$localEmitter.off('LayerPreviewChange', handleLayerPreviewChange);
		};
	});

	const handleLayerPreviewChange = (layerIndex: number) => {
		selectedLayerIndex = layerIndex;
	};

	const updateLayers = (overlay: Overlay, statsScene: LiveStatsScene) => {
		layers = overlay[statsScene].layers;
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
			class="w-full h-12 border-b-1 border-secondary-color gap-2 p-2 grid grid-flow-col grid-cols-6 justify-between background-color-primary bg-opacity-50"
		>
			<div
				class="col-span-1 grid justify-center"
				in:fly|local={{ duration: 750, x: 150, delay: 100 }}
			>
				<h1 class="text-lg font-bold text-secondary-color text-shadow-md no-w">Visible</h1>
			</div>

			<div
				class="col-span-2 grid justify-center"
				in:fly|local={{ duration: 750, x: 150, delay: 100 }}
			>
				<h1 class="text-lg font-bold text-secondary-color text-shadow-md no-w">Preview</h1>
			</div>
			<div
				class="col-span-1 grid justify-center"
				in:fly|local={{ duration: 750, x: 150, delay: 100 }}
			>
				<h1 class="text-lg font-bold text-secondary-color text-shadow-md no-w">Layer</h1>
			</div>
			<div
				class="col-span-1 grid justify-center"
				in:fly|local={{ duration: 750, x: 150, delay: 100 }}
			>
				<h1 class="text-lg font-bold text-secondary-color text-shadow-md no-w">Move</h1>
			</div>
			<div
				class="col-span-1 grid justify-center"
				in:fly|local={{ duration: 750, x: 150, delay: 100 }}
			>
				<h1 class="text-lg font-bold text-secondary-color text-shadow-md no-w">Del</h1>
			</div>
		</div>
		<div class={`w-full max-h-full overflow-auto flex-1`} bind:this={scrollElement}>
			<div class="w-full h-6 items-center overflow-hidden">
				<button
					class="w-full h-full justify-center background-color-primary bg-opacity-40 hover:bg-opacity-60"
					on:click={async () => {
						await newLayer(overlayId, $statsScene, 0);
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
