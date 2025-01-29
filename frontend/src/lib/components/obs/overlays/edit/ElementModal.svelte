<script lang="ts">
	import { page } from '$app/stores';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type {
		ElementPayload,
		GridContentItem,
		GridContentItemConfig,
		Overlay,
	} from '$lib/models/types/overlay';
	import {
		currentOverlayEditor,
		electronEmitter,
		overlays,
		statsScene,
	} from '$lib/utils/store.svelte';
	import {
		generateNewItem,
		getDefaultElementPayload,
	} from '$lib/components/obs/overlays/edit/OverlayHandler.svelte';
	import StylingSelect from '$lib/components/obs/overlays/selector/StylingSelect.svelte';
	import { fade, fly } from 'svelte/transition';
	import GridContent from '../GridContent.svelte';
	import { COL } from '$lib/models/const';
	import ElementSelectModal from '../selector/ElementSelectModal.svelte';
	import type { CustomElement } from '$lib/models/constants/customElement';
	import { fixTransition } from './fixTransition';
	import { isNil } from 'lodash';
	import { LiveStatsScene } from '$lib/models/enum';

	const overlayId = $page.params.overlay;

	export let open: boolean;
	export let isEdit: boolean = false;
	let selectedItemId: string | undefined = $currentOverlayEditor.itemId;

	let isElementSelectOpen = false;
	let selectedElementId: CustomElement;
	let payload: ElementPayload = getDefaultElementPayload();
	$: isNewElement = !getCurrentItems().some((item) => item.id === selectedItemId);

	$: demoItem = {
		[COL]: {} as GridContentItemConfig,
		elementId: selectedElementId,
		data: payload,
		id: 'demo',
	};

	const openItemSelect = () => {
		if (isEdit) return;
		isElementSelectOpen = true;
	};
	$: open, openItemSelect();

	function updateOverlay(statsScene: LiveStatsScene) {
		const currentOverlay = getCurrentOverlay();
		if (isNil(currentOverlay)) return;
		$electronEmitter.emit(
			'SceneUpdate',
			currentOverlay.id,
			statsScene,
			currentOverlay[statsScene],
		);
	}

	function getCurrentOverlay(): Overlay | undefined {
		return $overlays[overlayId];
	}

	function getCurrentItems(): GridContentItem[] {
		let curOverlay = getCurrentOverlay();
		if (isNil(curOverlay)) return [];
		return curOverlay[$statsScene]?.layers[$currentOverlayEditor?.layerIndex ?? 0]?.items ?? [];
	}

	function add(statsScene: LiveStatsScene) {
		let items = getCurrentItems();
		let newItem = generateNewItem(selectedElementId, payload, items);

		newItem = fixTransition(newItem);

		items = [...items, newItem];

		const currentOverlay = getCurrentOverlay();

		if (isNil(currentOverlay)) return;

		$overlays[currentOverlay.id][statsScene].layers[
			$currentOverlayEditor?.layerIndex ?? 0
		].items = items;

		updateOverlay(statsScene);
		open = false;
	}

	function update(statsScene: LiveStatsScene) {
		let items = getCurrentItems();
		let prevItem = items.find((item) => item.id === selectedItemId);

		if (!prevItem) {
			add(statsScene);
			return;
		}

		let newItem = {
			elementId: selectedElementId,
			id: selectedItemId,
			data: payload,
			[COL]: {
				...prevItem![COL],
			},
		} as GridContentItem;

		newItem = fixTransition(newItem);

		items = items.filter((item) => item.id != selectedItemId);
		items = [...items, newItem].reduce((acc: GridContentItem[], item: GridContentItem) => {
			const exists = acc.some((existingItem) => existingItem.id === item.id);
			if (!exists) {
				acc.push(item);
			}
			return acc;
		}, []);

		const currentOverlay = getCurrentOverlay();

		if (isNil(currentOverlay)) return;

		$overlays[currentOverlay.id][statsScene].layers[
			$currentOverlayEditor?.layerIndex ?? 0
		].items = items;

		updateOverlay(statsScene);
		open = false;
	}

	$: selectedItemId;

	function updatePayload() {
		if (!selectedItemId) return;
		let items = getCurrentItems();
		let item = items.find((item) => item.id === selectedItemId); //
		if (!item) return;
		payload = { ...payload, ...item.data };
		selectedElementId = item.elementId;
	}
	updatePayload();
</script>

<Modal bind:open class="rounded-lg" on:close={() => (open = false)}>
	<div
		class="w-[90vw] h-[90vh] min-w-lg place-items-start bg-cover bg-center rounded-md border-secondary background-primary-color"
	>
		<div class="w-full h-full p-4 px-8 grid grid-cols-7">
			<div
				class="w-full h-full col-span-4 overflow-y-auto scroll enable-autobar p-2 flex flex-col gap-4"
			>
				<div class="flex flex-col gap-2 items-center">
					<button
						class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap w-full h-10 px-2 xl:text-xl border-secondary"
						on:click={() => (isElementSelectOpen = true)}
					>
						Select
					</button>
				</div>
				<div class="w-full flex-1 overflow-auto border-b border-t border-secondary-color">
					{#if !isNil(selectedElementId)}
						<StylingSelect bind:selectedElementId bind:payload bind:selectedItemId />
					{/if}
				</div>
				<button
					transition:fly={{ duration: 250, x: 150 }}
					class="transition w-24 background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 px-2 xl:text-xl border-secondary"
					on:click={() => update($statsScene)}
				>
					{isNewElement ? 'Add' : 'Update'}
				</button>
			</div>
			<div class="w-full h-full col-span-3 grid justify-center content-center gap-12">
				{#each [...Array(2).keys()] as i}
					<div
						class="w-[30vw] max-w-full max-h-[30vh] aspect-video border-secondary bg-cover bg-center border z-0 flex items-center justify-center relative"
						in:fade={{ delay: 50, duration: 150 }}
						out:fade={{ duration: 300 }}
					>
						<div
							class={`w-full h-[50%] ${i ? 'bg-black' : 'bg-white'} 'absolute'`}
							style={`font-family: ${
								getCurrentOverlay()?.[$statsScene]?.font?.family
							}`}
						>
							<GridContent bind:demoItem preview={true} />
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
	<ElementSelectModal bind:selectedElementId bind:open={isElementSelectOpen} />
</Modal>
