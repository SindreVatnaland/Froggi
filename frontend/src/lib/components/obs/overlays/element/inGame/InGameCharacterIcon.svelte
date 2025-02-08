<script lang="ts">
	import { CHARACTERS_INTERNAL_EXTERNAL } from '$lib/models/constants/characterData';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import type { Player } from '$lib/models/types/slippiData';
	import { currentPlayers, gameFrame, gameSettings } from '$lib/utils/store.svelte';
	import { isNil } from 'lodash';

	export let dataItem: GridContentItem;
	export let player: Player | undefined;
	export let preview: boolean = false;
	export let style: GridContentItemStyle;
	export let defaultPreviewId: number;

	$: postFrame = $gameFrame?.players?.[player?.playerIndex ?? 0]?.post;

	$: characterId = preview
		? defaultPreviewId
		: CHARACTERS_INTERNAL_EXTERNAL[postFrame?.internalCharacterId ?? -1] ?? 0;
	$: characterColorId = preview
		? 0
		: $currentPlayers[player?.playerIndex ?? 0].characterColor ?? 0;
</script>

{#key $gameSettings}
	{#if !isNil(characterId)}
		<div
			class={`w-full h-full flex ${style.classValue}`}
			style={`${style.cssValue}; ${
				dataItem?.data.advancedStyling ? dataItem?.data.css.customBox : ''
			}; `}
		>
			<img
				class="h-full w-full aspect-video"
				style={`object-fit: ${dataItem?.data.image.objectFit ?? 'contain'};
			${dataItem?.data.advancedStyling ? dataItem?.data.css.customImage : ''};`}
				src={`/image/characters/${characterId}/${characterColorId}/stock.png`}
				alt="custom"
			/>
		</div>
	{/if}
{/key}
