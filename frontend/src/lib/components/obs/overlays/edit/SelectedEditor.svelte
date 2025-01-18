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
	import { debounce, isNil, throttle } from 'lodash';

	const overlayId = $page.params.overlay;
	export let selectedItemId: string | undefined;

	let selectedItem: any;
	let selectedItemIndex: number;

	let isElementModalOpen = false;

	$: curOverlay = $overlays[overlayId];
	$currentOverlayEditor?.layerIndex;

	function getItemById() {
		if (
			!curOverlay ||
			$currentOverlayEditor?.layerIndex === undefined ||
			selectedItemId === undefined
		)
			return;
		selectedItemIndex = curOverlay[$statsScene]?.layers[
			$currentOverlayEditor?.layerIndex
		]?.items
			.map((i) => i.id)
			.indexOf(selectedItemId);

		if (isNil(selectedItemIndex)) return;

		selectedItem =
			curOverlay[$statsScene]?.layers[$currentOverlayEditor?.layerIndex].items[
				selectedItemIndex
			];
	}
	$: selectedItemId, getItemById();

	function clearItem() {
		selectedItemId = undefined;
		selectedItem = undefined;
		selectedItemIndex = 0;
	}
	$: $currentOverlayEditor?.layerIndex, $statsScene, clearItem();

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

	function deleteElement(itemId: string | undefined) {
		if (!curOverlay || isNil($currentOverlayEditor?.layerIndex) || isNil(itemId)) return;
		curOverlay[$statsScene].layers[$currentOverlayEditor.layerIndex].items = curOverlay[
			$statsScene
		]?.layers[$currentOverlayEditor.layerIndex].items.filter((item) => item.id != itemId);

		selectedItemId = undefined;
		selectedItem = undefined;
		selectedItemIndex = 0;

		updateScene(curOverlay, $statsScene);
	}

	function updateSelectItem() {
		if (
			!curOverlay ||
			$currentOverlayEditor?.layerIndex === undefined ||
			selectedItemId === undefined
		)
			return;

		handleOverflow();

		curOverlay[$statsScene].layers[$currentOverlayEditor?.layerIndex].items[selectedItemIndex] =
			selectedItem;
		updateScene(curOverlay, $statsScene);
	}
	$: selectedItem, updateSelectItem();

	function handleKeydown(e: KeyboardEvent) {
		if (!selectedItemId || !selectedItem) return;
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
			return;
		}
		if (e.ctrlKey || e.cmdKey) {
			if (e.key === 'c') {
				copyElement(selectedItemId);
			}
			if (e.key === 'Backspace') {
				deleteElement(selectedItemId);
			}
			return;
		}
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
			deleteElement(selectedItemId);
		}
		if (e.key === 'Esc') {
			clearItem();
		}
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
				<NumberInput bind:value={selectedItem[COL].x} max={COL} label={`X - ${COL}`} />
			</div>
			<div transition:fly={{ duration: 250, y: 30, delay: 30 }}>
				<NumberInput bind:value={selectedItem[COL].y} max={ROW} label={`Y - ${ROW}`} />
			</div>
			<div transition:fly={{ duration: 250, y: 30, delay: 100 }}>
				<NumberInput bind:value={selectedItem[COL].h} max={ROW} label={`H`} />
			</div>
			<div transition:fly={{ duration: 250, y: 30, delay: 150 }}>
				<NumberInput bind:value={selectedItem[COL].w} max={COL} label={`W`} />
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
					on:click={() => copyElement(selectedItemId)}
				>
					Copy
				</button>
			</div>
			<div class="w-24 flex items-end" transition:fly={{ duration: 250, y: 30, delay: 250 }}>
				<button
					class="w-full transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 px-2 xl:text-xl border-secondary rounded"
					on:click={() => deleteElement(selectedItemId)}
				>
					Delete
				</button>
			</div>
		</div>
		{#key isElementModalOpen}
			{#key selectedItemId}
				<ElementModal bind:open={isElementModalOpen} {selectedItemId} isEdit={true} />
			{/key}
		{/key}
	{/if}
</div>
