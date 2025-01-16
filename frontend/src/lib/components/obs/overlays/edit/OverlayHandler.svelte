<script lang="ts" context="module">
	import { Animation, LiveStatsScene, SceneBackground } from '$lib/models/enum';
	import type { CustomElement } from '$lib/models/constants/customElement';
	import type {
		AnimationSettings,
		AspectRatio,
		ElementPayload,
		GridContentItem,
		Layer,
		Overlay,
		Scene,
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

	const getDefaultScene = (sceneId: string, active: boolean = true): Scene => {
		return {
			id: undefined,
			active: active,
			animation: {
				duration: 250,
				in: getDefaultAnimations(SCENE_TRANSITION_DELAY),
				out: getDefaultAnimations(),
				layerRenderDelay: 250,
			},
			background: {
				color: '#000000',
				customImage: {
					src: undefined,
					name: undefined,
					objectFit: undefined,
				},
				image: { src: undefined, name: undefined, objectFit: undefined },
				opacity: 100,
				type: SceneBackground.None,
				animation: {
					in: getDefaultAnimations(SCENE_TRANSITION_DELAY),
					out: getDefaultAnimations(),
				},
			},
			fallback: LiveStatsScene.Menu,
			font: {
				family: 'default',
				src: '',
			},
			layers: [
				{
					id: undefined,
					items: [],
					preview: true,
					index: 0,
				},
			],
		};
	};

	export function getNewOverlay(aspect: AspectRatio = { width: 16, height: 9 }): Overlay {
		const id = newId();
		return {
			id: id,
			defaultScene: LiveStatsScene.Menu,
			description: 'Scene Description',
			isDemo: false,
			title: `New Overlay - ${id}`,
			aspectRatio: aspect,
			froggiVersion: '',
			[LiveStatsScene.WaitingForDolphin]: getDefaultScene(newId()),
			[LiveStatsScene.Menu]: getDefaultScene(newId()),
			[LiveStatsScene.InGame]: getDefaultScene(newId()),
			[LiveStatsScene.PostGame]: getDefaultScene(newId()),
			[LiveStatsScene.PostSet]: getDefaultScene(newId(), false),
			[LiveStatsScene.RankChange]: getDefaultScene(newId()),
		} as Overlay;
	}

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
		return await new Promise<Overlay | undefined>((resolve) => {
			overlays?.subscribe((overlays) => resolve(overlays[overlayId]));
		});
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

	export function getDefaultAnimations(delay: number = 0): AnimationSettings {
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

	export async function newLayer(
		overlayId: string,
		statsScene: LiveStatsScene,
		indexPlacement: number | undefined = 0,
	): Promise<number> {
		const newLayerId = newId();

		const overlay = await getOverlayById(overlayId);

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
		selectedLayer: number,
		relativeSwap: number,
	): Promise<number> {
		let updatedOverlay = await getOverlayById(overlayId);

		if (isNil(updatedOverlay)) return 0;

		if (
			selectedLayer === undefined ||
			selectedLayer >= updatedOverlay[statsScene]?.layers.length - 1 ||
			relativeSwap === 0
		)
			return 0;
		[
			updatedOverlay![statsScene].layers[selectedLayer],
			updatedOverlay![statsScene].layers[selectedLayer + relativeSwap],
		] = [
			updatedOverlay![statsScene].layers[selectedLayer + relativeSwap],
			updatedOverlay![statsScene].layers[selectedLayer],
		];

		updateScene(updatedOverlay, statsScene);

		return selectedLayer + relativeSwap;
	}

	export async function duplicateLayer(
		overlayId: string,
		statsScene: LiveStatsScene,
		selectedLayerIndex: number,
	) {
		const _electronEmitter = await getElectronEmitter();
		_electronEmitter.emit('SceneLayerDuplicate', overlayId, statsScene, selectedLayerIndex);
		return selectedLayerIndex;
	}

	export async function deleteLayer(
		overlayId: string,
		statsScene: LiveStatsScene,
		selectedLayerIndex: number,
	): Promise<number> {
		let overlay = await getOverlayById(overlayId);
		if (isNil(overlay) || overlay?.[statsScene].layers.length <= 1) return selectedLayerIndex;

		overlay[statsScene].layers.splice(selectedLayerIndex, 1);
		updateScene(overlay, statsScene);

		return selectedLayerIndex - 1;
	}

	export async function notifyDisabledScene(
		curOverlay: Overlay | undefined,
		statsScene: LiveStatsScene,
	) {
		if (curOverlay?.[statsScene]?.active) return;
		notifications.warning(`Selected scene ${statsScene} is disabled`, 3000);
	}
</script>
