<script lang="ts">
	import { STAGE_DATA, Stage } from '$lib/models/constants/stageData';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import PlayerSpot from './PlayerSpot.svelte';
	import StageRender from './StageRender.svelte';

	export let dataItem: GridContentItem | undefined = undefined;
	export let defaultPreview: boolean = false;
	export let style: GridContentItemStyle;
	export let stageId: Stage | undefined | null;
	export let fallbackStageId: Stage | undefined | null = null;

	$: stage = defaultPreview ? fallbackStageId : stageId ? stageId : null;
	$: stageData = STAGE_DATA[stage ?? 0];
</script>

{#if stage}
	<svg
		class={`w-full h-full flex ${style.classValue} overflow-hidden`}
		style={`${style.cssValue}; ${
			dataItem?.data.advancedStyling ? dataItem?.data.css.customBox : ''
		}; `}
		viewBox={stageData?.viewbox ?? '-300 - 300 590 440'}
	>
		<g
			class="-scale-y-100"
			style={`${style.cssValue}; ${
				dataItem?.data.advancedStyling ? dataItem?.data.css.customBox : ''
			}; `}
		>
			<g class="origin-top-left scale-[1.2]">
				<StageRender stageId={stage} />
				{#if !defaultPreview}
					<PlayerSpot />
				{/if}
			</g>
		</g>
	</svg>
{/if}
