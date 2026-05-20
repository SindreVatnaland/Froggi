<script lang="ts">
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { electronEmitter, isElectron, obsConnection, obsProcessStatus } from '$lib/utils/store.svelte';
	import { ConnectionState } from '$lib/models/enum';
	import { cloneDeep } from 'lodash';
	import { onMount } from 'svelte';

	const defaultAuth = { ipAddress: 'localhost', port: '4455', password: '' };

	let auth = cloneDeep(defaultAuth);
	let configApplied = false;

	const isValidIp = (v: string) =>
		/^(localhost|(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3})$/.test(v);
	const isValidPort = (v: string) => /^(0|[1-9]\d{0,4})$/.test(v) && Number(v) <= 65535;

	$: valid = isValidIp(auth.ipAddress) && isValidPort(auth.port) && typeof auth.password === 'string';
	$: connected = $obsConnection?.state === ConnectionState.Connected;
	$: obsRunning = $obsProcessStatus?.running;
	$: websocketEnabled = $obsProcessStatus?.websocketEnabled;

	$: if ($obsProcessStatus?.port && !configApplied) {
		auth = {
			ipAddress: 'localhost',
			port: $obsProcessStatus.port,
			password: $obsProcessStatus.password ?? '',
		};
		configApplied = true;
	}

	onMount(() => {
		if ($isElectron) $electronEmitter.emit('ObsProcessRefresh');
	});

	const connect = () => {
		if (!valid) { notifications.danger('Invalid inputs', 2000); return; }
		$electronEmitter.emit('ObsManualConnect', auth);
	};

	const resetToDefault = () => { auth = cloneDeep(defaultAuth); configApplied = false; };
	const enableWebsocket = () => $electronEmitter.emit('ObsWebsocketEnable');
</script>

<div class="flex items-center gap-3 mb-6">
	<h1 class="text-xl font-semibold text-secondary-color">OBS WebSocket</h1>
	<span
		class="status-pill ml-auto"
		class:status-pill--ok={connected}
		class:status-pill--err={!connected}
	>
		{connected ? 'Connected' : 'Disconnected'}
	</span>
</div>

{#if $isElectron}
<div class="obs-status-row border-secondary mb-5">
	<span class="obs-status-label">OBS</span>
	{#if obsRunning === undefined || obsRunning === null}
		<span class="obs-status-val">Checking…</span>
	{:else if obsRunning}
		<span class="obs-status-val obs-status-val--ok">Running</span>
		<span class="obs-status-sep">·</span>
		<span class="obs-status-val">WebSocket</span>
		{#if websocketEnabled === true}
			<span class="obs-status-val obs-status-val--ok">Enabled</span>
		{:else if websocketEnabled === false}
			<span class="obs-status-val obs-status-val--warn">Disabled</span>
		{:else}
			<span class="obs-status-val">Unknown</span>
		{/if}
	{:else}
		<span class="obs-status-val obs-status-val--err">Not detected</span>
	{/if}
</div>
{/if}

{#if $isElectron && obsRunning && websocketEnabled === false}
<div class="enable-banner border-secondary mb-5">
	<p class="text-xs opacity-60 flex-1">OBS WebSocket is disabled. Enable it with one click, then restart OBS.</p>
	<button class="btn text-xs h-7 px-4 border-secondary rounded shrink-0" on:click={enableWebsocket}>
		Enable WebSocket
	</button>
</div>
{/if}

<div class="settings-form">
	<div class="field">
		<label class="field-label" class:field-label--valid={isValidIp(auth.ipAddress)}>
			IP Address
		</label>
		<input
			class="field-input border-secondary"
			type="text"
			placeholder="localhost"
			bind:value={auth.ipAddress}
		/>
	</div>

	<div class="field">
		<label class="field-label" class:field-label--valid={isValidPort(auth.port)}>
			Port
		</label>
		<input
			class="field-input border-secondary"
			type="text"
			placeholder="4455"
			bind:value={auth.port}
		/>
	</div>

	<div class="field">
		<label class="field-label field-label--valid">Password</label>
		<input
			class="field-input border-secondary"
			type="password"
			placeholder="Optional"
			bind:value={auth.password}
		/>
	</div>

	<div class="flex gap-2 mt-2 flex-wrap">
		<button
			class="btn text-xs h-8 px-4 border-secondary rounded disabled:opacity-40"
			on:click={connect}
			disabled={!valid || connected}
		>
			Connect
		</button>
		<button class="btn text-xs h-8 px-4 border-secondary rounded" on:click={resetToDefault}>
			Reset
		</button>
	</div>
</div>

<style>
	.settings-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 320px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.field-label {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.4;
		transition: opacity 0.15s, color 0.15s;
	}

	.field-label--valid {
		opacity: 0.7;
		color: rgb(34, 197, 94);
	}

	.field-input {
		height: 2rem;
		padding: 0 0.75rem;
		font-size: 0.8rem;
		background: transparent;
		color: var(--secondary-color);
		border-radius: 0.125rem;
		outline: none;
	}

	.status-pill {
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.2rem 0.5rem;
		border-radius: 999px;
	}

	.status-pill--ok {
		background: rgba(34, 197, 94, 0.12);
		color: rgb(34, 197, 94);
	}

	.status-pill--err {
		background: rgba(239, 68, 68, 0.12);
		color: rgb(239, 68, 68);
	}

	.obs-status-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.25rem;
		max-width: 320px;
	}

	.obs-status-label {
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: 0.4;
	}

	.obs-status-sep { opacity: 0.25; font-size: 0.75rem; }

	.obs-status-val {
		font-size: 0.75rem;
		opacity: 0.5;
	}

	.obs-status-val--ok { color: rgb(34, 197, 94); opacity: 1; }
	.obs-status-val--warn { color: rgb(234, 179, 8); opacity: 1; }
	.obs-status-val--err { color: rgb(239, 68, 68); opacity: 1; }

	.enable-banner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0.75rem;
		border-radius: 0.25rem;
		max-width: 320px;
	}
</style>
