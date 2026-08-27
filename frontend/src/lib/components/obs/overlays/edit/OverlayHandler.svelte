<script lang="ts" context="module">
	import { LiveStatsScene } from '$lib/models/enum';
	import type { CustomElement } from '$lib/models/constants/customElement';
	import type {
		ElementPayload,
		GridContentItem,
		Overlay,
	} from '$lib/models/types/overlay';

	import { COL, MIN } from '$lib/models/const';

	//@ts-ignore
	import gridHelp from 'svelte-grid/build/helper/index.mjs';
	import { getElectronEmitter, getOverlays } from '$lib/utils/fetchSubscriptions.svelte';
	import isNil from 'lodash/isNil';
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { newId } from '$lib/utils/helper';
	import { startCase } from 'lodash';
	// Re-exported so ElementModal.svelte's existing import keeps working —
	// the actual definitions live in a plain .ts module shared with Electron (MCP overlay-write tools).
	export { getDefaultElementPayload } from '$lib/utils/overlayElementDefaults';

	export function generateNewItem(
		elementId: CustomElement,
		payload: ElementPayload,
		items: GridContentItem[] | undefined = undefined,
		itemId: string = newId(),
	) {
		const newItem = {
			[COL]: gridHelp.item({
				w: 24,
				h: 24,
				x: 0,
				y: 0,
				min: { w: MIN, h: MIN },
				max: { y: COL - MIN, h: COL + 1 },
			}),
			id: itemId,
			elementId: elementId,
			data: payload,
		};
		if (isNil(items)) return newItem;

		const findPosition = gridHelp.findSpace(newItem, items, COL);
		return {
			...newItem,
			[COL]: {
				...newItem[COL],
				...findPosition,
			},
		};
	}

	export async function getOverlayById(
		overlayId: string | undefined,
	): Promise<Overlay | undefined> {
		if (isNil(overlayId)) return;
		const overlays = await getOverlays();
		return overlays[overlayId];
	}

	export async function updateOverlay(overlay: Overlay) {
		const emitter = await getElectronEmitter();
		emitter.emit('OverlayUpdate', overlay);
	}

	export async function updateScene(overlay: Overlay, statsScene: LiveStatsScene) {
		const emitter = await getElectronEmitter();
		emitter.emit('SceneUpdate', overlay.id, statsScene, overlay[statsScene]);
	}

	export async function duplicateOverlay(overlay: Overlay) {
		const emitter = await getElectronEmitter();
		emitter.emit('OverlayDuplicate', overlay.id);
	}

	export async function deleteOverlay(overlayId: string | undefined) {
		if (!overlayId) return;
		const emitter = await getElectronEmitter();
		emitter.emit('OverlayDelete', overlayId);
	}

	export async function newLayer(
		overlayId: string,
		statsScene: LiveStatsScene,
		sceneId: number | undefined,
		layerIndex: number,
	) {
		console.log(overlayId, statsScene, sceneId, layerIndex);
		if (!sceneId) return;

		const _electronEmitter = await getElectronEmitter();
		_electronEmitter.emit('LayerNew', overlayId, statsScene, sceneId, layerIndex);
	}

	export async function moveLayer(
		overlayId: string,
		statsScene: LiveStatsScene,
		sceneId: number | undefined,
		layerIndex: number,
		relativeSwap: number,
	) {
		console.log('move', overlayId, statsScene, sceneId, layerIndex, relativeSwap);
		if (!sceneId) return;
		const _electronEmitter = await getElectronEmitter();
		_electronEmitter.emit(
			'LayerMove',
			overlayId,
			statsScene,
			sceneId,
			layerIndex,
			relativeSwap,
		);
	}

	export async function duplicateLayer(
		overlayId: string,
		statsScene: LiveStatsScene,
		selectedLayerIndex: number,
	) {
		const _electronEmitter = await getElectronEmitter();
		_electronEmitter.emit('LayerDuplicate', overlayId, statsScene, selectedLayerIndex);
		return selectedLayerIndex;
	}

	export async function deleteLayer(
		overlayId: string,
		statsScene: LiveStatsScene,
		sceneId: number | undefined,
		layerId: number | undefined,
	): Promise<void> {
		console.log('delete', overlayId, statsScene, sceneId, layerId);
		if (!sceneId || isNil(layerId)) return;
		const _electronEmitter = await getElectronEmitter();
		_electronEmitter.emit('LayerDelete', overlayId, statsScene, sceneId, layerId);
	}

	export async function notifyDisabledScene(
		overlayId: string | undefined,
		statsScene: LiveStatsScene,
	) {
		const overlay = await getOverlayById(overlayId);
		if (overlay?.[statsScene]?.active) return;
		notifications.warning(`Selected scene ${startCase(statsScene)} is disabled`, 3000);
	}
</script>
