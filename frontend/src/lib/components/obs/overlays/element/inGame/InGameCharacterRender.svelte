<script lang="ts">
	import { findSettingsPlayer } from '$lib/utils/gamePredicates';
	import { colorOverlay } from '$lib/utils/colorOverlay';
	import { CHARACTERS_INTERNAL_EXTERNAL } from '$lib/models/constants/characterData';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import type { Player } from '$lib/models/types/slippiData';
	import { gameFrame, gameSettings, statsScene } from '$lib/utils/store.svelte';
	import { isNil } from 'lodash';

	export let dataItem: GridContentItem;
	export let player: Player | undefined;
	export let preview: boolean = false;
	export let style: GridContentItemStyle;
	export let defaultPreviewId: number;
	export let direction: 'left' | 'right';

	$: postFrame = $gameFrame?.players?.[player?.playerIndex ?? 0]?.post;

	$: characterId = preview
		? defaultPreviewId
		: CHARACTERS_INTERNAL_EXTERNAL[postFrame?.internalCharacterId ?? -1] ?? 0;
	$: characterColorId = preview
		? 0
		: findSettingsPlayer($gameSettings?.players, player?.playerIndex ?? 0)?.characterColor ?? 0;

	let div: HTMLElement;
</script>

{#if !isNil(characterId)}
	<div
		class={`w-full h-full ${style.classValue} flex`}
		style={`${style.cssValue}; ${
			dataItem?.data.advancedStyling ? dataItem?.data.css.customBox : ''
		}; justify-content: center`}
		bind:this={div}
	>
		{#if div}
			<img
			use:colorOverlay={dataItem?.data.colorOverlay}
				class="h-full"
				style={`object-fit: cover; object-position: ${
					direction === 'left' ? 100 : 0
				}% 0;  height: ${div?.clientHeight}px;
		${dataItem?.data.advancedStyling ? dataItem?.data.css.customImage : ''};`}
				src={`/image/characters/${characterId}/${characterColorId}/vs-${direction}.png`}
				alt="custom"
			/>
		{/if}
	</div>
{/if}
