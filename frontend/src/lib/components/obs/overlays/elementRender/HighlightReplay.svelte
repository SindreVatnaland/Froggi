<script lang="ts">
	/**
	 * Highlight Replay: a flow list's highlights redrawn from the game replays (no video, no OBS). The list is
	 * any List card's list by name (payload replay.list); each item needs `replay` ({{state.replay.file}}),
	 * `startFrame` and `endFrame`. Every screen plays the list in order, looping, on the shared clock (from the
	 * list's last change). Only the highlight on screen and the next two are loaded (each window once), so it
	 * starts as soon as the current one arrives. Transparent; empty while the list is empty.
	 */
	import { onDestroy, onMount } from 'svelte';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { electronEmitter, highlightFrames, replayLists, serverClockOffset } from '$lib/utils/store.svelte';
	import { framesKey, type ReplayListItem } from '$lib/utils/highlightReel';
	import { SELF, hasTriggerAnimation, triggerAnimations } from '$lib/utils/elementTriggers';
	import { toViewerState, type ViewerFrame, type ViewerPlayerState, type ViewerSettings } from '$lib/utils/viewer/renderData';
	import GameStateRender from '$lib/components/viewer/GameStateRender.svelte';
	import LiveHud from '$lib/components/viewer/LiveHud.svelte';

	export let dataItem: GridContentItem;
	export let style: GridContentItemStyle;
	/** Overlay list / thumbnail renders: nothing. */
	export let preview = false;

	const AHEAD = 2;

	$: name = (dataItem?.data?.replay?.list ?? '').trim() || 'slippiReplayHighlights';
	$: if (!preview && name) $electronEmitter.emit('ReplayListRequest', name);
	$: list = $replayLists[name];
	$: items = list?.items ?? [];
	/** An animation replays this element when what it shows changes (e.g. the default fade): then a copy
	 *  keeps its own highlight to the end and the next copy shows the next one — a clean cross-fade. */
	$: remounts = triggerAnimations(dataItem?.data).some((t) => hasTriggerAnimation(t) && (t.elementTriggers ?? []).some((e) => e.source === SELF));

	/** Frames per highlight — from the item alone, so every screen has the same timeline before anything is
	 *  loaded (Froggi trims each window to where its game ends). A shorter load holds its last frame. */
	const lengthOf = (item: ReplayListItem) => item.endFrame - item.startFrame + 1;

	/** Which highlight the shared clock is on, and the frame within it. */
	function position(): { index: number; at: number } | null {
		if (!list || !items.length) return null;
		const lengths = items.map(lengthOf);
		const total = lengths.reduce((a, b) => a + b, 0);
		if (total <= 0) return null;
		let at = Math.floor(((Date.now() + $serverClockOffset - list.changedAt) / 1000) * 60) % total;
		let index = 0;
		while (at >= lengths[index]) at -= lengths[index++];
		return { index, at };
	}

	// Ask for a window once (again after 10 s while missing — the end of a game being played may not be written yet).
	const asked = new Map<string, number>();
	function request(item: ReplayListItem) {
		const key = framesKey(item);
		if ($highlightFrames[key] || Date.now() - (asked.get(key) ?? 0) < 10000) return;
		asked.set(key, Date.now());
		$electronEmitter.emit('HighlightFramesRequest', item.replay, item.startFrame, item.endFrame);
	}

	let shownKey = '';
	let frame: ViewerFrame | null = null;
	let frames: ViewerFrame[] = [];
	let settings: ViewerSettings | null = null;
	/** The highlight this copy shows (set when it first shows one). */
	let ownKey: string | null = null;
	let heldSince: number | null = null;
	/** What the clock is on — published, so element triggers fire once per highlight. */
	let clockKey = '';
	let raf: number | null = null;
	/** A star KO twinkling on the window's last frame: the next highlight waits until it is done. */
	let twinkling = false;

	function update() {
		const pos = position();
		clockKey = pos ? framesKey(items[pos.index]) : '';
		if (!pos) return void ((frame = null), (shownKey = ''));
		for (let k = 0; k <= AHEAD && k < items.length; k++) request(items[(pos.index + k) % items.length]);
		// A copy that will be replaced keeps its own highlight on its last frame while it fades out. Not
		// replaced within 1.5 s (no animation runs here, e.g. inside Froggi's own window) → it moves on.
		if (ownKey && ownKey !== clockKey) heldSince ??= Date.now();
		if (ownKey === clockKey || (heldSince !== null && Date.now() - heldSince > 1500)) ((heldSince = null), (ownKey = null));
		if (remounts && ownKey && ownKey !== clockKey && $highlightFrames[ownKey]) {
			const own = $highlightFrames[ownKey]!;
			shownKey = ownKey;
			settings = own.settings;
			frames = own.frames;
			frame = own.frames.at(-1) ?? null;
			return;
		}
		// Hold the last frame while a star KO twinkles there (the next highlight then starts a moment in).
		if (twinkling && shownKey && shownKey !== clockKey && frames.length) return void (frame = frames.at(-1) ?? null);
		const loaded = $highlightFrames[clockKey];
		if (!loaded?.frames.length) return void ((frame = null), (shownKey = ''));
		ownKey ??= clockKey;
		shownKey = clockKey;
		settings = loaded.settings;
		frames = loaded.frames;
		// By frame number, so a frame missing from the replay doesn't shift the rest.
		const wanted = items[pos.index].startFrame + pos.at;
		frame = numbered(loaded.frames).get(wanted) ?? loaded.frames[Math.min(pos.at, loaded.frames.length - 1)];
	}
	function tick() {
		raf = requestAnimationFrame(tick);
		update();
	}
	// Also right away: a copy mounted by an animation shows the right highlight from its first render.
	$: if (!preview) list, $highlightFrames, update();

	/** Frames by frame number, per loaded window (kept while the window is). */
	const byWindow = new WeakMap<ViewerFrame[], Map<number, ViewerFrame>>();
	function numbered(list: ViewerFrame[]) {
		let map = byWindow.get(list);
		if (!map) byWindow.set(list, (map = new Map(list.map((f) => [f.frame ?? 0, f]))));
		return map;
	}
	const getStateOnFrame = (playerIndex: number, frameNumber: number): ViewerPlayerState | undefined => {
		const p = numbered(frames).get(frameNumber)?.players[playerIndex];
		return p?.post ? toViewerState(p.post, p.pre ?? undefined, frameNumber) : undefined;
	};

	let listRetry: ReturnType<typeof setInterval>;
	onMount(() => {
		if (preview) return;
		raf = requestAnimationFrame(tick);
		// The first request can go out before the connection is up — ask again every 2 s until the list arrives.
		listRetry = setInterval(() => !list && $electronEmitter.emit('ReplayListRequest', name), 2000);
	});
	onDestroy(() => {
		if (raf !== null) cancelAnimationFrame(raf);
		clearInterval(listRetry);
	});
</script>

<!-- data-trigger-value: the highlight the clock is on — element triggers (e.g. a fade) fire once per highlight. -->
<div class="replay {style.classValue}" style={`${style.cssValue}; ${dataItem?.data.advancedStyling ? dataItem?.data.css.customBox : ''}`} data-trigger-value={clockKey}>
	{#if frame && settings}
		{#key shownKey}
			<GameStateRender {settings} {frame} {getStateOnFrame} camera="live" fit="cover" lastFrame={frames.at(-1)?.frame ?? null} bind:twinkling />
		{/key}
		<!-- Context for the moment: players centred with percent + stocks, the timer and its last-5-seconds countdown -->
		<LiveHud {settings} {frame} showScore={false} showNames={false} />
	{/if}
</div>

<style>
	.replay {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
	/* Out of the flow: the game view takes the box's size and never sets it (it kept its first height on resize). */
	.replay > :global(svg) {
		position: absolute;
		inset: 0;
	}
</style>
