<script lang="ts">
	import { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';

	export let dataItem: GridContentItem;
	export let style: GridContentItemStyle;
	export let analogXValue: number | undefined;
	export let analogYValue: number | undefined;
	export let ribs: boolean = false;

	let div: HTMLElement;

	$: analogXValuePercent = divSize * (analogXValue ?? 0) * 0.25;
	$: analogYValuePercent = -divSize * (analogYValue ?? 0) * 0.25;

	$: divSize =
		(div?.clientHeight ?? 0) > (div?.clientWidth ?? 0)
			? div?.clientWidth ?? 0
			: div?.clientHeight ?? 0;

	$: filledStyle = `transform: translate(${analogXValuePercent}px, ${analogYValuePercent}px);`;
</script>

<div
	bind:this={div}
	class="w-full h-full flex justify-center items-center"
	style={`${style.cssValue}; ${dataItem?.data.advancedStyling}; ${style.shadow}`}
>
	<img
		class="w-full h-full absolute object-contain"
		src="/image/controller-buttons-component/joystick-gate.png"
		alt="Joystick Gate"
	/>
	{#if ribs}
		<img
			class="w-full h-full absolute object-contain"
			style={filledStyle}
			src="/image/controller-buttons-component/joystick-ribs-filled.png"
			alt="Joystick Mask"
		/>
	{:else}
		<img
			class="w-full h-full absolute object-contain"
			style={filledStyle}
			src="/image/controller-buttons-component/joystick-filled.png"
			alt="Joystick Filled"
		/>
	{/if}
</div>
