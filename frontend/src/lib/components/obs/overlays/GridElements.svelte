<script lang="ts">
	import { playersForSlot } from '$lib/utils/teams';
	import type { Font, GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { getRelativePixelSize } from '$lib/utils/helper';
	import SlippiRank from './elementRender/SlippiRank.svelte';
	import Custom from './elementRender/Custom.svelte';
	import InGame from './elementRender/InGame.svelte';
	import RecentGame from './elementRender/RecentGame.svelte';
	import RecentMatch from './elementRender/RecentMatch.svelte';
	import Session from './elementRender/Session.svelte';
	import RecentMatchSummary from './elementRender/RecentMatchSummary.svelte';
	import Match from './elementRender/Match.svelte';
	import {
		bingoSession,
		ironManSession,
		ironManCurrentChar,
		currentMatch,
		currentPlayer,
		currentPlayers,
		previewFrozen,
		gameFrame,
		gameScore,
		gameSettings,
		overlays,
		postGame,
		recentGames,
		statsScene,
	} from '$lib/utils/store.svelte';
	import { isNil } from 'lodash';
	import { getContext } from 'svelte';
	import { page } from '$app/stores';
	import { isDisallowedInjectedElement } from '$lib/utils/disallowedElements';
	import {
		BINGO_ELEMENTS,
		PACK_CHARACTER_ELEMENTS,
		IRONMAN_ELEMENTS,
		CUSTOM_ELEMENTS,
		INGAME_ELEMENTS,
		MATCH_ELEMENTS,
		RECENTGAME_ELEMENTS,
		RECENTMATCH_ELEMENTS,
		RECENTMATCHSUMMARY_ELEMENTS,
		SESSION_ELEMENTS,
		SLIPPIRANK_ELEMENTS,
		STRIKING_ELEMENTS,
		TEAM_ELEMENTS,
		FIGHT_STAT_ELEMENTS,
		EDGE_STAT_ELEMENTS,
		WIN_CHANCE_ELEMENTS,
	} from './elementCategories';
	import BingoBoard from './elementRender/BingoBoard.svelte';
	import IronManRoster from './elementRender/IronManRoster.svelte';
	import IronMan from './elementRender/IronMan.svelte';
	import PackCharacter from './elementRender/PackCharacter.svelte';
	import Striking from './elementRender/Striking.svelte';
	import Teams from './elementRender/Teams.svelte';
	import FightStats from './elementRender/FightStats.svelte';
	import EdgeStats from './elementRender/EdgeStats.svelte';
	import WinChance from './elementRender/WinChance.svelte';
	import HighlightVideo from './elementRender/HighlightVideo.svelte';
	import { CustomElement } from '$lib/models/constants/customElement';
	import { strikeState } from '$lib/utils/store.svelte';

	export let dataItem: GridContentItem;
	export let edit: boolean = false;
	export let preview: boolean = false;
	export let boardHeight: number | undefined = undefined;
	export let boardWidth: number | undefined = undefined;
	export let designWidth: number | undefined = undefined;
	export let designHeight: number | undefined = undefined;
	export let overlayId: string | undefined = undefined;
	/** Font of the scene this element is drawn in (a pinned preview scene can differ from the live one). */
	export let sceneFont: string | undefined = undefined;

	$: scaleW = designWidth ?? innerWidth;
	$: scaleH = designHeight ?? innerHeight;

	$: _overlayId = overlayId ?? $page.params.overlay;

	$: isInjected = Boolean(getContext('isInjected'));
	$: isUsingDisallowedInjectedElement = isDisallowedInjectedElement(dataItem.elementId);
	$: shouldPreview = !isInjected || (isInjected && !isUsingDisallowedInjectedElement);

	let div: HTMLElement;
	$: boardWidth = div?.clientWidth ?? 0;
	$: boardHeight = div?.clientHeight ?? 0;
	let innerWidth = 0;
	let innerHeight = 0;

	// Previews use placeholder data — except a screenshot of a frozen replay moment (previewFrozen).
	$: defaultPreview = edit || (preview && !$previewFrozen);

	$: style = {} as GridContentItemStyle;

	$: scaleW, scaleH,
		(style.classValue = Object.entries(dataItem?.data.class ?? {})
			.map(([_, value]) => `${value}`)
			.join(' '));

	$: scaleW, scaleH,
		(style.cssValue = Object.entries(dataItem?.data.css ?? {})
			.map(relativeBoarderSize)
			.map(([key, value]) => `${toKebabCase(key)}: ${value}`)
			.join('; '));

	const relativeBoarderSize = ([key, value]: [string, string]) => {
		if (!['borderLeft', 'borderRight', 'borderTop', 'borderBottom'].includes(key))
			return [key, value];
		return [
			key,
			`${getRelativePixelSize(
				Number(value.slice(0, -9)),
				scaleH,
				scaleW,
			)}${value.slice(-9)}`,
		];
	};

	const getFont = (id: string | undefined, font: Font | undefined, sceneFont: string | undefined) => {
		if (!id || isNil($overlays[id])) return;
		if (font?.family === 'default') {
			if (sceneFont) return sceneFont;
			if ($overlays[id][$statsScene].active)
				return $overlays[id][$statsScene].font.family;
			const fallbackScene = $overlays[id][$statsScene].fallback;
			return $overlays[id][fallbackScene].font.family;
		}
		return font?.family;
	};

	$: shadowSizeX = getRelativePixelSize(dataItem?.data.shadow?.x, scaleH, scaleW);
	$: shadowSizeY = getRelativePixelSize(dataItem?.data.shadow?.y, scaleH, scaleW);
	$: shadowBlur = Math.max(0, getRelativePixelSize((dataItem?.data.shadow?.spread ?? 0) - 1, scaleH, scaleW));
	$: style.shadow = `filter: drop-shadow(${shadowSizeX}px ${shadowSizeY}px ${shadowBlur}px ${dataItem?.data.shadow?.color ?? '#000000'});`;

	$: strokeSize = getRelativePixelSize(dataItem.data.textStroke.size, scaleH, scaleW);
	$: style.textStroke = `-webkit-text-stroke-width: ${strokeSize}px;
						-webkit-text-stroke-color: ${dataItem.data.textStroke.color};`;

	$: style.transform = `transform: translate(${dataItem.data.transform.translate.x ?? 0}%, ${
		dataItem.data.transform.translate.y ?? 0
	}%) scale(${dataItem.data.transform.scale}) rotate(${dataItem.data.transform.rotate ?? 0}deg);`;

	$: fontFamily = getFont(_overlayId, dataItem.data?.font, sceneFont);

	function toKebabCase(str: string) {
		return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
	}
	// Element's own player choice (Styling → Player): Team 1/2 · Player 1/2 in doubles.
	$: elementPlayers = playersForSlot($currentPlayers, dataItem?.data?.playerSlot);
	// A doubles slot that isn't in this game (Team 1 · Player 2 in singles): show nothing.
	$: slotMissing = !defaultPreview && !!dataItem?.data?.playerSlot && elementPlayers.length === 0;
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<div
	class="w-full h-full"
	style={`${`font-family: ${fontFamily};
	`}; ${style.textStroke};
		${style.transform};
		${style.shadow};`}
	bind:this={div}
>
	{#if div && shouldPreview && !slotMissing}
		<div class="w-full h-full">
			{#if PACK_CHARACTER_ELEMENTS.has(dataItem.elementId)}
				<PackCharacter {dataItem} {defaultPreview} {style} />
			{:else if CUSTOM_ELEMENTS.has(dataItem.elementId)}
				<Custom {dataItem} {style} overlayId={_overlayId} />
			{:else if INGAME_ELEMENTS.has(dataItem.elementId)}
				<InGame
					{dataItem}
					{defaultPreview}
					{style}
					gameFrame={$gameFrame}
					gameSettings={$gameSettings}
					currentPlayer={$currentPlayer}
					currentPlayers={elementPlayers}
				/>
			{:else if MATCH_ELEMENTS.has(dataItem.elementId)}
				<Match
					{dataItem}
					{defaultPreview}
					{style}
					gameScore={$gameScore}
					gameSettings={$gameSettings}
					currentPlayers={elementPlayers}
				/>
			{:else if RECENTGAME_ELEMENTS.has(dataItem.elementId)}
				<RecentGame
					{dataItem}
					{defaultPreview}
					{style}
					currentPlayer={$currentPlayer}
					postGame={$postGame}
					currentPlayers={elementPlayers}
				/>
			{:else if RECENTMATCH_ELEMENTS.has(dataItem.elementId)}
				<RecentMatch
					{dataItem}
					{defaultPreview}
					{style}
					matchStats={$currentMatch}
					currentPlayer={$currentPlayer}
					currentPlayers={elementPlayers}
				/>
			{:else if RECENTMATCHSUMMARY_ELEMENTS.has(dataItem.elementId)}
				<RecentMatchSummary
					{dataItem}
					{defaultPreview}
					{style}
					recentGames={$recentGames}
					currentPlayers={elementPlayers}
				/>
			{:else if SLIPPIRANK_ELEMENTS.has(dataItem.elementId)}
				<SlippiRank
					{dataItem}
					{defaultPreview}
					{style}
					currentPlayer={$currentPlayer}
					currentPlayers={elementPlayers}
				/>
			{:else if SESSION_ELEMENTS.has(dataItem.elementId)}
				<Session {dataItem} {defaultPreview} {style} />
			{:else if dataItem.elementId === CustomElement.PostGameHighlightVideo}
				<HighlightVideo {dataItem} {style} {defaultPreview} {preview} />
			{:else if WIN_CHANCE_ELEMENTS.has(dataItem.elementId)}
				<WinChance {dataItem} {defaultPreview} {style} allPlayers={$currentPlayers} frame={$gameFrame} score={$gameScore} bestOf={$gameSettings?.matchInfo?.bestOf ?? 3} gameSettings={$gameSettings} />
			{:else if EDGE_STAT_ELEMENTS.has(dataItem.elementId)}
				<EdgeStats {dataItem} {defaultPreview} {style} currentPlayers={elementPlayers} postGame={$postGame} matchStats={$currentMatch} />
			{:else if FIGHT_STAT_ELEMENTS.has(dataItem.elementId)}
				<FightStats {dataItem} {defaultPreview} {style} currentPlayers={elementPlayers} allPlayers={$currentPlayers} />
			{:else if TEAM_ELEMENTS.has(dataItem.elementId)}
				<Teams {dataItem} {defaultPreview} {style} currentPlayers={elementPlayers} allPlayers={$currentPlayers} />
			{:else if STRIKING_ELEMENTS.has(dataItem.elementId)}
				<Striking {dataItem} {defaultPreview} {style} strikeState={$strikeState} />
			{:else if BINGO_ELEMENTS.has(dataItem.elementId)}
				<BingoBoard {defaultPreview} {style} session={$bingoSession} />
			{:else if IRONMAN_ELEMENTS.has(dataItem.elementId)}
				{#if dataItem.elementId === CustomElement.IronManRoster}
					<IronManRoster {defaultPreview} {style} session={$ironManSession} currentChar={$ironManCurrentChar} />
				{:else}
					<IronMan {dataItem} {defaultPreview} {style} session={$ironManSession} currentChar={$ironManCurrentChar} maxIcon={getRelativePixelSize(96, scaleH, scaleW)} />
				{/if}
			{/if}
		</div>
	{/if}
</div>

