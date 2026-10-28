<script lang="ts">
	import { page } from '$app/stores';
	import {
		currentOverlayEditor,
		electronEmitter,
		overlays,
		statsScene,
		gameFrame,
		gameSettings,
	} from '$lib/utils/store.svelte';
	// @ts-ignore
	import Grid from 'svelte-grid';
	import GridContent from '$lib/components/obs/overlays/GridContent.svelte';
	import type { GridContentItem, Overlay } from '$lib/models/types/overlay';
	import { COL, ROW } from '$lib/models/const';
	import BoardContainer from '../BoardContainer.svelte';
	import BoardGrid from './BoardGrid.svelte';
	import { updateFont } from '../CustomFontHandler.svelte';
	import { isNil } from 'lodash';
	import { tick } from 'svelte';
	import { LiveStatsScene } from '$lib/models/enum';
	import GameStateRender from '$lib/components/viewer/GameStateRender.svelte';
	import { flows } from '$lib/utils/store.svelte';
	import { flowVideoKeys, sceneWarnings } from '$lib/utils/overlayWarnings';

	// Editing aid: show the live game (live camera) behind the canvas so elements can
	// be positioned against real motion. Reads the same live stores the overlay
	// elements do, so it stays in sync with whatever is playing (incl. a simulated replay).
	export let showDemo = false;

	const overlayId = $page.params.overlay;

	export let borderHeight: number | undefined = undefined;
	export let borderWidth: number | undefined = undefined;

	$: selectedLayerIndex = $currentOverlayEditor.layerIndex ?? 0;
	$: selectedItemId = $currentOverlayEditor.itemId;

	$: curOverlay = $overlays[overlayId] as Overlay | undefined;
	// Elements pointing at things that don't exist (utils/overlayWarnings.ts) get a red outline.
	$: warnings = sceneWarnings(curOverlay?.[$statsScene], flowVideoKeys($flows));
	let items: GridContentItem[] = [];
	let syncingFromServer = false;

	function removeDuplicates(items: GridContentItem[]): GridContentItem[] {
		return [
			...items.reduce((acc: GridContentItem[], item: GridContentItem) => {
				const existingItem = acc.find((existingItem) => existingItem.id === item.id);
				if (!existingItem) {
					acc.push(item);
				}
				return acc;
			}, []),
		];
	}

	function fixOutOfBounce(items: GridContentItem[]) {
		items
			.map((item) => item[COL])
			.filter((item) => item.y + item.h > ROW + 1)
			.filter((item) => item.y < ROW + 1)
			.forEach((item) => {
				item.h = ROW - item.y;
			});
	}

	// The grid fires `change` every 100 ms while dragging / resizing and once more on release (right after
	// its `pointerup`). Save only that last one, synchronously (the next update cycle can reset `items`):
	// saving mid-drag sent each step to the app, and its echo replaced the items while the pointer was
	// still moving — the box jumped between old and new sizes.
	let released = false;
	function updateScene() {
		if (syncingFromServer || !released) return;
		released = false;
		const items = updateItems();
		updateOverlay(curOverlay, items, selectedLayerIndex, $statsScene);
	}

	function updateItems() {
		items = removeDuplicates(items);
		fixOutOfBounce(items);
		return items;
	}

	function updateLiveScene(
		overlay: Overlay | undefined,
		statsScene: LiveStatsScene,
		layerIndex: number,
	) {
		if (!overlay) return [];
		const items = removeDuplicates(overlay[statsScene]?.layers[layerIndex ?? 0]?.items ?? []);
		items?.forEach((item: GridContentItem) => {
			item[COL].draggable = true;
			item[COL].resizable = true;
		});
		return items;
	}
	$: {
		syncingFromServer = true;
		// Not a dependency on `items`: re-running on every grid update reset the dragged item to the saved state.
		items = updateLiveScene(curOverlay, $statsScene, selectedLayerIndex);
		tick().then(() => (syncingFromServer = false));
	}

	function updateOverlay(
		curOverlay: Overlay | undefined,
		items: GridContentItem[] | undefined,
		layerIndex: number,
		statsScene: LiveStatsScene,
	) {
		if (isNil(items) || isNil(layerIndex) || isNil(curOverlay)) return;

		if (!curOverlay[statsScene]?.layers?.[layerIndex]) {
			return;
		}

		curOverlay[statsScene].layers[layerIndex].items = removeDuplicates(items);

		$electronEmitter.emit('SceneUpdate', curOverlay.id, statsScene, curOverlay[statsScene]);
	}

	const updateSelectedItemId = (itemId: string | undefined) => {
		console.log('updateSelectedItemId', itemId);
		$electronEmitter.emit('CurrentOverlayEditor', { ...$currentOverlayEditor, itemId: itemId });
	};

	updateFont(curOverlay);

	const handleError = (e: ErrorEvent) => {
		$electronEmitter.emit('CleanupCustomResources');
		$electronEmitter.emit('RemoveDuplicateItems');
		console.error(e);
		setTimeout(() => {
			// @ts-ignore
			location.reload();
		}, 2000);
	};

	let innerHeight: number;
	$: rowHeight = (borderHeight ?? 0) / ROW;
</script>

<svelte:window bind:innerHeight on:error={handleError} />

{#if curOverlay}
	{#key $statsScene}
		{#key rowHeight}
			{#key selectedLayerIndex}
				<div
					style={`font-family: ${curOverlay?.[$statsScene]?.font?.family};`}
					class="w-full h-full overflow-hidden relative"
				>
					{#if showDemo}
						<div class="absolute inset-0 z-0 pointer-events-none">
							<GameStateRender settings={$gameSettings} frame={$gameFrame} camera="live" fit="cover" />
						</div>
					{/if}
					<BoardGrid
						rows={curOverlay.aspectRatio.height * 2}
						cols={curOverlay.aspectRatio.width * 2}
					/>
					<BoardContainer bind:scene={curOverlay[$statsScene]} edit={true} />
					<div class="w-full h-full z-2 absolute">
						<Grid
							bind:items
							bind:rowHeight
							gap={[0, 0]}
							let:dataItem
							let:resizePointerDown
							cols={[[COL, COL]]}
							fastStart={true}
							on:change={updateScene}
							on:pointerup={(e) => {
								released = true;
								updateSelectedItemId(e.detail.id);
							}}
						>
							<div class="w-full h-full relative">
								<div
									class={`w-full h-full absolute outline outline-offset-[-1px]  ${
										warnings[dataItem?.id]
											? 'outline-2 outline-red-500'
											: selectedItemId === dataItem?.id
												? 'outline-1 outline-secondary-color'
												: 'outline-1 outline-dotted'
									}`}
									title={warnings[dataItem?.id]?.join('\n')}
								>
									<GridContent edit={true} {dataItem} designWidth={borderWidth} designHeight={borderHeight} />
								</div>
								<div
									class="bottom-0 right-0 w-[5%] h-[5%] max-w-[0.8em] max-h-[0.8em] absolute resizer overflow-hidden z-5"
									on:pointerdown={resizePointerDown}
								/>
							</div>
						</Grid>
					</div>
				</div>
			{/key}
		{/key}
	{/key}
{/if}

<style>
	.resizer {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 20px;
		height: 20px;
		cursor: se-resize;
		background: transparent;
	}

	.resizer::after {
		content: '';
		position: absolute;
		right: 4px;
		bottom: 4px;
		width: 8px;
		height: 8px;
		border-right: 2px solid var(--secondary-color);
		border-bottom: 2px solid var(--secondary-color);
	}
</style>
