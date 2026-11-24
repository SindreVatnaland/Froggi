<script lang="ts">
	import { electronEmitter, historyStatus } from '$lib/utils/store.svelte';
	import { onMount } from 'svelte';

	onMount(() => $electronEmitter.emit('HistoryStatusRequest'));

	$: status = $historyStatus;
	$: importing = status?.state === 'importing' || status?.state === 'paused';
	$: progress = status && status.total > 0 ? Math.min(1, status.done / status.total) : 0;
	const fmt = (n: number) => n.toLocaleString();
	// ~0.5 s per replay (slippi-js reads the whole game for its stats).
	const minutesLeft = (n: number) => (n > 120 ? ` — about ${Math.ceil((n * 0.5) / 60)} min` : '');
</script>

<!-- Game history: every replay imported into history.sqlite so the AI assistant can answer questions about your play. -->
<section class="mb-6">
	<p class="section-label">Game History</p>
	<div class="settings-card border-secondary mt-2 flex flex-col gap-3">
		<p class="text-xs opacity-40 leading-relaxed">
			Froggi reads your Slippi replays into a local game history so the AI assistant can answer questions like "my record vs ABC#123", "how is my L-cancel rate on Battlefield" or "which character do I struggle against". "Me" is the signed-in connect code{status?.me ? ` (${status.me})` : ''}.
		</p>
		<div class="flex items-center justify-between gap-4">
			<div class="min-w-0">
				<span class="text-sm text-secondary-color">{fmt(status?.games ?? 0)} games in the history</span>
				<p class="text-xs opacity-40 mt-0.5 truncate">
					{#if !status?.replayRoot}
						No Slippi replay folder found — set it in Slippi Launcher → Settings → Replays.
					{:else if status?.state === 'scanning'}
						Looking through the replay folder…
					{:else if status?.state === 'paused'}
						Paused while a game is running — {fmt(status.done)} / {fmt(status.total)}
					{:else if importing && status}
						Importing replays — {fmt(status.done)} / {fmt(status.total)}{minutesLeft(status.total - status.done)}
					{:else if status?.state === 'error'}
						{status.error ?? 'The import stopped with an error.'}
					{:else if status?.pending}
						{fmt(status.pending)} replays not imported yet{minutesLeft(status.pending)}
					{:else if status?.pending === 0}
						Up to date{status.failed ? ` — ${fmt(status.failed)} replays could not be read` : ''}
					{:else}
						Counting replays…
					{/if}
				</p>
			</div>
			{#if importing}
				<button class="btn text-xs h-7 px-3 border-secondary rounded shrink-0" on:click={() => $electronEmitter.emit('HistoryImportCancel')}>
					Cancel
				</button>
			{:else}
				<button
					class="btn text-xs h-7 px-3 border-secondary rounded shrink-0"
					disabled={!status?.replayRoot || status?.state === 'scanning' || status?.pending === 0}
					on:click={() => $electronEmitter.emit('HistoryImportStart')}
				>
					{status?.done && status.pending ? 'Resume import' : 'Import replays'}
				</button>
			{/if}
		</div>
		{#if importing && status && status.total > 0}
			<div class="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={status.total} aria-valuenow={status.done}>
				<div class="progress-fill" style="width: {progress * 100}%" />
			</div>
		{/if}
		<p class="text-xs opacity-40 leading-relaxed">
			Runs in the background and pauses while you play. Cancel any time — imported games stay and the next import picks up the rest.
		</p>
		<div class="flex items-start justify-between gap-4">
			<div>
				<span class="text-sm text-secondary-color">Add each game when it ends</span>
				<p class="text-xs opacity-40 mt-0.5">Keeps the history up to date after the first import.</p>
			</div>
			<button
				class="btn text-xs h-7 px-3 border-secondary rounded shrink-0"
				class:active-toggle={status?.importOnGameEnd !== false}
				on:click={() => $electronEmitter.emit('HistoryImportOnGameEnd', status?.importOnGameEnd === false)}
			>
				{status?.importOnGameEnd === false ? 'Off' : 'On'}
			</button>
		</div>
	</div>
</section>

<style>
	.section-label {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		opacity: 0.4;
	}
	.settings-card {
		padding: 0.875rem 1rem;
		border-radius: 0.25rem;
	}
	.progress-track {
		height: 6px;
		border-radius: 3px;
		background: color-mix(in srgb, var(--secondary-color) 15%, transparent);
		overflow: hidden;
	}
	.progress-fill {
		height: 100%;
		background: var(--secondary-color);
		transition: width 0.25s linear;
	}
	.active-toggle {
		background-color: var(--secondary-color);
		color: var(--primary-color);
	}
	button:disabled {
		opacity: 0.4;
		cursor: default;
	}
</style>
