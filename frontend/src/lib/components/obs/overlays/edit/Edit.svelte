<script lang="ts">
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import {
		currentOverlayEditor,
		electronEmitter,
		isElectron,
		isOverlayPage,
		overlays,
		statsScene,
		gameFrame,
		gameSettings,
	} from '$lib/utils/store.svelte';
	import BoardEdit from '$lib/components/obs/overlays/edit/BoardEdit.svelte';
	import {
		getOverlayById,
		notifyDisabledScene,
	} from '$lib/components/obs/overlays/edit/OverlayHandler.svelte';
	import Preview from './Preview.svelte';
	import GameStateRender from '$lib/components/viewer/GameStateRender.svelte';
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
	import { onMount, onDestroy } from 'svelte';
	import ExternalPreviewSettings from '../preview/ExternalPreviewSettings.svelte';
	import { goto } from '$app/navigation';
	import { House } from 'lucide-svelte';

	const overlayId = $page.params.overlay;

	$: notifyDisabledScene(overlayId, $statsScene);

	$: selectedLayerIndex = $currentOverlayEditor?.layerIndex ?? 0;
	let selectedLayer: Layer | undefined = undefined;
	let selectedItemId: string | undefined = undefined;
	let overlay: Overlay | undefined;

	let isElementModalOpen = false;
	let isSceneModalOpen = false;
	let isPreviewModalOpen = false;
	let isEmbedModalOpen = false;

	function resetSelectedItem(selectedLayerIndex: number, overlayEditor: OverlayEditor) {
		if (selectedLayerIndex === overlayEditor.layerIndex) return;
		$electronEmitter.emit('CurrentOverlayEditor', {
			...overlayEditor,
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

	// Replay test mode: simulate the most recent replay (drives live data so the
	// elements + preview update in realtime) and show that game as a live-camera
	// backdrop behind the canvas + preview. One toggle for the whole testing flow.
	let showDemo = false;
	function toggleReplay() {
		showDemo = !showDemo;
		$electronEmitter.emit(showDemo ? 'SimulateGameStart' : 'SimulateGameEnd');
	}
	// Stop the simulation when leaving the editor so it doesn't keep running globally.
	onDestroy(() => {
		if (showDemo) $electronEmitter.emit('SimulateGameEnd');
	});

	let innerWidth: number;
	let innerHeight: number;
	$: displayPreview = innerWidth > 1024;

	$: boardAspectW = overlay?.aspectRatio?.width ?? 16;
	$: boardAspectH = overlay?.aspectRatio?.height ?? 9;
	$: isVertical = (overlay?.aspectRatio?.height ?? 0) > (overlay?.aspectRatio?.width ?? 0);

	// Fixed-position navbar sidebars: w-16 = 64px each side (hidden on overlay pages).
	// Board canvas padding: 8px each side = 16px total.
	const NAVBAR_W = 64;
	const BOARD_PAD = 8;
	$: navbarReserved = $isOverlayPage ? 0 : NAVBAR_W * 2;
	$: sidebarWidth = displayPreview ? 260 : 0;
	$: availableWidth = innerWidth - sidebarWidth - navbarReserved - BOARD_PAD * 2;

	const selectedEditorHeight = 52;
	$: availableHeight = innerHeight - 42 - selectedEditorHeight - 42 - BOARD_PAD * 2;

	$: horizontalWidth = availableWidth;
	$: horizontalHeight = Math.floor((horizontalWidth / boardAspectW) * boardAspectH);

	$: verticalHeight = availableHeight;
	$: verticalWidth = Math.floor((verticalHeight * boardAspectW) / boardAspectH);

	// If the computed height is too tall, constrain it
	$: boardWidth = isVertical
		? Math.min(verticalWidth, availableWidth)
		: Math.min(horizontalWidth, availableWidth);
	$: boardHeight = isVertical
		? Math.min(verticalHeight, availableHeight)
		: Math.min(horizontalHeight, availableHeight);

	// Recalculate constrained height/width when limits apply
	$: constrainedBoardHeight = isVertical
		? boardHeight
		: Math.floor((boardWidth / boardAspectW) * boardAspectH);
	$: constrainedBoardWidth = isVertical
		? Math.floor((constrainedBoardHeight * boardAspectW) / boardAspectH)
		: boardWidth;


</script>

<svelte:window bind:innerWidth bind:innerHeight />

<main
	class="fixed top-0 left-0 w-screen h-screen background-primary-color text-secondary-color overflow-hidden"
	style="padding: 0;"
	in:fade={{ delay: 50, duration: 150 }}
>
	{#if overlay && constrainedBoardHeight && constrainedBoardWidth}
		<div class="w-full h-full flex overflow-hidden">

			<!-- Left sidebar: live preview + layer toggles -->
			{#if displayPreview}
				<div
					class="h-full flex flex-col gap-2 p-2 border-r border-secondary-color shrink-0"
					style="width: 260px;"
				>
					<p class="editor-label">Preview</p>
					<div
						class="relative w-full border-secondary overflow-hidden"
						style="
							aspect-ratio: {boardAspectW} / {boardAspectH};
							max-width: 100%;
							max-height: 55%;
							background-image: url('{tempBackgroundImage}');
							background-size: cover;
						"
					>
						{#if showDemo}
							<div class="absolute inset-0 z-0 pointer-events-none">
								<GameStateRender settings={$gameSettings} frame={$gameFrame} camera="live" fit="cover" />
							</div>
						{/if}
						<Preview />
						<button
							class="absolute bottom-1.5 right-1.5 z-50 w-4 h-4 opacity-50 hover:opacity-100 transition-opacity"
							on:click={() => (isPreviewModalOpen = true)}
						>
							<img src="/image/button-icons/popup.png" alt="popup" />
						</button>
					</div>
					<!-- Replay test: simulate the recent replay (drives live data) + live-camera backdrop -->
					<button
						class="btn shrink-0 text-xs h-7 border-secondary rounded whitespace-nowrap"
						class:active-toggle={showDemo}
						title="Replay your most recent game so elements update with real data, with the game shown behind the canvas"
						on:click={toggleReplay}
					>{showDemo ? '■ Stop replay' : '▶ Run replay'}</button>
					<!-- Background image -->
					<div class="shrink-0">
						<ExternalPreviewSettings bind:base64={tempBackgroundImage} />
					</div>
					<p class="editor-label">Layers</p>
					<div class="flex-1 border-secondary overflow-hidden">
						<LayerToggle />
					</div>
				</div>
			{/if}

			<!-- Main editor column -->
			<div class="flex-1 flex flex-col min-w-0 overflow-hidden">

				<!-- Top bar: title + actions -->
				<div class="editor-bar flex items-center gap-2 px-3 border-b border-secondary-color shrink-0 overflow-hidden">
					<button
						class="toolbar-btn shrink-0"
						on:click={() => goto('/')}
					>
						<House size={16} strokeWidth={1.5} />
					</button>
					<span class="font-semibold text-sm truncate flex-1 min-w-0">{overlay.title}</span>
					{#if !displayPreview && selectedLayer}
						<LayerEdit {overlay} bind:selectedLayer />
					{/if}
					<button class="toolbar-btn shrink-0" on:click={() => (isSceneModalOpen = true)}>Configure</button>
					<button class="toolbar-btn shrink-0" on:click={downloadOverlay}>Export</button>
					<button class="toolbar-btn shrink-0" on:click={() => (isEmbedModalOpen = true)}>Embed</button>
				</div>

				<!-- Selected item inspector -->
				<div class="shrink-0 px-3" style="height: {selectedEditorHeight}px; overflow: hidden;">
					<SelectedEditor />
				</div>

				<!-- Board canvas -->
				<div class="flex-1 flex items-center justify-center overflow-hidden" style="padding: 8px;">
					<div
						class="border-secondary bg-cover relative"
						style="
							width: {constrainedBoardWidth}px;
							height: {constrainedBoardHeight}px;
							background-image: url('{tempBackgroundImage}');
						"
					>
						<BoardEdit bind:borderHeight={constrainedBoardHeight} borderWidth={constrainedBoardWidth} {showDemo} />
					</div>
				</div>

				<!-- Bottom toolbar -->
				<div class="editor-bar flex items-center gap-2 px-3 border-t border-secondary-color shrink-0 flex-wrap">
					<button
						class="toolbar-btn shrink-0"
						on:click={() => {
							selectedItemId = newId();
							isElementModalOpen = true;
						}}
					>+ Add Element</button>
					<div class="toolbar-sep shrink-0" />
					<SceneSelect />
				</div>
			</div>
		</div>

		<SceneEditModal bind:open={isSceneModalOpen} {overlay} />
	{/if}

	{#key selectedItemId}
		<ElementModal bind:open={isElementModalOpen} {selectedItemId} />
	{/key}
	<PreviewModal bind:open={isPreviewModalOpen} />
	<EmbedModal bind:open={isEmbedModalOpen} />
</main>

<style>
	main {
		/* Override app.css main padding for the full-screen editor */
		padding: 0 !important;
	}

	.editor-label {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: 0.45;
		padding: 0 0.25rem;
	}

	.editor-bar {
		min-height: 42px;
		background-color: var(--primary-color);
	}

	.toolbar-sep {
		width: 1px;
		height: 1.25rem;
		background-color: var(--secondary-color);
		opacity: 0.2;
	}

	.toolbar-btn {
		height: 2rem;
		padding: 0 0.75rem;
		font-size: 0.875rem;
		font-weight: 600;
		transition: transform 0.1s;
		background-color: var(--primary-color);
		color: var(--secondary-color);
		border: 1px solid var(--secondary-color);
		border-radius: 0.125rem;
		white-space: nowrap;
	}

	.toolbar-btn:active {
		opacity: 0.5;
	}

	.active-toggle {
		background: var(--secondary-color);
		color: var(--primary-color);
	}
</style>
