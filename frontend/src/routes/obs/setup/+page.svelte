<script lang="ts">
	/** Easy OBS connection setup: shows the live connection state and a one-click
	 * auto-configure (enables OBS's WebSocket server; OBS may need a restart). */
	import { goto } from '$app/navigation';
	import { electronEmitter, isElectron, obsConnection, obsProcessStatus } from '$lib/utils/store.svelte';
	import { ConnectionState } from '$lib/models/enum';

	$: connected = $obsConnection?.state === ConnectionState.Connected;
	$: running = $obsProcessStatus?.running ?? false;
	$: wsDisabled = running && $obsProcessStatus?.websocketEnabled === false;

	const enable = () => $electronEmitter.emit('ObsWebsocketEnable');
</script>

<main class="background-primary-color text-secondary-color flex justify-center">
	<div class="w-full max-w-lg flex flex-col gap-6">
		<button class="back-btn self-start" on:click={() => goto('/obs')}>← OBS</button>

		<div>
			<h1 class="font-bold text-3xl">Connect OBS</h1>
			<p class="text-sm opacity-50 mt-1">
				Connect Froggi to OBS to add overlays and control scenes.
			</p>
		</div>

		<!-- Connection state -->
		<div class="card">
			<span class="status-dot" class:ok={connected} class:warn={!connected && running}></span>
			<div class="flex flex-col min-w-0">
				<span class="font-semibold text-base leading-tight">
					{connected ? 'Connected to OBS' : running ? 'OBS is open — not connected yet' : 'OBS is not running'}
				</span>
				<span class="text-sm opacity-55 mt-0.5 leading-snug">
					{connected
						? 'You can add overlays and control scenes from the OBS pages.'
						: running
						? "OBS's WebSocket isn't enabled or Froggi can't reach it."
						: 'Open OBS Studio, then come back here.'}
				</span>
			</div>
		</div>

		{#if $isElectron && !connected}
			<div class="card card--stack">
				<p class="section-label">Easy setup</p>
				<p class="text-sm opacity-70 leading-relaxed">
					Froggi can configure OBS's WebSocket server for you. Click below — OBS may need to
					<strong>restart</strong> for it to take effect, after which Froggi connects automatically.
				</p>
				<button
					class="btn h-11 px-5 border-secondary rounded self-start disabled:opacity-40"
					on:click={enable}
					disabled={!running}
				>⚙ Configure OBS automatically</button>
				{#if !running}
					<p class="text-xs opacity-40">Open OBS Studio first to enable this.</p>
				{:else if wsDisabled}
					<p class="text-xs opacity-40">OBS WebSocket is currently disabled — the button will enable it.</p>
				{/if}
			</div>
		{:else if !$isElectron}
			<div class="card">
				<p class="text-sm opacity-50">OBS setup is done from the Froggi desktop app.</p>
			</div>
		{/if}
	</div>
</main>

<style>
	.card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem 1.5rem;
		border: 1px solid var(--secondary-color);
		border-radius: 0.375rem;
		background-color: var(--primary-color);
	}
	.card--stack {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.85rem;
	}
	.status-dot { width: 0.7rem; height: 0.7rem; border-radius: 50%; background: #f87171; flex-shrink: 0; }
	.status-dot.ok { background: #4ade80; box-shadow: 0 0 8px #4ade80; }
	.status-dot.warn { background: #f59e0b; }
	.section-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.4; }
	.back-btn { font-size: 0.85rem; opacity: 0.5; }
	.back-btn:hover { opacity: 0.85; }
</style>
