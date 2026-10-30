<script lang="ts">
	/**
	 * Highlight Replay: the highlights on `key` redrawn from their game replays (no video, no OBS) — a flow's
	 * "Set replay list" (a list of highlight ids, played in order, looping) or "Set media" with a highlight.
	 * Froggi reads each highlight's frames from its .slp once (HighlightFramesRequest); every screen plays
	 * them on the shared clock. Transparent; empty while the key has nothing (or the games aren't stored yet).
	 */
	import { onDestroy, onMount } from 'svelte';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { electronEmitter, highlightFrames, highlightReels, serverClockOffset } from '$lib/utils/store.svelte';
	import { toViewerState, type ViewerFrame, type ViewerPlayerState } from '$lib/utils/viewer/renderData';
	import GameStateRender from '$lib/components/viewer/GameStateRender.svelte';

	export let dataItem: GridContentItem;
	export let style: GridContentItemStyle;
	/** Overlay list / thumbnail renders: nothing. */
	export let preview = false;

	$: key = (dataItem?.data?.video?.key ?? '').trim() || 'game';
	$: reel = $highlightReels[key] ?? null;
	$: ids = reel?.highlights ?? (reel?.highlight ? [reel.highlight] : []);

	// Ask once per id for frames this screen doesn't have.
	const asked = new Set<string>();
	$: if (!preview) for (const id of ids) {
		if ($highlightFrames[id] || asked.has(id)) continue;
		asked.add(id);
		$electronEmitter.emit('HighlightFramesRequest', id);
	}
	$: if (reel && reel.startedAt === null && ids.length && !preview) $electronEmitter.emit('HighlightReelShown', reel.key, reel.id);

	/** Highlights with frames, in list order (missing replays are skipped; still loading = wait). */
	$: loading = ids.some((id) => !(id in $highlightFrames));
	$: clips = ids.flatMap((id) => ($highlightFrames[id]?.frames.length ? [$highlightFrames[id]!] : []));
	$: byNumber = clips.map((c) => new Map(c.frames.map((f) => [f.frame ?? 0, f])));

	let index = -1;
	let frame: ViewerFrame | null = null;
	let raf: number | null = null;

	function tick() {
		raf = requestAnimationFrame(tick);
		if (!reel || reel.startedAt === null || loading || !clips.length) return void ((index = -1), (frame = null));
		const total = clips.reduce((n, c) => n + c.frames.length, 0);
		let at = Math.floor(((Date.now() + $serverClockOffset - reel.startedAt) / 1000) * 60) % total;
		let i = 0;
		while (at >= clips[i].frames.length) at -= clips[i++].frames.length;
		index = i;
		frame = clips[i].frames[at];
	}

	const getStateOnFrame = (playerIndex: number, frameNumber: number): ViewerPlayerState | undefined => {
		const p = byNumber[index]?.get(frameNumber)?.players[playerIndex];
		return p?.post ? toViewerState(p.post, p.pre ?? undefined, frameNumber) : undefined;
	};

	// Unanswered, or no replay yet (the game is stored a moment after it ends): ask again every 10 s.
	let retry: ReturnType<typeof setInterval>;
	onMount(() => {
		if (preview) return;
		raf = requestAnimationFrame(tick);
		retry = setInterval(() => {
			for (const id of ids) if (!$highlightFrames[id]) asked.delete(id);
			ids = ids;
		}, 10000);
	});
	onDestroy(() => {
		if (raf !== null) cancelAnimationFrame(raf);
		clearInterval(retry);
	});
</script>

<div class="replay {style.classValue}" style={`${style.cssValue}; ${dataItem?.data.advancedStyling ? dataItem?.data.css.customBox : ''}`} data-trigger-value={reel?.id ?? ''}>
	{#if frame && clips[index]}
		{#key clips[index].id}
			<GameStateRender settings={clips[index].settings} {frame} {getStateOnFrame} camera="live" fit="cover" />
		{/key}
	{/if}
</div>

<style>
	.replay {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
</style>
