<script lang="ts">
	import { findSettingsPlayer } from '$lib/utils/gamePredicates';
	import { colorOverlay } from '$lib/utils/colorOverlay';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import type { Character } from '$lib/models/enum';
	import { PlayerType } from '@slippi/slippi-js';
	import { gameSettings } from '$lib/utils/store.svelte';
	import { isNil } from 'lodash';

	export let dataItem: GridContentItem;
	export let player: PlayerType | undefined;
	export let defaultPreview: boolean = false;
	export let defaultPreviewId: Character;
	export let style: GridContentItemStyle;
	export let direction: 'left' | 'right';

	$: characterId = defaultPreview
		? defaultPreviewId
		: player?.characterId
		? player.characterId
		: 0;
	$: characterColorId = defaultPreview
		? 0
		: findSettingsPlayer($gameSettings?.players, player?.playerIndex ?? 0)?.characterColor ?? 0;

	let div: HTMLElement;
</script>

{#if !isNil(characterId)}
	{#key player}
		<div
			class={`w-full h-full ${style.classValue} flex`}
			style={`${style.cssValue}; ${
				dataItem?.data.advancedStyling ? dataItem?.data.css.customBox : ''
			}; justify-content: ${direction === 'left' ? 'flex-end' : 'flex-start'}`}
			bind:this={div}
		>
			{#if div}
				<img
			use:colorOverlay={dataItem?.data.colorOverlay}
					class="h-full"
					style={`object-fit: cover; ${'object-position: 100% 0;'};  height: ${
						div?.clientHeight
					}px; justify-content: center;
		${dataItem?.data.advancedStyling ? dataItem?.data.css.customImage : ''};`}
					src={`/image/characters/${characterId}/${characterColorId}/vs-${direction}.png`}
					alt="custom"
				/>
			{/if}
		</div>
	{/key}
{/if}
