<script lang="ts">
	import TextFitMulti from '$lib/components/TextFitMulti.svelte';
	import { InGameState } from '$lib/models/enum';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import type { Player } from '$lib/models/types/slippiData';
	import { gameFrame, gameState } from '$lib/utils/store.svelte';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;

	export let player: Player | undefined;
	export let numberOfDecimals: number;
	/** Just the number, no % (the "Percent Number" elements). */
	export let raw = false;

	$: isInGame = $gameState && [InGameState.Paused, InGameState.Running].includes($gameState);

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
</script>

{#key framePercent}
	<div class="w-full h-full relative">
		{#if isInGame || defaultPreview}
			<div class={`w-full h-full absolute`}>
				<TextFitMulti
					class={`h-full justify-end`}
					style={`${style.cssValue}; ${dataItem?.data.advancedStyling}; color: ${percentageColor}; ${style.textStroke}`}
					maxFont={1000}
				>
					{#if raw}
						<span>{`${defaultPreview ? 300 : framePercent}`}</span>
					{:else if !numberOfDecimals}
						<span class="mr-[.3em]">
							{`${defaultPreview ? 300 : framePercent}`}
							<span class="text-[80%] mx-[-.2em]">%</span>
						</span>
					{/if}
					{#if numberOfDecimals}
						<span class="mr-[.4em]">
							{`${defaultPreview ? 300 : framePercent}`}
							<span class="text-[55%] mx-[-.5em]">
								{`${`.${defaultPreview ? 0 : decimals}`}%`}
							</span>
						</span>
					{/if}
				</TextFitMulti>
			</div>
		{/if}
	</div>
{/key}
