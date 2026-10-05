<script lang="ts">
	import { colorOverlay } from '$lib/utils/colorOverlay';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import type { Stage } from '@slippi/slippi-js';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean = false;
	export let style: GridContentItemStyle;
	export let stageId: Stage | undefined | null;
	export let fallbackStageId: Stage | undefined | null = null;

	let stage = defaultPreview ? fallbackStageId : stageId;
</script>

{#if stage}
	<div
		class={`w-full h-full flex ${style.classValue} overflow-hidden`}
		style={`${style.cssValue}; ${
			dataItem?.data.advancedStyling ? dataItem?.data.css.customBox : ''
		}; `}
	>
		<img
			use:colorOverlay={dataItem?.data.colorOverlay}
			class="w-full h-full aspect-video"
			style={`object-fit: ${dataItem?.data.image.objectFit ?? 'contain'}; ${
				dataItem?.data.advancedStyling ? dataItem?.data.css.customImage : ''
			};`}
			src={`/image/stages/${stage}.png`}
			alt="stage"
		/>
	</div>
{/if}
