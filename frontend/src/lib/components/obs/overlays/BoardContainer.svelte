<script lang="ts">
	import { SCENE_TRANSITION_DELAY } from '$lib/models/const';
	import { SceneBackground } from '$lib/models/enum';
	import type { Scene } from '$lib/models/types/overlay';
	import { gameSettings, isElectron, postGame, urls } from '$lib/utils/store.svelte';
	import type { AnimationConfig } from 'svelte/animate';
	import { createAnimation } from './element/animations/Animations.svelte';
	import { fly } from 'svelte/transition';
	import { page } from '$app/stores';
	import { Element } from 'svelte/types/compiler/interfaces';
	import { Stage } from '$lib/models/constants/stageData';

	export let boardHeight: number | undefined = undefined;
	export let boardWidth: number | undefined = undefined;
	export let edit: boolean = false;
	export let preview: boolean = false;
	export let scene: Scene;

	const url = $isElectron ? $urls.localResource : $urls.externalResource;
	const overlayId = $page.params.overlay;

	let innerHeight: number;
	let innerWidth: number;

	const animateIn = (node: Element, args: { scene: Scene | undefined }): AnimationConfig => {
		const { scene } = args;
		if (preview || edit || !scene) return fly(node, { duration: 0 });
		return createAnimation(
			node,
			scene.background.animation.in,
			boardHeight ?? innerHeight,
			boardWidth ?? innerWidth,
			SCENE_TRANSITION_DELAY,
		);
	};
	const animateOut = (node: Element, args: { scene: Scene | undefined }): AnimationConfig => {
		const { scene } = args;
		if (preview || edit || !scene) return fly(node, { duration: 0 });
		return createAnimation(
			node,
			scene.background.animation.out,
			boardHeight ?? innerHeight,
			boardWidth ?? innerWidth,
		);
	};
</script>

<svelte:window bind:innerHeight bind:innerWidth />

{#key scene.background}
	<div
		in:animateIn|global={{ scene }}
		out:animateOut|global={{ scene }}
		class={`w-full h-full bg-center absolute z-0`}
		style={`
				${scene?.background.type === SceneBackground.Color ? `background: ${scene.background.color};` : ''};
				${
					scene?.background.type === SceneBackground.Image
						? `background-image: url('/image/backgrounds/${
								scene.background.image.src
						  }');
						background-size: ${scene.background.image.objectFit ?? 'cover'};`
						: ''
				}
				${
					scene?.background.type === SceneBackground.ImageCustom
						? `background-image: url('${url}/public/custom/${overlayId}/image/${
								scene.background.customImage.name
						  }'); 
						background-size: ${scene.background.customImage.objectFit ?? 'cover'};`
						: ''
				}
				${
					scene?.background.type === SceneBackground.InGameImageStage &&
					$gameSettings.stageId
						? `background-image: url('/image/stages/${$gameSettings.stageId}.png');
						background-size: ${scene.background.image.objectFit ?? 'cover'};`
						: ''
				}
				${
					scene?.background.type === SceneBackground.PostGameImageStage &&
					$postGame?.settings
						? `background-image: url('/image/stages/${
								$postGame?.settings?.stageId
						  }.png');
						background-size: ${scene.background.image.objectFit ?? 'cover'};`
						: ''
				}
				${scene?.background.opacity !== undefined ? `opacity: ${scene.background.opacity / 100};` : ''}
				background-repeat: no-repeat;`}
	>
		<slot />
	</div>
{/key}
