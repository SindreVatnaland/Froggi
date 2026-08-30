<script lang="ts">
	import { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';

	export let dataItem: GridContentItem;
	export let style: GridContentItemStyle;
	export let isButtonPressed: boolean | undefined;
	export let button: string | undefined;

	// Some buttons (e.g. L/R) ship no image — hide the broken <img> instead of showing a broken icon.
	const hideOnError = (e: Event) => {
		const img = e.currentTarget;
		if (img instanceof HTMLImageElement) img.style.visibility = 'hidden';
	};
</script>

<div
	class={`w-full h-full flex justify-center relative ${style.classValue}`}
	style={style.cssValue}
>
	<img
		class="w-full h-full absolute object-contain"
		style={`${style.cssValue}; ${dataItem?.data.advancedStyling}; ${style.shadow}`}
		src={`/image/controller-buttons-component/${button}-outline.png`}
		alt="button"
		on:error={hideOnError}
	/>
	{#if isButtonPressed}
		<img
			class="w-full h-full absolute object-contain"
			style={`${style.cssValue}; ${dataItem?.data.advancedStyling}; ${style.shadow}`}
			src={`/image/controller-buttons-component/${button}-pressed.png`}
			alt="button"
			on:error={hideOnError}
		/>
	{/if}
</div>
