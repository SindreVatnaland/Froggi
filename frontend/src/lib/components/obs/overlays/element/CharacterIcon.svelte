<script lang="ts">
	import { findSettingsPlayer } from '$lib/utils/gamePredicates';
	import { colorOverlay } from '$lib/utils/colorOverlay';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import type { Character } from '$lib/models/enum';
	import { isNil } from 'lodash';
	import type { PlayerType } from '../../../../models/types/slippiTypes';
	import { gameSettings, gameState, postGame } from '$lib/utils/store.svelte';
	import { isLighterTeammate } from '$lib/utils/teams';

	export let dataItem: GridContentItem;
	export let player: PlayerType | undefined | null;
	export let defaultPreview: boolean = false;
	export let defaultPreviewId: Character;
	export let style: GridContentItemStyle;

	$: characterId = defaultPreview ? defaultPreviewId : player ? player.characterId : undefined;
	$: characterColorId = defaultPreview
		? 0
		: // Costume unknown (e.g. right after a restart, no game settings yet) → the default costume, never a broken image.
		  (findSettingsPlayer($gameSettings?.players, player?.playerIndex ?? 0)?.characterColor ?? player?.characterColor ?? 0);

	// Doubles: two teammates on the same character — the higher port is drawn lighter (not when recoloured).
	$: lighter =
		!defaultPreview && !dataItem?.data.colorOverlay?.enabled && isLighterTeammate($gameSettings?.players ?? [], player ?? undefined);
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
				style={`object-fit: ${dataItem?.data.image.objectFit ?? 'contain'}; ${lighter ? 'filter: brightness(1.35) saturate(0.85);' : ''}
			${dataItem?.data.advancedStyling ? dataItem?.data.css.customImage : ''};`}
				src={`/image/characters/${characterId}/${characterColorId}/stock.png`}
				alt="custom"
			/>
		</div>
	{/key}
{/if}
