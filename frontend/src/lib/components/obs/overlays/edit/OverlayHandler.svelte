<script lang="ts" context="module">
	import { Animation, LiveStatsScene } from '$lib/models/enum';
	import type { CustomElement } from '$lib/models/constants/customElement';
	import type {
		AnimationSettings,
		ElementPayload,
		GridContentItem,
		Overlay,
	} from '$lib/models/types/overlay';

	import { COL, MIN, SCENE_TRANSITION_DELAY } from '$lib/models/const';

	//@ts-ignore
	import gridHelp from 'svelte-grid/build/helper/index.mjs';
	import { electronEmitter, overlays } from '$lib/utils/store.svelte';
	import type { SelectedAnimationTriggerCondition } from '$lib/models/types/animationOption';
	import { getElectronEmitter, getOverlays } from '$lib/utils/fetchSubscriptions.svelte';
	import isNil from 'lodash/isNil';
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { newId } from '$lib/utils/helper';

	export function generateNewItem(
		elementId: CustomElement,
		payload: ElementPayload,
		items: GridContentItem[] | undefined = undefined,
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
			id: newId(),
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
		console.log('Get overlays', overlays);
		return overlays[overlayId];
	}

	export async function updateOverlay(overlay: Overlay) {
		await new Promise(() =>
			electronEmitter.subscribe((electronEmitter) =>
				electronEmitter.emit('OverlayUpdate', overlay),
			),
		);
	}

	export async function updateScene(overlay: Overlay, statsScene: LiveStatsScene) {
		await new Promise(() =>
			electronEmitter.subscribe((electronEmitter) =>
				electronEmitter.emit('SceneUpdate', overlay.id, statsScene, overlay[statsScene]),
			),
		);
	}

	export function duplicateOverlay(overlay: Overlay) {
		electronEmitter.subscribe((electronEmitter) =>
			electronEmitter.emit('OverlayDuplicate', overlay.id),
		);
	}

	export async function deleteOverlay(overlayId: string | undefined) {
		if (!overlayId) return;
		await new Promise(() =>
			electronEmitter.subscribe((electronEmitter) =>
				electronEmitter.emit('OverlayDelete', overlayId),
			),
		);
	}

	export function getDefaultElementPayload(): ElementPayload {
		return {
			advancedStyling: false,
			animationTrigger: {
				in: getDefaultAnimations(SCENE_TRANSITION_DELAY),
				out: getDefaultAnimations(),
				selectedOptions: {} as SelectedAnimationTriggerCondition,
			},
			class: {
				rounded: '',
				alignment: 'justify-center',
			},
			css: {
				background: '#ffffff00',
				borderLeft: '0rem',
				borderRight: '0rem',
				borderTop: '0rem',
				borderBottom: '0rem',
				borderColor: '#ffffffff',
				color: '#ffffffff',
				customParent: undefined,
				customBox: undefined,
				customText: undefined,
				customImage: undefined,
				opacity: 1,
				fill: '#ff000000',
				stroke: '#ffffff',
				strokeWidth: 3,
				fillOpacity: 1,
			},
			description: '',
			percent: {
				startColor: '#ffffff',
				endColor: '#6f1622',
			},
			font: {
				family: 'default',
				src: undefined,
			},
			image: {
				name: undefined,
				src: undefined,
				objectFit: 'contain',
			},
			visibility: {
				in: getDefaultAnimations(SCENE_TRANSITION_DELAY),
				out: getDefaultAnimations(),
				selectedOptions: [],
			},
			shadow: {
				x: 0,
				y: 0,
				spread: 0,
				color: '#000000ff',
			},
			string: '',
			textStroke: {
				size: 1,
				color: '#000000ff',
			},
			transform: {
				rotate: 0,
				scale: '1, 1',
				translate: {
					x: 0,
					y: 0,
				},
			},
		};
	}

	function getDefaultAnimations(delay: number = 0): AnimationSettings {
		return {
			options: {
				delay: delay,
				duration: 0,
				easing: '',
				start: 0,
				x: 0,
				y: 0,
			},
			type: Animation.None,
		};
	}

	export async function newLayer(sceneId: number | undefined, layerIndex: number) {
		if (!sceneId) return;

		const _electronEmitter = await getElectronEmitter();
		_electronEmitter.emit('LayerNew', sceneId, layerIndex);

		// TODO: Move this logic

		if (isNil(overlay)) return 0;

		const layersLength = overlay[statsScene]?.layers.length;
		overlay[statsScene]?.layers.splice(indexPlacement ?? layersLength, 0, {
			id: undefined,
			index: indexPlacement,
			items: [],
			preview: true,
		});

		updateScene(overlay, statsScene);

		return overlay![statsScene]?.layers.length - 1;
	}

	export async function moveLayer(
		overlayId: string,
		statsScene: LiveStatsScene,
		sceneId: number | undefined,
		layerIndex: number,
		relativeSwap: number,
	) {
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
		sceneId: number | undefined,
		layerId: number | undefined,
	): Promise<void> {
		if (!sceneId || !layerId) return;
		const _electronEmitter = await getElectronEmitter();
		_electronEmitter.emit('LayerDelete', sceneId, layerId);
	}

	export async function notifyDisabledScene(
		curOverlay: Overlay | undefined,
		statsScene: LiveStatsScene,
	) {
		if (curOverlay?.[statsScene]?.active) return;
		notifications.warning(`Selected scene ${statsScene} is disabled`, 3000);
	}
</script>
