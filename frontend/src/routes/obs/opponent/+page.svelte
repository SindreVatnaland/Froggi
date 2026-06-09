<script lang="ts">
	/**
	 * Watch another player's live game (streamed over the bingo peer connection).
	 * Live-camera gameplay + HUD. `?bg=` sets the background (e.g. ?bg=%2300ff00 for
	 * a chroma-key green). Shows a waiting state when no recent frame is arriving.
	 */
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { opponentGameState } from '$lib/utils/store.svelte';
	import GameStateRender from '$lib/components/viewer/GameStateRender.svelte';
	import LiveHud from '$lib/components/viewer/LiveHud.svelte';

	$: bg = $page.url.searchParams.get('bg') || '#0b0e13';

	$: state = $opponentGameState;
	$: settings = state?.settings ?? null;
	$: frame = state?.frame ?? null;
	$: score = state?.score ?? [0, 0];
	$: p1Index = settings?.players?.[0]?.playerIndex ?? 0;
	$: p2Index = settings?.players?.[1]?.playerIndex ?? 1;

	// Treat the stream as stale (game ended/closed) if no new frame for ~2s.
	let lastUpdate = 0;
	let now = Date.now();
	$: if (state?.frame) lastUpdate = Date.now();
	let tick: ReturnType<typeof setInterval>;
	onMount(() => { tick = setInterval(() => (now = Date.now()), 500); });
	onDestroy(() => clearInterval(tick));
	$: live = !!frame?.players && settings?.stageId != null && now - lastUpdate < 2000;
</script>

<main class="opp-root" style={`background:${bg}`}>
	{#if live}
		<div class="opp-stage">
			<GameStateRender {settings} {frame} camera="live" />
		</div>
		<LiveHud {settings} {frame} {p1Index} {p2Index} {score} />
	{:else}
		<div class="opp-idle">
			<img src="/icon.png" alt="Froggi" class="opp-icon" />
			<p class="opp-title">Waiting for their game…</p>
			<p class="opp-sub">This shows your opponent's game live while they play.</p>
		</div>
	{/if}
</main>

<style>
	.opp-root { position: fixed; inset: 0; overflow: hidden; }
	.opp-stage { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
	.opp-idle {
		position: absolute; inset: 0; display: flex; flex-direction: column;
		align-items: center; justify-content: center; gap: 0.75rem; color: #cbd5e1;
	}
	.opp-icon { width: 64px; height: 64px; opacity: 0.9; }
	.opp-title { font-size: 1.1rem; font-weight: 700; }
	.opp-sub { font-size: 0.8rem; opacity: 0.5; }
</style>
