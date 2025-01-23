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
	import type { GridContentItem, Overlay, OverlayEditor } from '$lib/models/types/overlay';
	import { COL, ROW } from '$lib/models/const';
	import BoardContainer from '../BoardContainer.svelte';
	import { notifyDisabledScene } from './OverlayHandler.svelte';
	import BoardGrid from './BoardGrid.svelte';
	import { updateFont } from '../CustomFontHandler.svelte';
	import { isNil } from 'lodash';
	import { LiveStatsScene } from '$lib/models/enum';

	const overlayId = $page.params.overlay;

	export let borderHeight: number | undefined = undefined;
	export let selectedItemId: string | undefined = undefined;

	let curOverlay = $overlays[overlayId] as Overlay | undefined;
	let items: GridContentItem[] = [];
	let tempItems: GridContentItem[] | undefined = undefined;

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

	function updateScene() {
		items = removeDuplicates(items);
		items
			.map((item) => item[COL])
			.filter((item) => item.y + item.h > ROW + 1)
			.filter((item) => item.y < ROW + 1)
			.forEach((item) => {
				item.h = ROW - item.y;
			});
		tempItems = [...items];
	}

	function updateLiveScene(
		curOverlay: Overlay | undefined,
		overlayEditor: OverlayEditor,
		statsScene: LiveStatsScene,
	) {
		if (isNil(overlayEditor.layerIndex) || !curOverlay) return;
		const overlay = $overlays[overlayId];
		items = removeDuplicates(
			curOverlay[statsScene]?.layers[overlayEditor.layerIndex ?? 0]?.items ?? [],
		);
		items?.forEach((item: any) => {
			item[COL].draggable = true;
			item[COL].resizable = true;
		});
		return overlay;
	}
	$: curOverlay = updateLiveScene(curOverlay, $currentOverlayEditor, $statsScene);

	function updateOverlay(
		curOverlay: Overlay | undefined,
		items: GridContentItem[] | undefined,
		overlayEditor: OverlayEditor,
		statsScene: LiveStatsScene,
	) {
		if (!items || isNil(overlayEditor?.layerIndex) || isNil(curOverlay)) return;

		curOverlay[statsScene].layers[overlayEditor?.layerIndex].items = removeDuplicates(items);

		$electronEmitter.emit('SceneUpdate', curOverlay.id, statsScene, curOverlay[statsScene]);
		tempItems = undefined;
		floatElements();
	}

	function fixElements() {
		items.forEach((item) => {
			item[COL].fixed = true;
		});
	}

	function floatElements() {
		items.forEach((item) => {
			item[COL].fixed = false;
			item[COL].resizable = true;
			item[COL].draggable = true;
			item[COL].customDragger = false;
			item[COL].customResizer = false;
		});
	}

	$: notifyDisabledScene(curOverlay, $statsScene);

	const clearSelected = () => {
		selectedItemId = undefined;
	};

	const handleKeyPress = (
		e: KeyboardEvent,
		curOverlay: Overlay | undefined,
		items: GridContentItem[] | undefined,
		overlayEditor: OverlayEditor,
		statsScene: LiveStatsScene,
	) => {
		if (e.key === 'Del' && selectedItemId) {
			tempItems = items?.filter((item) => item.id !== selectedItemId);
		}
		if (e.key === 'Escape') {
			clearSelected();
		}
		updateOverlay(curOverlay, items, overlayEditor, statsScene);
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
	$: rowHeight =
		((borderHeight ?? 0) *
			((curOverlay?.aspectRatio.width ?? 1) / (curOverlay?.aspectRatio.width ?? 1))) /
		ROW;
</script>

<svelte:window
	bind:innerHeight
	on:mousedown={fixElements}
	on:mouseup={() => updateOverlay(curOverlay, tempItems, $currentOverlayEditor, $statsScene)}
	on:keydown={(e) => handleKeyPress(e, curOverlay, tempItems, $currentOverlayEditor, $statsScene)}
	on:error={handleError}
/>

{#if curOverlay}
	{#key $statsScene}
		{#key rowHeight}
			<div
				style={`font-family: ${curOverlay?.[$statsScene]?.font?.family};`}
				class="w-full h-full overflow-hidden relative"
			>
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
							selectedItemId = undefined;
							setTimeout(() => {
								selectedItemId = e.detail.id;
							}, 20);
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
								<GridContent edit={true} {dataItem} />
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
