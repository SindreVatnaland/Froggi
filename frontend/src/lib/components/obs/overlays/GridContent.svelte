<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, Scene } from '$lib/models/types/overlay';
	import { fly, type TransitionConfig } from 'svelte/transition';
	import { COL } from '$lib/models/const';
	import AnimationLayer from './element/animations/AnimationLayer.svelte';
	import { createAnimation } from './element/animations/Animations.svelte';
	import GridElements from '$lib/components/obs/overlays/GridElements.svelte';
	import VisibilityAnimationLayer from './element/animations/VisibilityAnimationLayer.svelte';
	import { Element } from 'svelte/types/compiler/interfaces';
	import { isNil } from 'lodash';

	export let additionalDelay: number = 0;
	export let curScene: Scene | undefined = undefined;
	export let dataItem: GridContentItem | undefined = undefined;
	export let demoItem: GridContentItem | undefined = undefined;
	export let edit: boolean = false;
	export let preview: boolean = false;

	function updateDemoData() {
		if (demoItem) dataItem = demoItem;
	}
	$: demoItem, updateDemoData();

	const animateIn = (node: Element): TransitionConfig => {
		if (edit || isNil(dataItem) || isNil(curScene)) return fly(node, { duration: 0 });
		const delay =
			dataItem[COL]?.y +
			Math.abs(dataItem[COL]?.x + dataItem[COL]?.w / 2 - COL / 2) +
			(additionalDelay ?? 0);
		return createAnimation(
			node,
			curScene.animation.in,
			boardHeight,
			boardWidth,
			delay,
			dataItem,
		);
	};

	const animateOut = (node: Element): TransitionConfig => {
		if (edit || !curScene) return fly(node, { duration: 0 });
		return createAnimation(node, curScene.animation.out, boardHeight, boardWidth, 0, dataItem);
	};

	let div: HTMLElement | undefined;
	let parent: HTMLElement | undefined;
	$: boardWidth = div?.clientWidth ?? 0;
	$: boardHeight = div?.clientHeight ?? 0;
</script>

<svelte:window />

{#if dataItem}
	<div class="h-full w-full" bind:this={div}>
		{#if div}
			<div
				style={`${dataItem?.data.advancedStyling ? dataItem?.data.css.customParent : ''};`}
				class={`h-full w-full ${
					edit ? 'bg-white' : 'text-secondary-color'
				} bg-opacity-50 relative`}
			>
				{#if edit}
					<GridElements {dataItem} {edit} />
					<h1
						class="text-secondary-color absolute top-0 left-0"
						style={`font-size: 0.5rem; line-height: 0.5rem;`}
					>
						{CustomElement[dataItem?.elementId] ?? ''}
					</h1>
				{:else}
					<div class="w-full h-full" in:animateIn out:animateOut bind:this={parent}>
						{#if parent}
							<VisibilityAnimationLayer
								animationIn={(node) =>
									createAnimation(
										node,
										dataItem?.data.visibility.in,
										parent?.clientHeight ?? 0,
										parent?.clientWidth ?? 0,
										0,
										dataItem,
									)}
								animationOut={(node) =>
									createAnimation(
										node,
										dataItem?.data.visibility.out,
										parent?.clientHeight ?? 0,
										parent?.clientWidth ?? 0,
										0,
										dataItem,
									)}
								{dataItem}
								{edit}
								{preview}
								isDemo={!!demoItem}
							>
								<AnimationLayer
									animationIn={(node) =>
										createAnimation(
											node,
											dataItem?.data.animationTrigger.in,
											boardHeight,
											boardWidth,
											0,
											dataItem,
										)}
									animationOut={(node) =>
										createAnimation(
											node,
											dataItem?.data.animationTrigger.out,
											boardHeight,
											boardWidth,
											0,
											dataItem,
										)}
									{dataItem}
									{edit}
									isDemo={!!demoItem}
								>
									<GridElements {dataItem} {preview} />
								</AnimationLayer>
							</VisibilityAnimationLayer>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
