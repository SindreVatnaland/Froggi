<script lang="ts">
	import { page } from '$app/stores';
	import { COL, ROW, MIN } from '$lib/models/const';
	import {
		currentOverlayEditor,
		electronEmitter,
		overlays,
		statsScene,
	} from '$lib/utils/store.svelte';
	import { fly } from 'svelte/transition';
	import ElementModal from '$lib/components/obs/overlays/edit/ElementModal.svelte';
	import NumberInput from '$lib/components/input/NumberInput.svelte';
	import { updateScene } from '$lib/components/obs/overlays/edit/OverlayHandler.svelte';
	import { isNil, throttle } from 'lodash';
	import { LiveStatsScene } from '$lib/models/enum';
	import { GridContentItem, Overlay } from '$lib/models/types/overlay';

	const overlayId = $page.params.overlay;
	$: overlayEditor = $currentOverlayEditor;

	let selectedItem: GridContentItem | undefined;
	let selectedItemIndex: number;

	let isElementModalOpen = false;

	$: curOverlay = $overlays[overlayId];

	function getItemById(
		overlay: Overlay,
		statsScene: LiveStatsScene,
		selectedLayerIndex: number,
		selectedItemId: string | undefined,
	) {
		if (!overlay || selectedItemId === undefined) return;

		const items = overlay[statsScene]?.layers[selectedLayerIndex]?.items;

		if (!items) return;

		selectedItemIndex = items.map((i) => i.id).indexOf(selectedItemId);

		if (isNil(selectedItemIndex)) return;

		selectedItem = items[selectedItemIndex];
	}
	$: getItemById(curOverlay, $statsScene, overlayEditor.layerIndex ?? 0, overlayEditor.itemId);

	function clearItem() {
		selectedItem = undefined;
		selectedItemIndex = 0;
		$electronEmitter.emit('CurrentOverlayEditor', {
			...$currentOverlayEditor,
			itemId: undefined,
		});
	}
	$: $statsScene, clearItem();

	function handleOverflow() {
		if (!selectedItem) return;
		if (selectedItem[COL].x < 0) selectedItem[COL].x = 0;
		if (selectedItem[COL].y < 0) selectedItem[COL].y = 0;
		if (selectedItem[COL].x >= COL) selectedItem[COL].x = COL - MIN;
		if (selectedItem[COL].y >= ROW) selectedItem[COL].y = ROW - MIN;
		if (selectedItem[COL].x + selectedItem[COL].w > COL)
			selectedItem[COL].w = COL - selectedItem[COL].x;
		if (selectedItem[COL].y + selectedItem[COL].h > ROW)
			selectedItem[COL].h = ROW - selectedItem[COL].y;
	}

	function copyElement(itemId: string | undefined) {
		if (!curOverlay || isNil($currentOverlayEditor?.layerIndex) || isNil(itemId)) return;

		$electronEmitter.emit(
			'SceneItemDuplicate',
			overlayId,
			$statsScene,
			$currentOverlayEditor.layerIndex,
			itemId,
		);
	}

	function deleteElement(
		overlay: Overlay | undefined,
		statsScene: LiveStatsScene,
		layerIndex: number | undefined,
		itemId: string | undefined,
	) {
		if (!overlay || isNil(layerIndex) || isNil(itemId)) return;

		const items = overlay[statsScene]?.layers[layerIndex].items;

		overlay[statsScene].layers[layerIndex].items = items.filter((item) => item.id != itemId);

		clearItem();

		updateScene(curOverlay, statsScene);
	}

	function updateSelectItem(
		overlay: Overlay | undefined,
		statsScene: LiveStatsScene,
		layerIndex: number | undefined,
		selectedItem: GridContentItem | undefined,
	) {
		if (isNil(overlay) || isNil(layerIndex) || isNil(selectedItem)) return;

		handleOverflow();

		overlay[statsScene].layers[layerIndex].items[selectedItemIndex] = selectedItem;

		updateScene(overlay, statsScene);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!overlayEditor.itemId || !selectedItem) return;
		if (e.shiftKey) {
			if (e.key === 'ArrowDown') {
				selectedItem[COL].h += 1;
			}
			if (e.key === 'ArrowUp') {
				selectedItem[COL].h -= 1;
			}
			if (e.key === 'ArrowLeft') {
				selectedItem[COL].w -= 1;
			}
			if (e.key === 'ArrowRight') {
				selectedItem[COL].w += 1;
			}
		} else if (e.ctrlKey || e.cmdKey) {
			if (e.key === 'c') {
				copyElement(overlayEditor.itemId);
			}
			if (e.key === 'Backspace') {
				deleteElement(
					curOverlay,
					$statsScene,
					overlayEditor.layerIndex,
					overlayEditor.itemId,
				);
			}
		} else {
			if (e.key === 'ArrowDown') {
				selectedItem[COL].y += 1;
			}
			if (e.key === 'ArrowUp') {
				selectedItem[COL].y -= 1;
			}
			if (e.key === 'ArrowLeft') {
				selectedItem[COL].x -= 1;
			}
			if (e.key === 'ArrowRight') {
				selectedItem[COL].x += 1;
			}
			if (e.key === 'Del') {
				deleteElement(
					curOverlay,
					$statsScene,
					overlayEditor.layerIndex,
					overlayEditor.itemId,
				);
			}
			if (e.key === 'Esc') {
				clearItem();
			}
		}

		updateSelectItem(curOverlay, $statsScene, overlayEditor?.layerIndex, selectedItem);
	}
