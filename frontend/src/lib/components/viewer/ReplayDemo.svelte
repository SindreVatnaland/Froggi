<script lang="ts">
	/**
	 * Plays a pre-extracted replay clip (see scripts/extract-demo-replay.js) through
	 * GameStateRender at game speed. Because the whole clip is in memory it can
	 * supply full frame history (start-of-action facing, rotations) via getStateOnFrame.
	 *
	 * Reusable: dev preview uses it with controls; the landing page can drop it in
	 * with `controls={false}` for a silent autoplay loop.
	 */
	import { onMount, onDestroy } from 'svelte';
	import GameStateRender from './GameStateRender.svelte';
	import { prefetchAnimations } from '$lib/utils/viewer/animationCache';
	import {
		toViewerState,
		resolveFetchExternalId,
		type ViewerFrame,
		type ViewerSettings,
		type ViewerPlayerState,
	} from '$lib/utils/viewer/renderData';

	export let src = '/demo/sample-game.json';
	export let autoplay = true;
	export let loop = true;
	export let controls = false;
	export let camera: 'static' | 'live' = 'static';

	interface DemoData {
		source: string;
		settings: ViewerSettings;
		startFrame: number;
		frames: ViewerFrame[];
	}

	let data: DemoData | null = null;
	let index = 0;
	let playing = false;
	let frameByNumber = new Map<number, ViewerFrame>();

	let raf: number | null = null;
	let last = 0;
	let acc = 0;
	const FRAME_MS = 1000 / 60;

	const getStateOnFrame = (playerIndex: number, frameNumber: number): ViewerPlayerState | undefined => {
		const f = frameByNumber.get(frameNumber);
		const p = f?.players[playerIndex];
		return p?.post ? toViewerState(p.post, p.pre ?? undefined, frameNumber) : undefined;
	};

	function tick(now: number) {
		if (!data) return;
		if (!last) last = now;
		acc += now - last;
		last = now;
		while (acc >= FRAME_MS) {
			acc -= FRAME_MS;
			index++;
			if (index >= data.frames.length) {
				if (loop) index = 0;
				else {
					index = data.frames.length - 1;
					stop();
					return;
				}
			}
		}
		raf = requestAnimationFrame(tick);
	}

	function play() {
		if (playing || !data) return;
		playing = true;
		last = 0;
		acc = 0;
		raf = requestAnimationFrame(tick);
	}
	function stop() {
		playing = false;
		if (raf != null) cancelAnimationFrame(raf);
		raf = null;
	}
	function toggle() {
		playing ? stop() : play();
	}

	onMount(async () => {
		try {
			const res = await fetch(src);
			const json = (await res.json()) as DemoData;
			frameByNumber = new Map(json.frames.map((f) => [f.frame ?? 0, f]));
			data = json;
			prefetchAnimations(
				json.settings.players
					.filter(Boolean)
					.map((p) => resolveFetchExternalId(p!.characterId ?? 0, p!.characterId ?? 0)),
			);
			if (autoplay) play();
		} catch (err) {
			console.warn('[ReplayDemo] failed to load', src, err);
		}
	});
	onDestroy(stop);

	$: current = data?.frames[index];
</script>

<div class="replay-demo">
	<div class="replay-stage">
		{#if data && current}
			<GameStateRender settings={data.settings} frame={current} {getStateOnFrame} {camera} />
		{:else}
			<div class="replay-loading">Loading demo…</div>
		{/if}
	</div>

	{#if controls && data}
		<div class="replay-controls">
			<button class="btn text-sm h-8 px-4 border-secondary rounded" on:click={toggle}>
				{playing ? 'Pause' : 'Play'}
			</button>
			<input
				type="range"
				min="0"
				max={data.frames.length - 1}
				bind:value={index}
				on:input={stop}
				class="replay-scrub"
			/>
			<span class="replay-frame">{current?.frame ?? 0}</span>
		</div>
	{/if}
</div>

<style>
	.replay-demo { display: flex; flex-direction: column; gap: 0.6rem; width: 100%; height: 100%; }
	.replay-stage { position: relative; flex: 1; min-height: 0; }
	.replay-loading {
		display: flex; align-items: center; justify-content: center;
		width: 100%; height: 100%; opacity: 0.5; font-size: 0.85rem;
	}
	.replay-controls { display: flex; align-items: center; gap: 0.75rem; }
	.replay-scrub { flex: 1; }
	.replay-frame { font-size: 0.75rem; opacity: 0.5; min-width: 3rem; text-align: right; }
</style>
