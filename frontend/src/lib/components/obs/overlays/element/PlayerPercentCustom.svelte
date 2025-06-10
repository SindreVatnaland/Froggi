<script lang="ts">
	import { Animation, InGameState } from '$lib/models/enum';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import type { Player } from '$lib/models/types/slippiData';
	import { gameFrame, gameState, localEmitter } from '$lib/utils/store.svelte';
	import type { FrameEntryType } from '@slippi/slippi-js';
	import { createAnimation } from './animations/Animations.svelte';
	import { onMount } from 'svelte';
	import type { TransitionConfig } from 'svelte/transition';
	import { get, isNil } from 'lodash';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;

	export let player: Player | undefined;
	export let numberOfDecimals: number;

	$: isInGame =
		!isNil($gameState) && [InGameState.Paused, InGameState.Running].includes($gameState);

	$: frame = $gameFrame?.players?.[player?.playerIndex ?? -1]?.post;

	$: framePercent = frame && isInGame ? Math.floor(frame.percent ?? 0).toFixed() : '0';

	$: decimals =
		numberOfDecimals && isInGame
			? frame?.percent?.toFixed(numberOfDecimals).split('.').at(1) ?? '0'
			: '0';

	const MAX_INTENSITY = 300;
	let percentageColor: string = dataItem.data.percent.startColor;

	const updateColor = () => {
		var startColor = dataItem.data.percent.startColor; // Replace with your desired start color
		var endColor = dataItem.data.percent.endColor; // Replace with your desired end color

		percentageColor = interpolateColors(startColor, endColor, parseInt(framePercent)); // Call the function to interpolate the colors
	};
	$: frame?.percent, updateColor();

	function interpolateColors(startColor: string, endColor: string, value: number) {
		value = Math.min(value, MAX_INTENSITY);
		var startRGB = hexToRgb(startColor); // Convert the start color to RGB
		var endRGB = hexToRgb(endColor); // Convert the end color to RGB

		var r = interpolate(startRGB.r, endRGB.r, value); // Interpolate the red component
		var g = interpolate(startRGB.g, endRGB.g, value); // Interpolate the green component
		var b = interpolate(startRGB.b, endRGB.b, value); // Interpolate the blue component

		return rgbToHex(r, g, b); // Convert the interpolated RGB values back to hex
	}

	function interpolate(start: number, end: number, value: number) {
		return start + (end - start) * (value / MAX_INTENSITY); // Perform linear interpolation
	}

	function hexToRgb(hex: string) {
		var bigint = parseInt(hex.slice(1), 16);
		var r = (bigint >> 16) & 255;
		var g = (bigint >> 8) & 255;
		var b = bigint & 255;
		return { r, g, b };
	}

	function rgbToHex(r: number, g: number, b: number) {
		var hex = ((r << 16) | (g << 8) | b).toString(16);
		return '#' + ('000000' + hex).slice(-6);
	}

	let trigger = 0;
	let prevFrame: FrameEntryType;

	// TODO: Fix
	const animationTrigger = (
		player: Player | undefined,
		gameFrame: FrameEntryType | null | undefined,
	) => {
		if (!player || !gameFrame) return;
		let trigger = false;
		trigger =
			(gameFrame?.players?.[player.playerIndex]?.pre.percent ?? 0) >
				(prevFrame?.players?.[player.playerIndex]?.pre.percent ?? 0) || trigger;
		prevFrame = gameFrame;
		return trigger;
	};
	$: if (animationTrigger(player, $gameFrame)) trigger = Math.random();

	const animation = (node: Element): TransitionConfig =>
		createAnimation(
			node,
			{
				type: Animation.Percent,
				options: {
					duration: 11 * 16,
					x: 500,
					y: 500,
					delay: 0,
					easing: 'cubicOut',
					start: 0,
				},
			},
			(parent?.clientHeight ?? 0) * 2,
			(parent?.clientWidth ?? 0) * 2,
			0,
			dataItem,
		);

	onMount(() => {
		const handler = () => {
			const tempFramePercent = framePercent;
			framePercent = `${Math.random()}`;
			setTimeout(() => {
				framePercent = tempFramePercent;
			});
		};

		$localEmitter.on('TestCustomAnimationTrigger', handler);

		return () => {
			$localEmitter.off('TestCustomAnimationTrigger', handler);
		};
	});

	let parent: HTMLElement | undefined;

	let clientWidth: number = 0;
	let clientHeight: number = 0;
</script>

<div class="w-full h-full relative" bind:clientWidth bind:clientHeight>
	{#if isInGame || defaultPreview}
		{#key clientHeight * clientWidth}
			<div class={`w-full h-full absolute`}>
				<div
					class={`${style.classValue.replace(
						'justify-center',
						'justify-end',
					)} flex aspect-[23/9] max-h-full w-full items-end justify-end; `}
					style={`${style.cssValue}; transform: translate(0,25%); ${dataItem?.data.advancedStyling}; color: ${percentageColor}; ${style.textStroke}`}
					bind:this={parent}
				>
					{#if parent}
						{#key framePercent}
							<div
								in:animation|local
								class="flex h-full items-end justify-center"
								style={`font-size: ${parent?.clientHeight ?? 0}px`}
							>
								{defaultPreview ? 3 : framePercent.at(-3) ?? ''}
							</div>
							<div
								in:animation|local
								class="flex h-full items-end justify-center"
								style={`font-size: ${parent?.clientHeight ?? 0}px`}
							>
								{defaultPreview ? 0 : framePercent.at(-2) ?? ''}
							</div>
							<div
								in:animation|local
								class="flex h-full items-end justify-center"
								style={`font-size: ${parent?.clientHeight ?? 0}px`}
							>
								{defaultPreview ? 0 : framePercent.at(-1) ?? ''}
							</div>
							{#if !numberOfDecimals}
								<div
									in:animation|local
									class="flex h-full items-end justify-center pb-[2.25%]"
									style={`font-size: ${parent?.clientHeight * 0.8}px`}
								>
									%
								</div>
							{/if}
						{/key}
						{#if numberOfDecimals}
							{#key framePercent}
								<div
									in:animation|local
									class="flex h-full items-end justify-center pb-[6%]"
									style={`font-size: ${parent?.clientHeight * 0.55}px`}
								>
									.
								</div>
								<div
									in:animation|local
									class="flex h-full items-end justify-center pb-[6%]"
									style={`font-size: ${parent?.clientHeight * 0.55}px`}
								>
									{defaultPreview ? 0 : decimals.at(0) ?? ''}
								</div>
								<div
									in:animation|local
									class="flex h-full items-end justify-center pb-[6%]"
									style={`font-size: ${parent?.clientHeight * 0.55}px`}
								>
									%
								</div>
							{/key}
						{/if}
					{/if}
				</div>
			</div>
		{/key}
	{/if}
</div>
