<script lang="ts">
	/**
	 * Shareable live game view (SlippiLab-style): live-camera gameplay with a fixed
	 * HUD (names, percents, stocks, timer). Read-only — viewers can watch without
	 * the host password. Meant to be opened via a shared ngrok/Tailscale URL.
	 */
	import { gameFrame, gameSettings, currentPlayers, gameScore, gameState } from '$lib/utils/store.svelte';
	import { InGameState } from '$lib/models/enum';
	import GameStateRender from '$lib/components/viewer/GameStateRender.svelte';
	import LiveHud from '$lib/components/viewer/LiveHud.svelte';
	import SlippiAd from '$lib/components/SlippiAd.svelte';

	$: frame = $gameFrame;
	$: settings = $gameSettings;
	// Only show gameplay while a game is actually live — once it ends/closes,
	// fall back to the waiting screen instead of freezing on the last frame.
	$: gameActive = $gameState === InGameState.Running || $gameState === InGameState.Paused;
	$: hasGame = gameActive && settings?.stageId != null && !!frame?.players;

	$: p1Index = $currentPlayers?.[0]?.playerIndex ?? 0;
	$: p2Index = $currentPlayers?.[1]?.playerIndex ?? 1;
	$: p1Name = $currentPlayers?.[0]?.displayName || 'Player 1';
	$: p2Name = $currentPlayers?.[1]?.displayName || 'Player 2';
</script>

<main class="live-root">
	{#if hasGame}
		<div class="live-stage">
			<GameStateRender {settings} {frame} camera="live" />
		</div>
		<LiveHud {settings} {frame} {p1Name} {p2Name} {p1Index} {p2Index} score={$gameScore} />
	{:else}
		<div class="live-idle">
			<img src="/icon.png" alt="Froggi" class="idle-icon" />
			<p class="idle-title">Waiting for a live game…</p>
			<p class="idle-sub">This page shows the host's live game as it happens.</p>
			<div class="idle-ad"><SlippiAd compact /></div>
		</div>
	{/if}
</main>

<style>
	.live-root { position: fixed; inset: 0; background: #0b0e13; overflow: hidden; }
	.live-stage { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
	.live-idle {
		position: absolute; inset: 0; display: flex; flex-direction: column;
		align-items: center; justify-content: center; gap: 1rem; color: #cbd5e1;
	}
	.idle-icon { width: 72px; height: 72px; opacity: 0.9; }
	.idle-title { font-size: 1.2rem; font-weight: 700; }
	.idle-sub { font-size: 0.85rem; opacity: 0.5; }
	.idle-ad { margin-top: 1rem; width: min(90vw, 420px); }
</style>
