<script lang="ts">
	import { electronEmitter, isElectron, statsScene } from '$lib/utils/store.svelte';
	import Grid from 'svelte-grid';
	import GridContent from './GridContent.svelte';
	import type { Layer, Overlay, Scene } from '$lib/models/types/overlay';
	import { COL, ROW, SCENE_TRANSITION_DELAY } from '$lib/models/const';
	import { LiveStatsScene } from '$lib/models/enum';
	import BoardContainer from '$lib/components/obs/overlays/BoardContainer.svelte';
	import { updateFont } from './CustomFontHandler.svelte';
	import { debounce, isNil, reverse, slice } from 'lodash';
	import { onMount } from 'svelte';

	export let curOverlay: Overlay;
	export let layerIds: number[] | undefined;
	export let preview: boolean = false;

	let ready = false;

	let curStatsScene: LiveStatsScene;
	function updateCurrentScene(
		curOverlay: Overlay,
		statsScene: LiveStatsScene,
		layerIds: number[] | undefined,
	): Scene | undefined {
		if (preview) {
			updateFixedLayerItems(curOverlay[statsScene].layers, layerIds);
			curStatsScene = statsScene;
			return;
		}
		curStatsScene = curOverlay?.[statsScene].active
			? statsScene
			: curOverlay?.[statsScene].fallback ?? LiveStatsScene.Menu;
		updateFixedLayerItems(curOverlay[curStatsScene].layers, layerIds);
	}
	$: updateCurrentScene(curOverlay, $statsScene, layerIds);

	let fixedLayers: Layer[] = [];
	function updateFixedLayerItems(layers: Layer[], includedLayerIds: number[] | undefined) {
		fixedLayers = layers
			?.filter(
				(layer) => isNil(includedLayerIds) || includedLayerIds?.includes(layer?.id ?? -1),
			)
			.map((layer) => {
				return {
					...layer,
					items: [
						...layer?.items.map((item) => {
							return {
								...item,
								[COL]: {
									...item[COL],
									customResizer: true,
									fixed: true,
									resizable: false,
								},
							};
						}),
					],
				};
			});
	}

	const initializeFonts = async () => {
		await updateFont(curOverlay);
		setTimeout(() => (ready = true));
	};

	initializeFonts();

	let innerHeight = 0;
	let innerWidth = 0;
	$: rowHeight = innerHeight / ROW;
	$: curScene = curOverlay[curStatsScene];

	const handleError = (e: ErrorEvent) => {
		console.error(e);
		$electronEmitter.emit('CleanupCustomResources');
		$electronEmitter.emit('RemoveDuplicateItems');
		setTimeout(refreshExternal, 2000);
	};

	const refreshExternal = async () => {
		// @ts-ignore
		if (!$isElectron) location.reload();
	};

	const handleResize = (e: UIEvent & { currentTarget: EventTarget & Window }) => {
		innerHeight = e.currentTarget.window.innerHeight;
		innerWidth = e.currentTarget.window.innerWidth;
	};

	onMount(() => {
		handleResize({ currentTarget: window } as any);
	});
</script>

<svelte:window on:resize={debounce(handleResize, 1000)} on:error={handleError} />

{#if curScene && rowHeight && fixedLayers.length && ready}
	<div class="w-full h-full overflow-hidden relative origin-top-left">
		{#key innerHeight * innerWidth}
			<BoardContainer
				scene={curScene}
				bind:boardHeight={innerHeight}
				bind:boardWidth={innerWidth}
			/>
			{#each fixedLayers.slice().reverse() as layer, i}
				<div class="w-full h-full z-2 absolute">
					<Grid
						items={layer.items}
						bind:rowHeight
						gap={[0, 0]}
						let:dataItem
						cols={[[COL, COL]]}
						fastStart={true}
					>
						<GridContent
							{preview}
							{dataItem}
							bind:curScene
							additionalDelay={SCENE_TRANSITION_DELAY +
								curScene.animation.layerRenderDelay * i}
						/>
					</Grid>
				</div>
			{/each}
		{/key}
		<div class="w-full h-full z-8 absolute" />
	</div>
{/if}
