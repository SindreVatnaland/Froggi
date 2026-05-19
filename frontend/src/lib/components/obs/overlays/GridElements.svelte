<script lang="ts">
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
		currentMatch,
		currentPlayer,
		currentPlayers,
		gameFrame,
		gameScore,
		gameSettings,
		overlays,
		postGame,
		recentGames,
		statsScene,
	} from '$lib/utils/store.svelte';
	import { page } from '$app/stores';
	import { isNil } from 'lodash';
	import { isDisallowedInjectedElement } from '$lib/utils/disallowedElements';
	import {
		CUSTOM_ELEMENTS,
		INGAME_ELEMENTS,
		MATCH_ELEMENTS,
		RECENTGAME_ELEMENTS,
		RECENTMATCH_ELEMENTS,
		RECENTMATCHSUMMARY_ELEMENTS,
		SESSION_ELEMENTS,
		SLIPPIRANK_ELEMENTS,
		STRIKING_ELEMENTS,
	} from './elementCategories';
	import Striking from './elementRender/Striking.svelte';
	import { strikeState } from '$lib/utils/store.svelte';

	export let dataItem: GridContentItem;
	export let edit: boolean = false;
	export let preview: boolean = false;
	export let boardHeight: number | undefined = undefined;
	export let boardWidth: number | undefined = undefined;

	$: overlayId = $page.params.overlay;

	$: isInjected = Boolean($page.url.searchParams.get('isInjected'));
	$: isUsingDisallowedInjectedElement = isDisallowedInjectedElement(dataItem.elementId);
	$: shouldPreview = !isInjected || (isInjected && !isUsingDisallowedInjectedElement);

	let div: HTMLElement;
	$: boardWidth = div?.clientWidth ?? 0;
	$: boardHeight = div?.clientHeight ?? 0;
	let innerWidth = 0;
	let innerHeight = 0;

	$: defaultPreview = edit || preview;

	$: style = {} as GridContentItemStyle;

	$: innerWidth,
		(style.classValue = Object.entries(dataItem?.data.class ?? {})
			.map(([_, value]) => `${value}`)
			.join(' '));

	$: innerWidth,
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
				innerHeight,
				innerWidth,
			)}${value.slice(-9)}`,
		];
	};

	const getFont = (font: Font | undefined) => {
		if (isNil($overlays[overlayId])) return;
		if (font?.family === 'default') {
			if ($overlays[overlayId][$statsScene].active)
				return $overlays[overlayId][$statsScene].font.family;
			const fallbackScene = $overlays[overlayId][$statsScene].fallback;
			return $overlays[overlayId][fallbackScene].font.family;
		}
		return font?.family;
	};

	$: shadowSizeX = getRelativePixelSize(dataItem?.data.shadow?.x, innerHeight, innerWidth);
	$: shadowSizeY = getRelativePixelSize(dataItem?.data.shadow?.y, innerHeight, innerWidth);
	$: style.shadow = `filter: drop-shadow(${shadowSizeX}px ${shadowSizeY}px ${
		(dataItem?.data.shadow.spread ?? 0) - 1
	}px ${dataItem?.data.shadow?.color ?? '#000000'});`;

	$: strokeSize = getRelativePixelSize(dataItem.data.textStroke.size, innerHeight, innerWidth);
	$: style.textStroke = `-webkit-text-stroke-width: ${strokeSize}px;
						-webkit-text-stroke-color: ${dataItem.data.textStroke.color};`;

	$: style.transform = `transform: translate(${dataItem.data.transform.translate.x ?? 0}%, ${
		dataItem.data.transform.translate.y ?? 0
	}%) scale(${dataItem.data.transform.scale}) rotate(${dataItem.data.transform.rotate ?? 0}deg);`;

	$: fontFamily = getFont(dataItem.data?.font);

	function toKebabCase(str: string) {
		return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
	}
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
	{#if div && shouldPreview}
		<div class="w-full h-full">
			{#if CUSTOM_ELEMENTS.has(dataItem.elementId)}
				<Custom {dataItem} {style} />
			{:else if INGAME_ELEMENTS.has(dataItem.elementId)}
				<InGame
					{dataItem}
					{defaultPreview}
					{style}
					gameFrame={$gameFrame}
					gameSettings={$gameSettings}
					currentPlayer={$currentPlayer}
					currentPlayers={$currentPlayers}
				/>
			{:else if MATCH_ELEMENTS.has(dataItem.elementId)}
				<Match
					{dataItem}
					{defaultPreview}
					{style}
					gameScore={$gameScore}
					gameSettings={$gameSettings}
					currentPlayers={$currentPlayers}
				/>
			{:else if RECENTGAME_ELEMENTS.has(dataItem.elementId)}
				<RecentGame
					{dataItem}
					{defaultPreview}
					{style}
					currentPlayer={$currentPlayer}
					postGame={$postGame}
				/>
			{:else if RECENTMATCH_ELEMENTS.has(dataItem.elementId)}
				<RecentMatch
					{dataItem}
					{defaultPreview}
					{style}
					matchStats={$currentMatch}
					currentPlayer={$currentPlayer}
				/>
			{:else if RECENTMATCHSUMMARY_ELEMENTS.has(dataItem.elementId)}
				<RecentMatchSummary
					{dataItem}
					{defaultPreview}
					{style}
					recentGames={$recentGames}
					currentPlayers={$currentPlayers}
				/>
			{:else if SLIPPIRANK_ELEMENTS.has(dataItem.elementId)}
				<SlippiRank
					{dataItem}
					{defaultPreview}
					{style}
					currentPlayer={$currentPlayer}
					currentPlayers={$currentPlayers}
				/>
			{:else if SESSION_ELEMENTS.has(dataItem.elementId)}
				<Session {dataItem} {defaultPreview} {style} />
			{:else if STRIKING_ELEMENTS.has(dataItem.elementId)}
				<Striking {dataItem} {defaultPreview} {style} strikeState={$strikeState} />
			{/if}
		</div>
	{/if}
</div>

