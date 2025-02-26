<script lang="ts">
	import { ControllerButtons } from '$lib/models/types/controller';
	import { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';

	export let dataItem: GridContentItem;
	export let style: GridContentItemStyle;
	export let buttonPresses: ControllerButtons | undefined;
</script>

<div class="w-full h-full flex justify-center items-center relative">
	<img
		class="w-full h-full absolute object-contain"
		style={` ${style.cssValue}; ${dataItem?.data.advancedStyling}; ${style.shadow};`}
		src={`/image/controller-buttons-component/DPadGate.png`}
		alt="DPadGate"
	/>
	{#if buttonPresses?.isDPadUpPressed}
		<img
			class="w-full h-full absolute object-contain"
			style={`absolute ${style.cssValue}; ${dataItem?.data.advancedStyling}; ${style.shadow}`}
			src={`/image/controller-buttons-component/DPadUp.png`}
			alt="DPadUp"
		/>
	{/if}
	{#if buttonPresses?.isDPadDownPressed}
		<img
			class="w-full h-full absolute object-contain"
			style={`absolute ${style.cssValue}; ${dataItem?.data.advancedStyling}; ${style.shadow}`}
			src={`/image/controller-buttons-component/DPadDown.png`}
			alt="DPadDown"
		/>
	{/if}
	{#if buttonPresses?.isDPadLeftPressed}
		<img
			class="w-full h-full absolute object-contain"
			style={`absolute ${style.cssValue}; ${dataItem?.data.advancedStyling}; ${style.shadow}`}
			src={`/image/controller-buttons-component/DPadLeft.png`}
			alt="DPadLeft"
		/>
	{/if}
	{#if buttonPresses?.isDPadRightPressed}
		<img
			class="w-full h-full absolute object-contain"
			style={`absolute ${style.cssValue}; ${dataItem?.data.advancedStyling}; ${style.shadow}`}
			src={`/image/controller-buttons-component/DPadRight.png`}
			alt="DPadRight"
		/>
	{/if}
</div>
