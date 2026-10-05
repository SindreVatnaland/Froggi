<script lang="ts">
	import SecondaryOverlay from '$lib/components/obs/overlays/SecondaryOverlay.svelte';
	import { page } from '$app/stores';
	import { LiveStatsScene } from '$lib/models/enum';
	import { previewTestAnimation } from '$lib/utils/store.svelte';
	import { HUD_REFERENCES } from '$lib/content/hudReferences';

	// ?scene=inGame pins a scene (MCP preview links), otherwise it follows the live game state.
	$: scene = $page.url.searchParams.get('scene') as LiveStatsScene | null;
	$: sceneOverride = scene && Object.values(LiveStatsScene).includes(scene) ? scene : undefined;
	// ?controls shows a button that replays every element's animations (used by the MCP preview).
	$: showControls = $page.url.searchParams.has('controls');
	// ?bg=<HUD reference id> draws that game screenshot behind the overlay (centered cover = center crop).
	$: bgRef = HUD_REFERENCES.find((r) => r.id === $page.url.searchParams.get('bg'));

	const testAnimations = () => previewTestAnimation.set({ overlayId: $page.params.overlay, n: Date.now() });
</script>

{#if bgRef}
	<div class="game-bg" style="background-image: url('/image/hud-references/{bgRef.image}');" />
{/if}
<SecondaryOverlay preview={true} {sceneOverride} />

{#if showControls}
	<button class="test-btn" on:click={testAnimations}>▶ Test animations</button>
{/if}

<style>
	.game-bg {
		position: fixed;
		inset: 0;
		background-size: cover;
		background-position: center;
	}

	.test-btn {
		position: fixed;
		right: 0.5rem;
		bottom: 0.5rem;
		z-index: 50;
		padding: 0.3rem 0.7rem;
		font: 600 0.8rem system-ui, sans-serif;
		color: #fff;
		background: rgba(0, 0, 0, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.4);
		border-radius: 0.25rem;
		cursor: pointer;
	}
</style>
