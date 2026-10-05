<script lang="ts">
	import { colorOverlay } from '$lib/utils/colorOverlay';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import type { Character } from '$lib/models/enum';
	import { isNil } from 'lodash';
	import { PlayerType } from '@slippi/slippi-js';
	import { gameSettings, gameState, postGame } from '$lib/utils/store.svelte';

	export let dataItem: GridContentItem;
	export let player: PlayerType | undefined | null;
	export let defaultPreview: boolean = false;
	export let defaultPreviewId: Character;
	export let style: GridContentItemStyle;

	$: characterId = defaultPreview ? defaultPreviewId : player ? player.characterId : undefined;
	$: characterColorId = defaultPreview
		? 0
		: $gameSettings.players[player?.playerIndex ?? 0].characterColor ?? undefined;

	// TODO: Include colors
</script>

{#if !isNil(characterId)}
	{#key player}
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
				src={`/image/characters/${characterId}/${characterColorId}/stock.png`}
				alt="custom"
			/>
		</div>
	{/key}
{/if}
