<script lang="ts">
	import { colorOverlay } from '$lib/utils/colorOverlay';
	import { CustomElement } from '$lib/models/constants/customElement';
	import { CHARACTERS, CHARACTERS_INTERNAL_EXTERNAL } from '$lib/models/constants/characterData';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { resolvePackImage } from '$lib/models/types/assetPack';
	import { assetPacks, currentPlayer, currentPlayers, gameFrame, isElectron, urls } from '$lib/utils/store.svelte';
	import { isNil } from 'lodash';

	// "Player 1 / Player 2 / Current Player Character": the player's character + skin from an asset
	// pack (data.assetPack; default = built-in stock icons). Pack lookup: skin → skin 0 → built-in.
	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;

	$: player =
		dataItem.elementId === CustomElement.InGamePlayer1Character
			? $currentPlayers.at(0)
			: dataItem.elementId === CustomElement.InGamePlayer2Character
				? $currentPlayers.at(1)
				: $currentPlayer;

	// Live frame first (follows Sheik/Zelda transforms), else the character from game start.
	$: postFrame = $gameFrame?.players?.[player?.playerIndex ?? 0]?.post;
	$: liveCharacterId = isNil(postFrame?.internalCharacterId) ? undefined : CHARACTERS_INTERNAL_EXTERNAL[postFrame.internalCharacterId];
	$: characterId = defaultPreview ? Number(CHARACTERS['fox']) : liveCharacterId ?? player?.characterId;
	$: skinId = defaultPreview ? 0 : player?.characterColor ?? 0;

	$: resourceBase = ($isElectron ? $urls?.localResource : $urls?.externalResource) ?? '';
	$: src = isNil(characterId) ? undefined : resolvePackImage($assetPacks, dataItem.data.assetPack, characterId, skinId, resourceBase);
</script>

{#if src}
	<div
		class={`w-full h-full flex ${style.classValue}`}
		style={`${style.cssValue}; ${dataItem?.data.advancedStyling ? dataItem?.data.css.customBox : ''}; `}
	>
		<img
			use:colorOverlay={dataItem?.data.colorOverlay}
			class="h-full w-full"
			style={`object-fit: ${dataItem?.data.image.objectFit ?? 'contain'};
			${dataItem?.data.advancedStyling ? dataItem?.data.css.customImage : ''};`}
			{src}
			alt="character"
		/>
	</div>
{/if}
