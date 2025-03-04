<script lang="ts">
	import type { Layer, Overlay } from '$lib/models/types/overlay';
	import Select from '$lib/components/input/Select.svelte';
	import { currentOverlayEditor, electronEmitter, statsScene } from '$lib/utils/store.svelte';
	import { fly } from 'svelte/transition';
	import {
		deleteLayer,
		moveLayer,
		newLayer,
	} from '$lib/components/obs/overlays/edit/OverlayHandler.svelte';
	import TextFitMulti from '$lib/components/TextFitMulti.svelte';

	export let overlay: Overlay;
	export let selectedLayer: Layer;

	$: scene = overlay[$statsScene];

	const changeLayer = (layerIndex: number) => {
		$electronEmitter.emit('CurrentOverlayEditor', {
			...$currentOverlayEditor,
			layerIndex: layerIndex,
		});
	};
</script>

{#if selectedLayer}
	<h1 class="color-secondary text-lg font-medium">Layers</h1>
	<div class="w-full flex gap-2">
		<div class="w-24">
			<Select
				bind:selected={selectedLayer}
				on:change={() => changeLayer(selectedLayer.index)}
			>
				{#each scene?.layers as layer, i}
					<option selected={i === 0} value={layer}>Layer {i + 1}</option>
				{/each}
			</Select>
		</div>
		<div>
			<button
				class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 lg:w-22 xl:w-auto px-2 xl:text-xl border border-white rounded"
				on:click={() => newLayer(overlay.id, $statsScene, scene.id, selectedLayer.index)}
			>
				<TextFitMulti>New layer</TextFitMulti>
			</button>
		</div>
		<div>
			<button
				class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 lg:w-22 xl:w-auto px-2 xl:text-xl border border-white rounded"
				on:click={() =>
					moveLayer(overlay.id, $statsScene, scene.id, selectedLayer.index, -1)}
			>
				<TextFitMulti>Move up</TextFitMulti>
			</button>
		</div>
		<div>
			<button
				class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 lg:w-22 xl:w-auto px-2 xl:text-xl border border-white rounded"
				on:click={() =>
					moveLayer(overlay.id, $statsScene, scene.id, selectedLayer.index, 1)}
			>
				<TextFitMulti>Move down</TextFitMulti>
			</button>
		</div>
		{#if scene?.layers?.length > 1}
			<div transition:fly={{ duration: 250, y: -25 }}>
				<button
					class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 lg:w-22 xl:w-auto px-2 xl:text-xl border border-white rounded"
					on:click={() =>
						deleteLayer(overlay.id, $statsScene, scene.id, selectedLayer.id)}
				>
					<TextFitMulti>Delete layer</TextFitMulti>
				</button>
			</div>
		{/if}
	</div>
{/if}
