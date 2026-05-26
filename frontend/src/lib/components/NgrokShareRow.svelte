<script lang="ts">
	import { electronEmitter } from '$lib/utils/store.svelte';

	export let shareUrl: string = '';
	export let label: string = 'Share with opponent';
	export let copyLabel: string = 'Copy URL';

	let copied = false;

	async function copyUrl() {
		await navigator.clipboard.writeText(shareUrl);
		copied = true;
		setTimeout(() => { copied = false; }, 1500);
	}
</script>

<div class="share-row border-secondary">
	<div class="share-info">
		<span class="share-label">{label}</span>
		{#if shareUrl}
			<span class="share-url">{shareUrl}</span>
		{:else}
			<span class="share-empty">No ngrok URL — start ngrok in Settings → Remote Access</span>
		{/if}
	</div>
	<div class="share-actions">
		<button class="btn text-sm h-9 px-4 border-secondary rounded" on:click={() => $electronEmitter.emit('NgrokRestart')}>↻</button>
		{#if shareUrl}
			<button class="btn text-sm h-9 px-4 border-secondary rounded" on:click={copyUrl}>
				{copied ? 'Copied!' : copyLabel}
			</button>
		{/if}
	</div>
</div>

<style>
	.share-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.9rem 1.1rem;
		border-radius: 0.375rem;
		flex-wrap: wrap;
	}

	.share-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
		flex: 1;
	}

	.share-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.45;
		white-space: nowrap;
	}

	.share-url {
		font-size: 0.75rem;
		opacity: 0.6;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.share-empty {
		font-size: 0.75rem;
		opacity: 0.4;
	}

	.share-actions {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}
</style>
