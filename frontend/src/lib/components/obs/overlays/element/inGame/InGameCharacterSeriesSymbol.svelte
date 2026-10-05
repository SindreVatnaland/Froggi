<script lang="ts">
	import { colorOverlay } from '$lib/utils/colorOverlay';
	import {
		CHARACTERS_INTERNAL_EXTERNAL,
		CHARACTERS_SERIES,
	} from '$lib/models/constants/characterData';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import type { Player } from '$lib/models/types/slippiData';
	import { gameFrame, gameSettings } from '$lib/utils/store.svelte';
	import { isNil } from 'lodash';

	export let dataItem: GridContentItem;
	export let player: Player | undefined;
	export let preview: boolean = false;
	export let style: GridContentItemStyle;
	export let defaultPreviewId: number;
	export let series: 'melee' | 'ultimate' = 'melee';

	$: playerPostFrame = $gameFrame?.players?.[player?.playerIndex ?? 0]?.post;
	$: playerSettings = $gameSettings.players?.[player?.playerIndex ?? 0];
	$: externalCharacterId = preview
		? defaultPreviewId
		: playerPostFrame
		? CHARACTERS_INTERNAL_EXTERNAL[playerPostFrame.internalCharacterId ?? -1]
		: playerSettings
		? playerSettings.characterId
		: -1;
	$: characterSeries = CHARACTERS_SERIES[externalCharacterId ?? -1];
</script>

{#if !isNil(characterSeries)}
	<div
		class={`w-full h-full flex ${style.classValue}`}
		style={`${style.cssValue}; ${
			dataItem?.data.advancedStyling ? dataItem?.data.css.customBox : ''
		}; `}
	>
		<img
			use:colorOverlay={dataItem?.data.colorOverlay}
			class="h-full w-full aspect-video"
			style={`object-fit: ${dataItem?.data.image.objectFit ?? 'contain'};
			${dataItem?.data.advancedStyling ? dataItem?.data.css.customImage : ''};`}
			src={`/image/character-origin-icons/${series}/${characterSeries}.svg`}
			alt="custom"
		/>
	</div>
{/if}
