<script lang="ts">
	import { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';

	export let dataItem: GridContentItem;
	export let style: GridContentItemStyle;
	export let isButtonPressed: boolean | undefined;
	export let button: string | undefined;
</script>

<div class="w-full h-full flex justify-center relative">
	<img
		class="w-full h-full absolute object-contain"
		style={`${style.cssValue}; ${dataItem?.data.advancedStyling}; ${style.shadow}`}
		src={`/image/controller-buttons-component/${button}-outline.png`}
		alt="button"
	/>
	{#if isButtonPressed}
		<img
			class="w-full h-full absolute object-contain"
			style={`${style.cssValue}; ${dataItem?.data.advancedStyling}; ${style.shadow}`}
			src={`/image/controller-buttons-component/${button}-pressed.png`}
			alt="button"
		/>
	{/if}
</div>
