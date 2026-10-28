<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import type { IronManSession } from '$lib/models/types/ironman';
	import IronManRosterGrid from '$lib/components/ironman/IronManRosterGrid.svelte';
	import TextElement from '../element/TextElement.svelte';
	import {
		fitRosterGrid,
		PREVIEW_IRONMAN_SETTINGS,
		previewIronManRoster,
		rosterProgress,
		rosterRemaining,
	} from '$lib/utils/ironmanElements';

	// Iron Man elements 9011–9018 (utils/ironmanElements.ts). Player 1 = you, Player 2 = the opponent
	// (nothing in solo). The roster shows only the characters and which are out — names, counts and the
	// progress bar are their own elements.
	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
	export let session: IronManSession | null;
	export let currentChar: { localCharId: number | null; oppCharId: number | null };
	/** Biggest icon, in px of this overlay (96 px at 1080p). */
	export let maxIcon: number;

	$: id = dataItem.elementId;
	$: player = [
		CustomElement.IronManPlayer1Roster,
		CustomElement.IronManPlayer1ProgressBar,
		CustomElement.IronManPlayer1CharacterTotal,
		CustomElement.IronManPlayer1CharactersRemaining,
	].includes(id)
		? 1
		: 2;
	$: settings = defaultPreview ? PREVIEW_IRONMAN_SETTINGS : session?.settings;
	$: variant = settings?.variant ?? 'standard';
	$: roster = defaultPreview
		? previewIronManRoster(player === 1 ? 3 : 5)
		: player === 1
			? session?.localRoster ?? null
			: session?.role !== 'solo'
				? session?.opponentRoster ?? null
				: null;
	$: total = roster?.slots.length ?? 0;
	$: pct = total ? Math.min(100, (rosterProgress(roster, variant) / total) * 100) : 0;

	const GAP = 4;
	let width = 0;
	let height = 0;
	$: fit = fitRosterGrid(total, width, height, GAP, maxIcon);
</script>

{#if settings && roster}
	{#if id === CustomElement.IronManPlayer1Roster || id === CustomElement.IronManPlayer2Roster}
		<!-- Sized from the box only (never from its content), so resizing can't feed back into itself. -->
		<div class="im-fit" bind:clientWidth={width} bind:clientHeight={height}>
			{#if fit.size > 0}
				<IronManRosterGrid
					{roster}
					{settings}
					isLocal={player === 1}
					obscured={!defaultPreview && player === 2 && settings.hideOpponent}
					{variant}
					activeGameCharId={defaultPreview ? null : player === 1 ? currentChar.localCharId : currentChar.oppCharId}
					iconSizeOverride={`${fit.size}px`}
					cols={fit.cols}
					showActiveMarker={settings.charOrder !== 'free'}
				/>
			{/if}
		</div>
	{:else if id === CustomElement.IronManPlayer1ProgressBar || id === CustomElement.IronManPlayer2ProgressBar}
		<!-- Element styling (background, border…) wraps the bar; the track itself stays visible. -->
		<div class="w-full h-full" style={style.cssValue}>
			<div class="im-pb">
				<div class="im-pb-fill" class:im-pb-fill--opp={player === 2} style="width:{pct}%" />
			</div>
		</div>
	{:else if id === CustomElement.IronManPlayer1CharacterTotal || id === CustomElement.IronManPlayer2CharacterTotal}
		<TextElement {style} {dataItem}>{total}</TextElement>
	{:else}
		<TextElement {style} {dataItem}>{rosterRemaining(roster, variant)}</TextElement>
	{/if}
{/if}

<style>
	.im-fit {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.im-pb {
		width: 100%;
		height: 100%;
		background: rgba(255, 255, 255, 0.15);
		border-radius: 999px;
		overflow: hidden;
	}

	.im-pb-fill {
		height: 100%;
		background: rgba(74, 222, 128, 0.85);
		transition: width 0.4s ease;
	}

	.im-pb-fill--opp {
		background: rgba(248, 113, 113, 0.85);
	}
</style>
