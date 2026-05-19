<script lang="ts">
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { BACKEND_PORT } from '$lib/models/const';
	import {
		authorizationKey,
		electronEmitter,
		froggiSettings,
		isAuthorized,
		isElectron,
		remoteAccess,
		tailscaleStatus,
	} from '$lib/utils/store.svelte';

	const port = BACKEND_PORT;

	let authKey: string = $authorizationKey;

	const authenticate = () => {
		localStorage.setItem('AuthorizationKey', authKey);
		authorizationKey.set(authKey);
		$electronEmitter.emit('Ping');
	};

	const updateKey = () => {
		$electronEmitter.emit('AuthorizationKeyUpdate', authKey);
		notifications.success('Authorization key updated', 1500);
	};

	const saveLogs = () => $electronEmitter.emit('LogsSave');
	const copyLogs = () => $electronEmitter.emit('LogsCopy');
	const toggleBeta = () => $electronEmitter.emit('BetaOptIn', !$froggiSettings.betaOptIn);

	const refreshRemoteAccess = () => $electronEmitter.emit('RemoteAccessRefresh');
	let urlCopied = false;
	const copyRemoteUrl = async () => {
		if (!$remoteAccess.url) return;
		await navigator.clipboard.writeText($remoteAccess.url);
		urlCopied = true;
		setTimeout(() => (urlCopied = false), 2000);
	};

	$: tsInstalled = $tailscaleStatus?.installed ?? false;
	$: tsAuthenticated = $tailscaleStatus?.authenticated ?? false;
	$: tsFunnelActive = $tailscaleStatus?.funnelActive ?? false;

	const toggleTailscaleFunnel = () => $electronEmitter.emit('TailscaleFunnel', !tsFunnelActive);
	const tailscaleLogin = () => $electronEmitter.emit('TailscaleLogin');
	const openTailscaleDownload = () => $electronEmitter.emit('OpenUrl', 'https://tailscale.com/download');
</script>

