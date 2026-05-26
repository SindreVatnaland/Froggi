<script lang="ts">
	import { fly } from 'svelte/transition';
	import { currentPlayer, dolphinState } from '$lib/utils/store.svelte';
	import { ConnectionState } from '$lib/models/enum';

	export let compact = false;
</script>

<div class="slippi-ad" class:slippi-ad--compact={compact} in:fly={{ y: 16, duration: 400, delay: 100 }}>
	{#if $dolphinState === ConnectionState.Connected && $currentPlayer?.rank?.current}
		<div class="ad-player">
			<img
				class="ad-rank-icon"
				src="/image/rank-icons/{($currentPlayer.rank.current.rank ?? 'UNRANKED').toUpperCase()}.svg"
				alt="rank"
			/>
			<div class="ad-player-info">
				<span class="ad-name">{$currentPlayer.rank.current.displayName}</span>
				<span class="ad-code">{$currentPlayer.rank.current.connectCode}</span>
				<span class="ad-rating">{$currentPlayer.rank.current.rating?.toFixed(0)} ELO</span>
			</div>
		</div>
	{:else}
		<div class="ad-idle">
			<div class="ad-dot ad-dot--pulse"></div>
			<span class="ad-waiting">Waiting for Slippi…</span>
		</div>
	{/if}
	{#if !compact}
		<div class="ad-brand">
			<span class="ad-brand-label">Powered by</span>
			<span class="ad-brand-name">Slippi</span>
		</div>
	{/if}
</div>

<style>
	.slippi-ad {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 2rem 1.5rem;
		opacity: 0.85;
	}

	.slippi-ad--compact {
		padding: 0.75rem 1rem;
		gap: 0.4rem;
	}

	.ad-player {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.ad-rank-icon {
		height: 4rem;
		width: 4rem;
		object-fit: contain;
	}

	.slippi-ad--compact .ad-rank-icon {
		height: 2.5rem;
		width: 2.5rem;
	}

	.ad-player-info {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.ad-name {
		font-size: 1.1rem;
		font-weight: 600;
	}

	.slippi-ad--compact .ad-name {
		font-size: 0.9rem;
	}

	.ad-code {
		font-size: 0.75rem;
		opacity: 0.5;
		letter-spacing: 0.05em;
	}

	.ad-rating {
		font-size: 0.75rem;
		opacity: 0.55;
	}

	.ad-idle {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.ad-waiting {
		font-size: 0.95rem;
		opacity: 0.45;
	}

	.ad-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: currentColor;
		opacity: 0.3;
	}

	.ad-dot--pulse {
		animation: dot-pulse 1.8s ease-in-out infinite;
	}

	@keyframes dot-pulse {
		0%, 100% { opacity: 0.2; transform: scale(1); }
		50% { opacity: 0.6; transform: scale(1.3); }
	}

	.ad-brand {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		opacity: 0.25;
	}

	.ad-brand-label {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.ad-brand-name {
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.04em;
	}
</style>
