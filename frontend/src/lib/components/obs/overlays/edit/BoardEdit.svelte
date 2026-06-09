<script lang="ts">
	import { page } from '$app/stores';
	import {
		currentOverlayEditor,
		electronEmitter,
		overlays,
		statsScene,
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
	import ReplayDemo from '$lib/components/viewer/ReplayDemo.svelte';

	// Editing aid: play the demo game behind the canvas so elements can be
	// positioned against live motion. Local-only, never saved to the overlay.
	let showDemoBackdrop = false;

	const overlayId = $page.params.overlay;

	export let borderHeight: number | undefined = undefined;
	export let borderWidth: number | undefined = undefined;

	$: selectedLayerIndex = $currentOverlayEditor.layerIndex ?? 0;
	$: selectedItemId = $currentOverlayEditor.itemId;

	$: curOverlay = $overlays[overlayId] as Overlay | undefined;
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

	function updateScene() {
		if (syncingFromServer) return;
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
		items: GridContentItem[],
	) {
		if (!overlay) return [];
		items = removeDuplicates(overlay[statsScene]?.layers[layerIndex ?? 0]?.items ?? []);
		items?.forEach((item: GridContentItem) => {
			item[COL].draggable = true;
			item[COL].resizable = true;
		});
		return items;
	}
	$: {
		syncingFromServer = true;
		items = updateLiveScene(curOverlay, $statsScene, selectedLayerIndex, items);
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
					{#if showDemoBackdrop}
						<div class="absolute inset-0 z-0 pointer-events-none opacity-80">
							<ReplayDemo />
						</div>
					{/if}
					<button
						class="demo-toggle"
						class:demo-toggle--on={showDemoBackdrop}
						title="Play a demo game behind the canvas (editing aid only)"
						on:click={() => (showDemoBackdrop = !showDemoBackdrop)}
					>
						{showDemoBackdrop ? '◼ Demo' : '▶ Demo'}
					</button>
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
								updateSelectedItemId(e.detail.id);
							}}
						>
							<div class="w-full h-full relative">
								<div
									class={`w-full h-full absolute outline outline-1 outline-offset-[-1px]  ${
										selectedItemId === dataItem?.id
											? 'outline-secondary-color'
											: 'outline-dotted'
									}`}
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
	.demo-toggle {
		position: absolute;
		top: 0.4rem;
		right: 0.4rem;
		z-index: 10;
		font-size: 0.7rem;
		padding: 0.2rem 0.55rem;
		border-radius: 0.25rem;
		border: 1px solid var(--secondary-color);
		background: rgba(0, 0, 0, 0.45);
		color: var(--secondary-color);
		opacity: 0.5;
		cursor: pointer;
		transition: opacity 0.12s;
	}
	.demo-toggle:hover { opacity: 1; }
	.demo-toggle--on { opacity: 1; background: color-mix(in srgb, var(--secondary-color) 18%, rgba(0, 0, 0, 0.45)); }

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
