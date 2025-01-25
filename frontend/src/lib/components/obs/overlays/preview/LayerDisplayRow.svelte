<script lang="ts">
	import type { Layer, Overlay } from '$lib/models/types/overlay';
	import { fly } from 'svelte/transition';
	import { currentOverlayEditor, electronEmitter, statsScene } from '$lib/utils/store.svelte';
	import {
		deleteLayer,
		duplicateLayer,
		moveLayer,
		newLayer,
		updateScene,
	} from '$lib/components/obs/overlays/edit/OverlayHandler.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import RightClick from '$lib/components/context/RightClick.svelte';
	import LayerPreview from './LayerPreview.svelte';

	export let curOverlay: Overlay;
	export let layerIndex: number;
	export let selectedLayerIndex: number = 0;
	export let scrollToBottom: Function;
	export let layer: Layer;

	$: isSelected = selectedLayerIndex === layerIndex;
	let isLastRow = curOverlay[$statsScene]?.layers.length === layerIndex + 1;

	$: scene = curOverlay[$statsScene];

	let deleteLayerModalOpen = false;

	const changeEditLayer = (layerIndex: number) => {
		$electronEmitter.emit('CurrentOverlayEditor', {
			...$currentOverlayEditor,
			layerIndex: layerIndex,
		});
		selectedLayerIndex = layerIndex;
	};

	const handleChecked = () => {
		if (!curOverlay) return;
		curOverlay[$statsScene].layers[layerIndex].preview =
			!curOverlay[$statsScene].layers[layerIndex].preview;
		updateScene(curOverlay, $statsScene);
	};
</script>

{#if layer}
	<RightClick
		menuItems={[
			{
				onClick: async () => {
					moveLayer(curOverlay.id, $statsScene, scene.id, layerIndex, -1);
				},
				displayText: 'Move Up',
			},
			{
				onClick: async () => {
					moveLayer(curOverlay.id, $statsScene, scene.id, layerIndex, 1);
				},
				displayText: 'Move Down',
			},
			{
				onClick: async () => {
					duplicateLayer(curOverlay.id, $statsScene, layerIndex);
				},
				displayText: 'Duplicate',
			},
			{
				onClick: () => {
					deleteLayerModalOpen = true;
				},
				displayText: 'Delete',
			},
		]}
	>
		<div
			class={`w-full border-b-1 border-t-1 border-secondary-color gap-2 p-2 grid grid-flow-col grid-cols-6 justify-between items-center background-color-primary bg-opacity-30 hover:bg-opacity-60`}
			style={`${isSelected && 'background-color: rgba(255, 255, 255, 0.10);'}`}
		>
			<div class="col-span-1 grid justify-center">
				{#key layer}
					<input
						type="checkbox"
						class="w-12 h-12"
						checked={layer.preview}
						on:change={handleChecked}
					/>
				{/key}
			</div>

			<div
				class="col-span-2 grid justify-center"
				in:fly={{ duration: 750, delay: 100 * (layerIndex + 1), x: 75 }}
			>
				<button
					class="w-full h-full transition"
					on:click={() => changeEditLayer(layerIndex)}
				>
					<div class="h-16 aspect-video rounded-sm border-secondary">
						<LayerPreview bind:layerId={layer.id} bind:overlayId={curOverlay.id} />
					</div>
				</button>
			</div>
			<button
				class="w-full h-full col-span-1 grid justify-center text-lg font-bold text-secondary-color transition"
				on:click={() => changeEditLayer(layer.index)}
			>
				<div class="w-full h-full grid justify-center items-center text-[1.5em]">
					{layer.index + 1}
				</div>
			</button>
			<div
				class="w-full h-full col-span-1 grid justify-center text-lg font-bold text-secondary-color"
			>
				<button
					class="w-8 h-12 grid justify-center text-lg font-bold text-secondary-color hover:scale-[1.05]"
					on:click={() => {
						moveLayer(curOverlay.id, $statsScene, scene.id, layerIndex, -1);
					}}
				>
					<img src="/image/button-icons/up.png" alt="up" style="filter: invert(1)" />
				</button>
				<button
					class="w-8 h-12 grid justify-center text-lg font-bold text-secondary-color hover:scale-[1.05]"
					on:click={async () => {
						moveLayer(curOverlay.id, $statsScene, scene.id, layerIndex, 1);
					}}
				>
					<div class="w-full h-full grid justify-center items-center text-[0.5em]">
						<img
							src="/image/button-icons/down.png"
							alt="down"
							style="filter: invert(1)"
						/>
					</div>
				</button>
			</div>
			<div
				class="w-full h-full col-span-1 grid justify-center items-center text-lg font-bold text-secondary-color"
			>
				<button
					class="w-6 h-10 grid justify-center items-center text-lg font-bold text-secondary-color hover:scale-[1.05]"
					on:click={async () => (deleteLayerModalOpen = true)}
				>
					<img
						src="/image/button-icons/remove.png"
						alt="remove"
						style="filter: invert(0.5)"
					/>
				</button>
			</div>
		</div>
		<div class="w-full items-center overflow-hidden">
			<button
				class="w-full h-full justify-center background-color-primary bg-opacity-40 hover:bg-opacity-60"
				on:click={async () => {
					if (isLastRow) setTimeout(() => scrollToBottom(), 50);
					await newLayer(curOverlay.id, $statsScene, scene.id, layerIndex + 1);
				}}
			>
				<h1 class="text-secondary-color">+</h1>
			</button>
		</div>
		<ConfirmModal
			bind:open={deleteLayerModalOpen}
			on:confirm={() => deleteLayer(curOverlay.id, $statsScene, scene.id, layer.id)}
		>
			Delete layer?
		</ConfirmModal>
	</RightClick>
{/if}
