<script lang="ts">
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import {
		currentOverlayEditor,
		electronEmitter,
		isElectron,
		overlays,
		statsScene,
	} from '$lib/utils/store.svelte';
	import BoardEdit from '$lib/components/obs/overlays/edit/BoardEdit.svelte';
	import { getOverlayById } from '$lib/components/obs/overlays/edit/OverlayHandler.svelte';
	import Preview from './Preview.svelte';
	import ElementModal from '$lib/components/obs/overlays/edit/ElementModal.svelte';
	import SelectedEditor from './SelectedEditor.svelte';
	import type { Layer, Overlay, OverlayEditor } from '$lib/models/types/overlay';
	import LayerEdit from '$lib/components/obs/overlays/edit/LayerEdit.svelte';
	import SceneSelect from '../selector/SceneSelect.svelte';
	import SceneEditModal from './SceneEditModal.svelte';
	import LayerToggle from '../preview/LayerToggle.svelte';
	import PreviewModal from './PreviewModal.svelte';
	import EmbedModal from './EmbedModal.svelte';
	import { newId } from '$lib/utils/helper';
	import { isNil } from 'lodash';
	import { LiveStatsScene } from '$lib/models/enum';
	import { onMount } from 'svelte';
	import ExternalPreviewSettings from '../preview/ExternalPreviewSettings.svelte';

	const overlayId = $page.params.overlay;

	$: selectedLayerIndex = $currentOverlayEditor?.layerIndex ?? 0;
	let selectedLayer: Layer | undefined = undefined;
	let selectedItemId: string | undefined = undefined;
	let overlay: Overlay | undefined;

	let isElementModalOpen = false;
	let isSceneModalOpen = false;
	let isPreviewModalOpen = false;
	let isEmbedModalOpen = false;

	function resetSelectedItem(selectedLayerIndex: number, overlayEditor: OverlayEditor) {
		if (selectedLayerIndex === $currentOverlayEditor.layerIndex) return;
		$electronEmitter.emit('CurrentOverlayEditor', {
			...$currentOverlayEditor,
			itemId: undefined,
		});
	}
	$: resetSelectedItem(selectedLayerIndex, $currentOverlayEditor);

	async function refreshOverlay() {
		overlay = await getOverlayById(overlayId);
	}
	$: $overlays, refreshOverlay();

	function downloadOverlay() {
		$electronEmitter.emit('OverlayDownload', overlayId);
	}

	function updateSelectedLayer(
		overlay: Overlay | undefined,
		statsScene: LiveStatsScene,
		layerIndex: number,
	) {
		if (isNil(overlay)) return;
		selectedLayer = overlay[statsScene].layers[layerIndex];
	}

	$: updateSelectedLayer(overlay, $statsScene, selectedLayerIndex);

	onMount(() => {
		if ($isElectron) {
			$electronEmitter.emit('CurrentOverlayEditor', {
				...$currentOverlayEditor,
				layerIndex: 0,
			});
		}
	});

	let tempBackgroundImage: string = '';

	let innerWidth: number;
	let innerHeight: number;
	$: displayPreview = innerWidth > 1024;

	$: isVertical = (overlay?.aspectRatio?.height ?? 0) > (overlay?.aspectRatio?.width ?? 0);
	$: horizontalWidth = Math.floor(innerWidth - (displayPreview ? 580 : 144));
	$: horizontalHeight = Math.floor((horizontalWidth / 16) * 9);

	$: verticalHeight = innerHeight - (displayPreview ? 320 : 400);
	$: verticalWidth =
		(verticalHeight * (overlay?.aspectRatio?.width ?? 0)) / (overlay?.aspectRatio?.height ?? 0);

	$: boardWidth = isVertical ? verticalWidth : horizontalWidth;
	$: boardHeight = isVertical ? verticalHeight : horizontalHeight;

	$: previewWidth = isVertical ? 300 : 500;
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<main
	class="fixed w-screen h-screen background-color-primary color-secondary"
	in:fade={{ delay: 50, duration: 150 }}
>
	{#if overlay && boardHeight && boardWidth}
		<div class={`w-full h-full justify-center flex gap-4`}>
			{#if displayPreview}
				<div class="h-full flex flex-col justify-start items-center gap-4">
					<div
						class="w-full bg-cover flex relative"
						style={`
		width: 100%; 
		max-width: ${previewWidth}px; 
		aspect-ratio: ${overlay.aspectRatio.width} / ${overlay.aspectRatio.height};
		background-image: url('${tempBackgroundImage}');
	`}
					>
						<Preview />
						<button
							class="absolute bottom-2 right-2 z-50 w-4 h-4"
							on:click={() => (isPreviewModalOpen = true)}
						>
							<img
								src="/image/button-icons/popup.png"
								alt="popup"
								style="filter: brightness(0) invert(1);"
							/>
						</button>
					</div>
					<div
						class="w-full border-secondary background-color-primary bg-opacity-20 flex-1 overflow-hidden"
					>
						<LayerToggle />
					</div>
				</div>
			{/if}

			<div
				class={`max-w-full flex-1 flex flex-col gap-2 justify-start items-center py-2 overflow-auto`}
			>
				<div class="flex flex-col items-center">
					<h1 class="text-lg font-medium color-secondary">
						Overlay - {overlay.title}
					</h1>
					<div class="flex gap-2 justify-center items-center">
						<button
							class="transition background-color-primary bg-opacity-30 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 p-2 xl:text-xl border-secondary rounded"
							on:click={() => {
								isSceneModalOpen = true;
							}}
						>
							Configure
						</button>
						<button
							class="transition background-color-primary bg-opacity-30 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 p-2 xl:text-xl border-secondary rounded"
							on:click={downloadOverlay}
						>
							Share
						</button>

						<button
							class="transition background-color-primary bg-opacity-30 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 p-2 xl:text-xl border-secondary rounded"
							on:click={() => (isEmbedModalOpen = true)}
						>
							Embed
						</button>
					</div>
					{#if !displayPreview && selectedLayer}
						<LayerEdit {overlay} bind:selectedLayer />
					{/if}
					<SelectedEditor />
				</div>
				<div
					style={`min-width: ${
						isVertical ? verticalWidth : boardWidth
					}px; min-height: ${boardHeight}px; background-image: url('${tempBackgroundImage}');
					`}
					class={`border-secondary flex bg-cover`}
				>
					<BoardEdit bind:borderHeight={boardHeight} />
				</div>
				<button
					class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 px-2 xl:text-xl border-secondary"
					on:click={() => {
						selectedItemId = newId();
						isElementModalOpen = true;
					}}
				>
					Add new element
				</button>
				<div class="flex gap-4 w-full justify-between">
					<SceneSelect />
					<ExternalPreviewSettings bind:base64={tempBackgroundImage} />
				</div>
			</div>
		</div>
		<SceneEditModal bind:open={isSceneModalOpen} {overlay} />
	{/if}
	<ElementModal bind:open={isElementModalOpen} />
	<PreviewModal bind:open={isPreviewModalOpen} />
	<EmbedModal bind:open={isEmbedModalOpen} />
</main>