</script>

<svelte:window on:keydown={throttle(handleKeydown, 50)} />

<h1
	class="text-secondary-color text-lg font-medium color-secondary"
	transition:fly={{ duration: 250, y: 50 }}
>
	Selected element
</h1>
<div class="h-16">
	{#if !isNil(selectedItem)}
		<div class="w-full flex gap-2">
			<div transition:fly={{ duration: 250, y: 30 }}>
				<NumberInput
					bind:value={selectedItem[COL].x}
					max={COL}
					label={`X - ${COL}`}
					on:change={() =>
						updateSelectItem(
							curOverlay,
							$statsScene,
							overlayEditor?.layerIndex,
							selectedItem,
						)}
				/>
			</div>
			<div transition:fly={{ duration: 250, y: 30, delay: 30 }}>
				<NumberInput
					bind:value={selectedItem[COL].y}
					max={ROW}
					label={`Y - ${ROW}`}
					on:change={() =>
						updateSelectItem(
							curOverlay,
							$statsScene,
							overlayEditor?.layerIndex,
							selectedItem,
						)}
				/>
			</div>
			<div transition:fly={{ duration: 250, y: 30, delay: 100 }}>
				<NumberInput
					bind:value={selectedItem[COL].h}
					max={ROW}
					label={`H`}
					on:change={() =>
						updateSelectItem(
							curOverlay,
							$statsScene,
							overlayEditor?.layerIndex,
							selectedItem,
						)}
				/>
			</div>
			<div transition:fly={{ duration: 250, y: 30, delay: 150 }}>
				<NumberInput
					bind:value={selectedItem[COL].w}
					max={COL}
					label={`W`}
					on:change={() =>
						updateSelectItem(
							curOverlay,
							$statsScene,
							overlayEditor?.layerIndex,
							selectedItem,
						)}
				/>
			</div>
			<div class="w-24 flex items-end" transition:fly={{ duration: 250, y: 30, delay: 200 }}>
				<button
					class="w-full transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 px-2 xl:text-xl border-secondary rounded"
					on:click={() => {
						isElementModalOpen = true;
					}}
				>
					Edit
				</button>
			</div>
			<div class="w-24 flex items-end" transition:fly={{ duration: 250, y: 30, delay: 250 }}>
				<button
					class="w-full transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 px-2 xl:text-xl border-secondary rounded"
					on:click={() => copyElement(overlayEditor.itemId)}
				>
					Copy
				</button>
			</div>
			<div class="w-24 flex items-end" transition:fly={{ duration: 250, y: 30, delay: 250 }}>
				<button
					class="w-full transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 px-2 xl:text-xl border-secondary rounded"
					on:click={() =>
						deleteElement(
							curOverlay,
							$statsScene,
							overlayEditor.layerIndex,
							overlayEditor.itemId,
						)}
				>
					Delete
				</button>
			</div>
		</div>
		{#key isElementModalOpen}
			<ElementModal bind:open={isElementModalOpen} isEdit={true} />
		{/key}
	{/if}
</div>