<main class="flex justify-center">
	<div class="w-full max-w-xl">
	<h1 class="text-xl font-semibold text-secondary-color mb-6">Settings</h1>

	<!-- Authorization -->
	<section class="mb-6">
		<p class="section-label">Authorization</p>
		<div class="settings-card border-secondary mt-2">
			<div class="flex items-center justify-between mb-1">
				<span class="text-sm font-medium text-secondary-color">Remote Access Key</span>
				<span
					class="status-pill"
					class:status-pill--ok={$isAuthorized}
					class:status-pill--err={!$isAuthorized}
				>
					{$isAuthorized ? 'Authorized' : 'Unauthorized'}
				</span>
			</div>
			<p class="text-xs opacity-40 mb-3">Key required for remote devices to send commands</p>
			<div class="flex gap-2">
				<input
					class="flex-1 text-xs h-8 px-3 background-primary-color text-secondary-color border-secondary rounded"
					type="text"
					placeholder="Enter key…"
					bind:value={authKey}
					disabled={!$isElectron && $isAuthorized}
				/>
				{#if $isElectron}
					<button class="btn text-xs h-8 px-4 border-secondary rounded" on:click={updateKey}>
						Update
					</button>
				{:else}
					<button
						class="btn text-xs h-8 px-4 border-secondary rounded disabled:opacity-40"
						on:click={authenticate}
						disabled={$isAuthorized}
					>
						Authenticate
					</button>
				{/if}
			</div>
		</div>
	</section>

	<!-- Updates -->
	<section class="mb-6">
		<p class="section-label">Updates</p>
		<div class="settings-card border-secondary mt-2 flex flex-col gap-3">
			<div class="flex items-center justify-between">
				<span class="text-sm text-secondary-color">Version</span>
				<span class="text-xs opacity-50 font-mono">{$froggiSettings?.version ?? '—'}</span>
			</div>
			<div class="flex items-start justify-between gap-4">
				<div>
					<span class="text-sm text-secondary-color">Beta releases</span>
					<p class="text-xs opacity-40 mt-0.5">Receive pre-release builds</p>
				</div>
				<button
					class="btn text-xs h-7 px-3 border-secondary rounded shrink-0"
					class:active-toggle={$froggiSettings?.betaOptIn}
					on:click={toggleBeta}
				>
					{$froggiSettings?.betaOptIn ? 'Opt out' : 'Opt in'}
				</button>
			</div>
		</div>
	</section>

	<!-- Remote Access (Electron only) -->
	{#if $isElectron}
	<section class="mb-6">
		<p class="section-label">Remote Access</p>
		<div class="settings-card border-secondary mt-2">
			<p class="text-xs opacity-40 mb-3 leading-relaxed">
				Share your Froggi with players over the internet. Use Tailscale or ngrok to expose port <span class="font-mono">{port}</span>.
			</p>

			<!-- Detected URL -->
			<div class="url-detect border-secondary mb-3">
				<div class="flex items-center justify-between mb-1">
					<span class="text-xs font-semibold text-secondary-color">Detected tunnel</span>
					{#if $remoteAccess.provider}
						<span class="option-tag option-tag--active">{$remoteAccess.provider}</span>
					{/if}
				</div>
				<div class="flex items-center gap-2">
					{#if $remoteAccess.url}
						<span class="url-value font-mono flex-1 truncate">{$remoteAccess.url}</span>
						<button class="btn text-xs h-7 px-3 border-secondary rounded shrink-0" on:click={copyRemoteUrl}>
							{urlCopied ? 'Copied!' : 'Copy'}
						</button>
					{:else}
						<span class="text-xs opacity-40 flex-1">No tunnel detected</span>
					{/if}
					<button class="btn text-xs h-7 px-3 border-secondary rounded shrink-0" on:click={refreshRemoteAccess}>
						↻
					</button>
				</div>
			</div>

			<div class="remote-option border-secondary">
				<div class="flex items-center justify-between mb-2">
					<span class="text-sm font-semibold text-secondary-color">Tailscale Funnel</span>
					<span class="option-tag">Recommended</span>
				</div>

				<!-- Step 1: Install -->
				<div class="ts-step" class:ts-step--done={tsInstalled}>
					<div class="ts-step-header">
						<span class="ts-step-num" class:ts-step-num--done={tsInstalled}>1</span>
						<span class="ts-step-label text-secondary-color">Install Tailscale</span>
						{#if $tailscaleStatus !== undefined}
							<span class="ts-pill" class:ts-pill--ok={tsInstalled} class:ts-pill--err={!tsInstalled}>
								{tsInstalled ? 'Installed' : 'Not found'}
							</span>
						{/if}
					</div>
					{#if !tsInstalled && $isElectron}
						<button class="btn text-xs h-7 px-3 border-secondary rounded mt-1" on:click={openTailscaleDownload}>
							Download →
						</button>
					{/if}
				</div>

				<!-- Step 2: Login -->
				<div class="ts-step" class:ts-step--done={tsAuthenticated} class:ts-step--disabled={!tsInstalled}>
					<div class="ts-step-header">
						<span class="ts-step-num" class:ts-step-num--done={tsAuthenticated}>2</span>
						<span class="ts-step-label text-secondary-color">Log in to Tailscale</span>
						{#if tsInstalled && $tailscaleStatus !== undefined}
							<span class="ts-pill" class:ts-pill--ok={tsAuthenticated} class:ts-pill--err={!tsAuthenticated}>
								{tsAuthenticated ? 'Connected' : 'Not logged in'}
							</span>
						{/if}
					</div>
					{#if tsInstalled && !tsAuthenticated && $isElectron}
						<button class="btn text-xs h-7 px-3 border-secondary rounded mt-1" on:click={tailscaleLogin}>
							Login with Tailscale
						</button>
					{/if}
				</div>

				<!-- Step 3: Funnel -->
				<div class="ts-step" class:ts-step--disabled={!tsAuthenticated}>
					<div class="ts-step-header">
						<span class="ts-step-num" class:ts-step-num--done={tsFunnelActive}>3</span>
						<span class="ts-step-label text-secondary-color">Enable Funnel</span>
					</div>
					{#if tsAuthenticated && $isElectron}
						<label class="toggle-row border-secondary mt-1">
							<span class="toggle-label text-secondary-color">Expose port {port} publicly</span>
							<input type="checkbox" class="toggle-check" checked={tsFunnelActive} on:change={toggleTailscaleFunnel} />
						</label>
					{/if}
				</div>
			</div>

			<div class="remote-option border-secondary mt-3">
				<div class="flex items-center justify-between mb-1">
					<span class="text-sm font-semibold text-secondary-color">ngrok</span>
					<span class="option-tag option-tag--alt">Alternative</span>
				</div>
				<ol class="setup-steps">
					<li>Install from <span class="font-mono">ngrok.com/download</span>, add authtoken</li>
					<li>Run: <code>ngrok http {port}</code></li>
					<li>Hit ↻ above — Froggi detects the URL automatically</li>
				</ol>
			</div>
		</div>
	</section>
	{/if}

	<!-- Diagnostics -->
	<section>
		<p class="section-label">Diagnostics</p>
		<div class="settings-card border-secondary mt-2">
			<p class="text-xs opacity-40 mb-3">Export logs for debugging or support</p>
			<div class="flex gap-2">
				<button class="btn text-xs h-8 px-4 border-secondary rounded" on:click={saveLogs}>
					Save logs
				</button>
				<button class="btn text-xs h-8 px-4 border-secondary rounded" on:click={copyLogs}>
					Copy logs
				</button>
			</div>
		</div>
	</section>
	</div>
</main>

<style>
	.section-label {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.4;
	}

	.settings-card {
		padding: 0.875rem 1rem;
		border-radius: 0.25rem;
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

	.active-toggle {
		opacity: 0.6;
	}

	.remote-option {
		padding: 0.75rem 0.875rem;
		border-radius: 0.25rem;
	}

	.option-tag {
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.15rem 0.45rem;
		border-radius: 999px;
		background: rgba(34, 197, 94, 0.12);
		color: rgb(34, 197, 94);
	}

	.option-tag--alt {
		background: rgba(148, 163, 184, 0.12);
		color: rgba(148, 163, 184, 0.8);
	}

	.setup-steps {
		list-style: decimal;
		padding-left: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin-top: 0.5rem;
	}

	.setup-steps li {
		font-size: 0.75rem;
		opacity: 0.6;
		line-height: 1.5;
	}

	.setup-steps code {
		font-family: monospace;
		font-size: 0.7rem;
		opacity: 0.9;
		background: rgba(128, 128, 128, 0.1);
		padding: 0.1rem 0.3rem;
		border-radius: 0.2rem;
	}

	.url-detect {
		padding: 0.75rem 0.875rem;
		border-radius: 0.25rem;
	}

	.url-value {
		font-size: 0.72rem;
		opacity: 0.75;
		color: var(--secondary-color);
		min-width: 0;
	}

	.option-tag--active {
		background: rgba(59, 130, 246, 0.15);
		color: rgb(96, 165, 250);
	}

	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.4rem 0.6rem;
		border-radius: 0.25rem;
		cursor: pointer;
	}

	.toggle-label { font-size: 0.8rem; font-weight: 500; }
	.toggle-check { width: 0.9rem; height: 0.9rem; cursor: pointer; flex-shrink: 0; }

	.ts-step {
		padding: 0.5rem 0;
		border-bottom: 1px solid rgba(128,128,128,0.1);
	}
	.ts-step:last-child { border-bottom: none; }
	.ts-step--disabled { opacity: 0.35; pointer-events: none; }

	.ts-step-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.ts-step-num {
		width: 1.2rem;
		height: 1.2rem;
		border-radius: 50%;
		background: rgba(128,128,128,0.15);
		color: var(--secondary-color);
		font-size: 0.6rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.ts-step-num--done {
		background: rgba(34,197,94,0.2);
		color: rgb(34,197,94);
	}

	.ts-step-label {
		font-size: 0.8rem;
		font-weight: 500;
		flex: 1;
	}

	.ts-pill {
		font-size: 0.6rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		padding: 0.1rem 0.4rem;
		border-radius: 999px;
	}
	.ts-pill--ok { background: rgba(34,197,94,0.12); color: rgb(34,197,94); }
	.ts-pill--err { background: rgba(239,68,68,0.12); color: rgb(239,68,68); }
</style>
