<script lang="ts">
	import { onMount } from 'svelte';
	import { streamEmbedUrl } from '$lib/utils/streamEmbed';

	// Watch your own stream from the dashboard. Saved per device (localStorage).
	const KEY = 'froggi.dashboard.streamPreview';
	let input = '';
	let saved = '';
	let editing = false;

	onMount(() => {
		saved = localStorage.getItem(KEY) ?? '';
		input = saved;
		editing = !saved;
	});

	const save = () => {
		saved = input.trim();
		localStorage.setItem(KEY, saved);
		editing = !saved;
	};

	$: embed = typeof location === 'undefined' ? undefined : streamEmbedUrl(saved, location.hostname);
	$: draft = typeof location === 'undefined' ? undefined : streamEmbedUrl(input, location.hostname);
</script>

<div class="dash-card border-secondary stream-card">
	<div class="flex items-center justify-between mb-2">
		<p class="dash-label">Stream preview</p>
		{#if saved && !editing}
			<button class="text-xs opacity-50 hover:opacity-100" on:click={() => (editing = true)}>Change</button>
		{/if}
	</div>

	{#if editing}
		<div class="flex gap-2">
			<input
				class="stream-input border-secondary"
				placeholder="twitch.tv/you, kick:you, a YouTube live link, or any player URL"
				bind:value={input}
				on:keydown={(e) => e.key === 'Enter' && save()}
			/>
			<button class="btn text-xs h-8 px-3 border-secondary rounded shrink-0" on:click={save}>{input.trim() ? 'Show' : 'Clear'}</button>
		</div>
		{#if input.trim()}
			<p class="text-xs opacity-40 mt-1">{draft ? `Detected: ${draft.platform === 'url' ? 'web page' : draft.platform}` : 'Not a valid link'}</p>
		{/if}
	{/if}

	{#if embed && !editing}
		<div class="frame">
			<iframe src={embed.url} title="Stream preview" allow="autoplay; fullscreen; encrypted-media" allowfullscreen />
		</div>
		<p class="text-xs opacity-40 mt-1">Starts muted. Twitch only plays on secure pages or localhost.</p>
	{/if}
</div>

<style>
	.stream-card { padding: 1rem 1.25rem; border-radius: 0.25rem; }
	.dash-label { font-size: 0.7rem; text-transform: uppercase; opacity: 0.4; }
	.stream-input {
		flex: 1;
		height: 2rem;
		padding: 0 0.6rem;
		font-size: 0.8rem;
		background: transparent;
		color: var(--secondary-color);
		border-radius: 0.25rem;
		min-width: 0;
	}
	.frame {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: 0.375rem;
		overflow: hidden;
		background: #000;
	}
	.frame iframe {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
	}
</style>
