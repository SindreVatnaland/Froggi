<script lang="ts">
	import type { Layer, Overlay } from '$lib/models/types/overlay';
	import { currentOverlayEditor, electronEmitter, statsScene } from '$lib/utils/store.svelte';
	import { fly } from 'svelte/transition';
	import {
		deleteLayer,
		moveLayer,
		newLayer,
	} from '$lib/components/obs/overlays/edit/OverlayHandler.svelte';

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

<!-- Sized to match the editor top bar's .toolbar-btn (Configure / Export / Embed). -->
{#if selectedLayer}
	<div class="flex items-center gap-2 shrink-0">
		<span class="text-sm font-semibold text-secondary-color">Layers</span>
		<select
			class="layer-select"
			bind:value={selectedLayer}
			on:change={() => changeLayer(selectedLayer.index)}
		>
			{#each scene?.layers as layer, i}
				<option selected={i === 0} value={layer}>Layer {i + 1}</option>
			{/each}
		</select>
		<button class="layer-btn" on:click={() => newLayer(overlay.id, $statsScene, scene.id, selectedLayer.index)}>
			New layer
		</button>
		<button class="layer-btn" on:click={() => moveLayer(overlay.id, $statsScene, scene.id, selectedLayer.index, -1)}>
			Move up
		</button>
		<button class="layer-btn" on:click={() => moveLayer(overlay.id, $statsScene, scene.id, selectedLayer.index, 1)}>
			Move down
		</button>
		{#if scene?.layers?.length > 1}
			<button
				class="layer-btn"
				transition:fly={{ duration: 250, y: -25 }}
				on:click={() => deleteLayer(overlay.id, $statsScene, scene.id, selectedLayer.id)}
			>
				Delete layer
			</button>
		{/if}
	</div>
{/if}

<style>
	.layer-btn,
	.layer-select {
		height: 2rem;
		padding: 0 0.75rem;
		font-size: 0.875rem;
		font-weight: 600;
		background-color: var(--primary-color);
		color: var(--secondary-color);
		border: 1px solid var(--secondary-color);
		border-radius: 0.125rem;
		white-space: nowrap;
	}

	.layer-btn {
		transition: transform 0.1s;
	}

	.layer-btn:active {
		opacity: 0.5;
	}
</style>
