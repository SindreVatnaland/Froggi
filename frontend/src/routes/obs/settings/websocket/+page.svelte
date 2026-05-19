<script lang="ts">
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { ObsAuth } from '$lib/models/types/obsTypes';
	import { electronEmitter, obs, obsConnection } from '$lib/utils/store.svelte';
	import { ConnectionState } from '$lib/models/enum';
	import { cloneDeep } from 'lodash';

	const defaultAuth = { ipAddress: 'localhost', port: '4455', password: '' };

	let auth = cloneDeep(defaultAuth);

	const isValidIp = (v: string) =>
		/^(localhost|(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3})$/.test(v);
	const isValidPort = (v: string) => /^(0|[1-9]\d{0,4})$/.test(v) && Number(v) <= 65535;

	$: valid = isValidIp(auth.ipAddress) && isValidPort(auth.port) && typeof auth.password === 'string';
	$: connected = $obsConnection?.state === ConnectionState.Connected;

	const connect = () => {
		if (!valid) { notifications.danger('Invalid inputs', 2000); return; }
		$electronEmitter.emit('ObsManualConnect', auth);
	};

	const resetToDefault = () => { auth = cloneDeep(defaultAuth); };
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

	<div class="flex gap-2 mt-2">
		<button
			class="btn text-xs h-8 px-4 border-secondary rounded disabled:opacity-40"
			on:click={connect}
			disabled={!valid}
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
</style>
