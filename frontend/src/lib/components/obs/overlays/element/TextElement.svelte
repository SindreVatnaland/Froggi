<script lang="ts">
	import TextFitMulti from '$lib/components/TextFitMulti.svelte';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';

	export let dataItem: GridContentItem;
	export let style: GridContentItemStyle;

	// Re-fit only when the element's settings change, not when the same item arrives as a new object
	// (every scene/overlay update rebuilds them): a remount while a visibility out-animation plays left
	// the old copy fading beside the new one — a doubled text.
	$: settingsKey = JSON.stringify(dataItem);
</script>

{#key settingsKey}
	<TextFitMulti
		class={`h-full w-full flex ${style.classValue} `}
		style={`${style.cssValue}; ${
			dataItem?.data.advancedStyling ? dataItem?.data.css.customText : ''
		};`}
		maxFont={1000}
	>
		<slot />
	</TextFitMulti>
{/key}
