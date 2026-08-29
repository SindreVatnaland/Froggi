<script lang="ts">
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { BACKEND_PORT, MCP_SERVER_PORT } from '$lib/models/const';
	import {
		authorizationKey,
		electronEmitter,
		froggiSettings,
		isAuthorized,
		isElectron,
		remoteAccess,
		tailscaleStatus,
		mcpTailscaleUrl,
		ngrokStatus,
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

	// Generate a readable random password (no ambiguous chars) and save it.
	const generateKey = () => {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
		authKey = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
		updateKey();
	};

	const saveLogs = () => $electronEmitter.emit('LogsSave');
	const copyLogs = () => $electronEmitter.emit('LogsCopy');

	let feedbackType: 'feature' | 'bug' = 'feature';
	let feedbackMessage = '';
	let includeLogs = true;
	const feedbackTypes: { value: 'feature' | 'bug'; label: string }[] = [
		{ value: 'feature', label: 'Feature request' },
		{ value: 'bug', label: 'Bug report' },
	];
	const submitFeedback = () => {
		if (!feedbackMessage.trim()) return;
		// Logs only make sense for bug reports; never attach them to feature requests.
		$electronEmitter.emit('SubmitFeedback', {
			type: feedbackType,
			message: feedbackMessage.trim(),
			includeLogs: feedbackType === 'bug' && includeLogs,
		});
		feedbackMessage = '';
	};
	const toggleBeta = () => $electronEmitter.emit('BetaOptIn', !$froggiSettings.betaOptIn);
	const setCloseAction = (action: 'minimize' | 'quit' | null) => $electronEmitter.emit('SetCloseAction', action);
	const toggleCrashReports = () => $electronEmitter.emit('SetCrashReportsEnabled', !($froggiSettings?.crashReportsEnabled === true));
	const toggleMcpRead = () => $electronEmitter.emit('SetMcpReadEnabled', !($froggiSettings?.mcpReadEnabled === true));
	const toggleMcpWrite = () => $electronEmitter.emit('SetMcpWriteEnabled', !($froggiSettings?.mcpWriteEnabled === true));
	const mcpUrl = `http://127.0.0.1:${MCP_SERVER_PORT}/mcp`;
	let mcpUrlCopied = false;
	const copyMcpUrl = async () => {
		await navigator.clipboard.writeText(mcpUrl);
		mcpUrlCopied = true;
		setTimeout(() => (mcpUrlCopied = false), 2000);
	};
	const toggleMcpTailscale = () => $electronEmitter.emit('SetMcpTailscaleEnabled', !($froggiSettings?.mcpTailscaleEnabled === true));
	let mcpTsUrlCopied = false;
	const copyMcpTsUrl = async () => {
		if (!$mcpTailscaleUrl) return;
		await navigator.clipboard.writeText($mcpTailscaleUrl);
		mcpTsUrlCopied = true;
		setTimeout(() => (mcpTsUrlCopied = false), 2000);
	};
	const closeActionOptions: { value: 'minimize' | 'quit' | null; label: string }[] = [
		{ value: null, label: 'Ask' },
		{ value: 'minimize', label: 'Minimize' },
		{ value: 'quit', label: 'Quit' },
	];

	const refreshRemoteAccess = () => $electronEmitter.emit('RemoteAccessRefresh');
	let tsCopied = false;
	let ngrokCopied = false;
	const copyTsUrl = async () => {
		if (!$remoteAccess.tailscale) return;
		await navigator.clipboard.writeText($remoteAccess.tailscale);
		tsCopied = true;
		setTimeout(() => (tsCopied = false), 2000);
	};
	const copyNgrokUrl = async () => {
		const url = $remoteAccess.ngrok;
		if (!url) return;
		await navigator.clipboard.writeText(url);
		ngrokCopied = true;
		setTimeout(() => (ngrokCopied = false), 2000);
	};

	$: tsInstalled = $tailscaleStatus?.installed ?? false;
	$: tsAuthenticated = $tailscaleStatus?.authenticated ?? false;
	$: tsFunnelActive = $tailscaleStatus?.funnelActive ?? false;

	const toggleTailscaleFunnel = () => $electronEmitter.emit('TailscaleFunnel', !tsFunnelActive);
	const tailscaleLogin = () => $electronEmitter.emit('TailscaleLogin');
	const openTailscaleDownload = () => $electronEmitter.emit('OpenUrl', 'https://tailscale.com/download');

	$: ngrokInstalled = $ngrokStatus?.installed ?? false;
	$: ngrokAuthenticated = $ngrokStatus?.authenticated ?? false;
	$: ngrokRunning = $ngrokStatus?.running ?? false;
	$: ngrokInstallMethod = $ngrokStatus?.installMethod ?? 'download';

	const INSTALL_LABELS: Record<string, string> = {
		brew: 'Install with Homebrew', winget: 'Install with winget',
		choco: 'Install with Chocolatey', scoop: 'Install with Scoop',
		snap: 'Install with Snap', download: 'Download ngrok →',
	};
	const INSTALL_CMDS: Record<string, string> = {
		brew: 'brew install ngrok/ngrok/ngrok',
		winget: 'winget install ngrok.ngrok',
		choco: 'choco install ngrok',
		scoop: 'scoop install ngrok',
		snap: 'snap install ngrok',
	};

	let ngrokAuthtoken = '';
	let ngrokEditToken = false;
	const applyAuthtoken = () => {
		if (!ngrokAuthtoken.trim()) return;
		$electronEmitter.emit('NgrokSetAuthtoken', ngrokAuthtoken.trim());
		ngrokAuthtoken = '';
		ngrokEditToken = false;
	};
	const installNgrok = () => $electronEmitter.emit('NgrokInstall');
	const toggleNgrok = () => ngrokRunning
		? $electronEmitter.emit('NgrokStop')
		: $electronEmitter.emit('NgrokStart');
	const openNgrokAuthUrl = () => $electronEmitter.emit('OpenUrl', 'https://dashboard.ngrok.com/get-started/your-authtoken');
</script>

<main class="flex justify-center">
	<div class="w-full max-w-xl">
	<h1 class="text-xl font-semibold text-secondary-color mb-6">Settings</h1>

	<!-- Authorization -->
	<section class="mb-6">
		<p class="section-label">Authorization</p>
		<div class="settings-card border-secondary mt-2">
			<div class="flex items-center justify-between mb-1">
				<span class="text-sm font-medium text-secondary-color">
					{$isElectron ? 'Create Access Key' : 'Enter Host Key'}
				</span>
				<span
					class="status-pill"
					class:status-pill--ok={$isAuthorized}
					class:status-pill--err={!$isAuthorized}
				>
					{$isAuthorized ? 'Authorized' : 'Unauthorized'}
				</span>
			</div>
			<p class="text-xs opacity-40 mb-3">
				{#if $isElectron}
					This password protects Froggi when you share a link. Anyone can <em>view</em> your
					overlays/live game, but only devices that enter this password can <em>send commands</em>
					(switch scenes, run controls, start games). Share it only with people you trust to control
					Froggi. Stage striking doesn't need it.
				{:else}
					Enter the host's password to send commands to their Froggi. You'll find it on the host
					machine under <strong>Settings → Authorization</strong>. Without it you can still view, but
					not control.
				{/if}
			</p>
			{#if $isElectron && !authKey.trim()}
				<p class="text-xs mb-3" style="color: #f59e0b;">
					⚠ No password set — remote devices can't send commands yet. Set one to enable remote control.
				</p>
			{/if}
			<div class="flex gap-2">
				<input
					class="flex-1 text-xs h-8 px-3 background-primary-color text-secondary-color border-secondary rounded"
					type="text"
					placeholder={$isElectron ? 'Create a key…' : 'Enter host key…'}
					bind:value={authKey}
					disabled={!$isElectron && $isAuthorized}
				/>
				{#if $isElectron}
					<button class="btn text-xs h-8 px-3 border-secondary rounded" on:click={generateKey} title="Generate a random password">
						Generate
					</button>
					<button class="btn text-xs h-8 px-4 border-secondary rounded" on:click={updateKey}>
						Save
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
			<div class="flex items-start justify-between gap-4 mt-3">
				<div>
					<span class="text-sm text-secondary-color">Close behavior</span>
					<p class="text-xs opacity-40 mt-0.5">What happens when you click the window's close button</p>
				</div>
				<div class="flex gap-1 shrink-0">
					{#each closeActionOptions as opt}
						<button
							class="btn text-xs h-7 px-3 border-secondary rounded"
							class:active-toggle={($froggiSettings?.closeAction ?? null) === opt.value}
							on:click={() => setCloseAction(opt.value)}
						>{opt.label}</button>
					{/each}
				</div>
			</div>
			<div class="flex items-start justify-between gap-4 mt-3">
				<div>
					<span class="text-sm text-secondary-color">Crash reports</span>
					<p class="text-xs opacity-40 mt-0.5">Send errors and recent logs to the developer (personal data removed)</p>
				</div>
				<button
					class="btn text-xs h-7 px-3 border-secondary rounded shrink-0"
					class:active-toggle={$froggiSettings?.crashReportsEnabled === true}
					on:click={toggleCrashReports}
				>
					{$froggiSettings?.crashReportsEnabled === true ? 'On' : 'Off'}
				</button>
			</div>
		</div>
	</section>

	<!-- MCP Server (Electron only) -->
	{#if $isElectron}
	<section class="mb-6">
		<p class="section-label">AI Assistant (MCP)</p>
		<div class="settings-card border-secondary mt-2 flex flex-col gap-3">
			<p class="text-xs opacity-40 leading-relaxed">
				Lets a local MCP client (Claude Desktop, Claude Code) connect to this running Froggi instance to explain setup, diagnose problems, and — if you allow it — edit overlays and OBS automation for you. Local only, never exposed over Tailscale/ngrok.
			</p>
			<div class="flex items-start justify-between gap-4">
				<div>
					<span class="text-sm text-secondary-color">Read &amp; explain</span>
					<p class="text-xs opacity-40 mt-0.5">Logs, app/OBS status, and setup guidance</p>
				</div>
				<button
					class="btn text-xs h-7 px-3 border-secondary rounded shrink-0"
					class:active-toggle={$froggiSettings?.mcpReadEnabled === true}
					on:click={toggleMcpRead}
				>
					{$froggiSettings?.mcpReadEnabled === true ? 'On' : 'Off'}
				</button>
			</div>
			<div class="flex items-start justify-between gap-4 mt-1">
				<div>
					<span class="text-sm text-secondary-color">Allow edits</span>
					<p class="text-xs opacity-40 mt-0.5">Overlay elements, OBS pairing/sources, automation rules</p>
				</div>
				<button
					class="btn text-xs h-7 px-3 border-secondary rounded shrink-0"
					class:active-toggle={$froggiSettings?.mcpWriteEnabled === true}
					on:click={toggleMcpWrite}
				>
					{$froggiSettings?.mcpWriteEnabled === true ? 'On' : 'Off'}
				</button>
			</div>
			{#if $froggiSettings?.mcpReadEnabled === true || $froggiSettings?.mcpWriteEnabled === true}
				<div class="tunnel-row mt-1">
					<span class="tunnel-label">URL</span>
					<span class="url-value font-mono flex-1 truncate">{mcpUrl}</span>
					<button class="btn text-xs h-6 px-2 border-secondary rounded shrink-0" on:click={copyMcpUrl}>{mcpUrlCopied ? 'Copied!' : 'Copy'}</button>
				</div>
				<!-- Tailscale exposure: only surfaces when MCP is on AND Tailscale is available, so
				     it stays out of sight until intentionally needed. Off by default; tailnet-only. -->
				{#if tsInstalled && tsAuthenticated}
					<div class="flex items-start justify-between gap-4 mt-2">
						<div>
							<span class="text-sm text-secondary-color">Expose over Tailscale (HTTPS)</span>
							<p class="text-xs opacity-40 mt-0.5">Reach the MCP from your own remote devices over TLS. Tailnet-only — never public.</p>
						</div>
						<button
							class="btn text-xs h-7 px-3 border-secondary rounded shrink-0"
							class:active-toggle={$froggiSettings?.mcpTailscaleEnabled === true}
							on:click={toggleMcpTailscale}
						>
							{$froggiSettings?.mcpTailscaleEnabled === true ? 'On' : 'Off'}
						</button>
					</div>
					{#if $froggiSettings?.mcpTailscaleEnabled === true && $mcpTailscaleUrl}
						<div class="tunnel-row mt-1">
							<span class="tunnel-label">HTTPS URL</span>
							<span class="url-value font-mono flex-1 truncate">{$mcpTailscaleUrl}</span>
							<button class="btn text-xs h-6 px-2 border-secondary rounded shrink-0" on:click={copyMcpTsUrl}>{mcpTsUrlCopied ? 'Copied!' : 'Copy'}</button>
						</div>
					{/if}
				{/if}
			{/if}
		</div>
	</section>
	{/if}

	<!-- Remote Access (Electron only) -->
	{#if $isElectron}
	<section class="mb-6">
		<p class="section-label">Remote Access</p>
		<div class="settings-card border-secondary mt-2">
			<p class="text-xs opacity-40 mb-3 leading-relaxed">
				Expose Froggi on port <span class="font-mono">{port}</span> so it can be reached from outside your local network. Both options work — they serve different purposes.
			</p>

			<!-- Detected URLs -->
			<div class="url-detect border-secondary mb-3">
				<div class="flex items-center justify-between mb-2">
					<span class="text-xs font-semibold text-secondary-color">Detected tunnels</span>
					<button class="btn text-xs h-7 px-3 border-secondary rounded shrink-0" on:click={refreshRemoteAccess}>↻</button>
				</div>
				<div class="tunnel-row">
					<span class="tunnel-label">Tailscale</span>
					{#if $remoteAccess.tailscale}
						<span class="url-value font-mono flex-1 truncate">{$remoteAccess.tailscale}</span>
						<button class="btn text-xs h-6 px-2 border-secondary rounded shrink-0" on:click={copyTsUrl}>{tsCopied ? 'Copied!' : 'Copy'}</button>
					{:else}
						<span class="text-xs opacity-30 flex-1">No tunnel</span>
					{/if}
				</div>
				<div class="tunnel-row">
					<span class="tunnel-label">ngrok</span>
					{#if $remoteAccess.ngrok}
						<span class="url-value font-mono flex-1 truncate">{$remoteAccess.ngrok}</span>
						<button class="btn text-xs h-6 px-2 border-secondary rounded shrink-0" on:click={copyNgrokUrl}>{ngrokCopied ? 'Copied!' : 'Copy'}</button>
					{:else}
						<span class="text-xs opacity-30 flex-1">No tunnel</span>
					{/if}
				</div>
			</div>

			<div class="remote-option border-secondary">
				<div class="flex items-center justify-between mb-2">
					<span class="text-sm font-semibold text-secondary-color">Tailscale Funnel</span>
					<span class="option-tag">Recommended</span>
				</div>
				<p class="text-xs opacity-40 mb-3 leading-relaxed">
					Gives you a stable, permanent URL that never changes. Use it for remote OBS control, stage striking, and watching overlays from your phone — even when you're on a different network than your stream PC. Set it up once and forget it.
				</p>

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
				<div class="flex items-center justify-between mb-2">
					<span class="text-sm font-semibold text-secondary-color">ngrok</span>
					<span class="option-tag option-tag--strike">Online vs Friends</span>
				</div>
				<p class="text-xs opacity-40 mb-3 leading-relaxed">
					Generates a temporary URL each time it starts. Share the connect code with a friend to play Bingo or Iron Man online — the URL expires when you stop it, so there's no persistent link to your machine between sessions.
				</p>

				<!-- Step 1: Install -->
				<div class="ts-step" class:ts-step--done={ngrokInstalled}>
					<div class="ts-step-header">
						<span class="ts-step-num" class:ts-step-num--done={ngrokInstalled}>1</span>
						<span class="ts-step-label text-secondary-color">Install ngrok</span>
						{#if $ngrokStatus !== undefined}
							<span class="ts-pill" class:ts-pill--ok={ngrokInstalled} class:ts-pill--err={!ngrokInstalled}>
								{ngrokInstalled ? 'Installed' : 'Not found'}
							</span>
						{/if}
					</div>
					{#if !ngrokInstalled && $isElectron}
						<div class="flex items-center gap-2 mt-1 flex-wrap">
							<button class="btn text-xs h-7 px-3 border-secondary rounded" on:click={installNgrok}>
								{INSTALL_LABELS[ngrokInstallMethod] ?? 'Download ngrok →'}
							</button>
							{#if INSTALL_CMDS[ngrokInstallMethod]}
								<code class="ngrok-cmd">{INSTALL_CMDS[ngrokInstallMethod]}</code>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Step 2: Authtoken -->
				<div class="ts-step" class:ts-step--done={ngrokAuthenticated} class:ts-step--disabled={!ngrokInstalled}>
					<div class="ts-step-header">
						<span class="ts-step-num" class:ts-step-num--done={ngrokAuthenticated}>2</span>
						<span class="ts-step-label text-secondary-color">Add authtoken</span>
						{#if ngrokInstalled && $ngrokStatus !== undefined}
							<span class="ts-pill" class:ts-pill--ok={ngrokAuthenticated} class:ts-pill--err={!ngrokAuthenticated}>
								{ngrokAuthenticated ? 'Configured' : 'Missing'}
							</span>
						{/if}
					</div>
					{#if ngrokInstalled && $isElectron}
						{#if ngrokAuthenticated && !ngrokEditToken}
							<div class="flex gap-2 mt-1">
								<input
									class="flex-1 text-xs h-7 px-2 background-primary-color text-secondary-color border-secondary rounded"
									type="password"
									value="placeholdertoken"
									disabled
								/>
								<button class="btn text-xs h-7 px-3 border-secondary rounded shrink-0" on:click={() => ngrokEditToken = true}>
									Edit
								</button>
							</div>
						{:else}
							<div class="flex gap-2 mt-1 flex-wrap">
								<input
									class="flex-1 text-xs h-7 px-2 background-primary-color text-secondary-color border-secondary rounded"
									type="text"
									placeholder="Paste authtoken from ngrok.com/authtokens"
									bind:value={ngrokAuthtoken}
								/>
								<button class="btn text-xs h-7 px-3 border-secondary rounded shrink-0" on:click={applyAuthtoken}>
									Apply
								</button>
								{#if ngrokEditToken}
									<button class="btn text-xs h-7 px-3 border-secondary rounded shrink-0" on:click={() => { ngrokEditToken = false; ngrokAuthtoken = ''; }}>
										Cancel
									</button>
								{/if}
							</div>
							<p class="ngrok-auth-hint">
								Get your token at <button class="ngrok-auth-link" on:click={openNgrokAuthUrl}>dashboard.ngrok.com/get-started/your-authtoken</button>
							</p>
						{/if}
					{/if}
				</div>

				<!-- Step 3: Enable tunnel -->
				<div class="ts-step" class:ts-step--disabled={!ngrokAuthenticated}>
					<div class="ts-step-header">
						<span class="ts-step-num" class:ts-step-num--done={ngrokRunning}>3</span>
						<span class="ts-step-label text-secondary-color">Enable tunnel</span>
					</div>
					{#if ngrokAuthenticated && $isElectron}
						<label class="toggle-row border-secondary mt-1">
							<span class="toggle-label text-secondary-color">Expose port {port} publicly</span>
							<input type="checkbox" class="toggle-check" checked={ngrokRunning} on:change={toggleNgrok} />
						</label>
					{/if}
				</div>
			</div>
		</div>
	</section>
	{/if}

	<!-- Diagnostics -->
	<section class="mb-6">
		<p class="section-label">Feedback</p>
		<div class="settings-card border-secondary mt-2 flex flex-col gap-3">
			<p class="text-xs opacity-40">Send a feature request or report a bug to the developer.</p>
			<div class="flex gap-1">
				{#each feedbackTypes as ft}
					<button
						class="btn text-xs h-7 px-3 border-secondary rounded"
						class:active-toggle={feedbackType === ft.value}
						on:click={() => (feedbackType = ft.value)}
					>{ft.label}</button>
				{/each}
			</div>
			<textarea
				class="feedback-input border-secondary background-primary-color text-secondary-color"
				rows="4"
				maxlength="3500"
				placeholder={feedbackType === 'bug' ? 'Describe what went wrong and how to reproduce it…' : 'Describe the feature you’d like…'}
				bind:value={feedbackMessage}
			></textarea>
			{#if feedbackType === 'bug'}
				<label class="flex items-center gap-2 text-xs opacity-70 cursor-pointer select-none">
					<input type="checkbox" bind:checked={includeLogs} />
					Include recent logs (personal data removed) — helps with debugging
				</label>
			{/if}
			<button
				class="btn text-sm h-9 px-5 border-secondary rounded self-start disabled:opacity-40"
				disabled={!feedbackMessage.trim()}
				on:click={submitFeedback}
			>Submit</button>
		</div>
	</section>

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

	.feedback-input {
		width: 100%;
		padding: 0.5rem 0.65rem;
		border-radius: 0.375rem;
		font-size: 0.85rem;
		line-height: 1.4;
		resize: vertical;
		outline: none;
		font-family: inherit;
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

	/* Selected state: solid inverted chip so it reads as "selected", not "disabled". */
	.active-toggle {
		background-color: var(--secondary-color);
		color: var(--primary-color);
		opacity: 1;
		font-weight: 700;
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

	.ngrok-cmd {
		font-family: monospace;
		font-size: 0.68rem;
		opacity: 0.75;
		background: rgba(128,128,128,0.1);
		padding: 0.15rem 0.4rem;
		border-radius: 0.2rem;
		color: var(--secondary-color);
	}

	.tunnel-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.2rem 0;
	}

	.tunnel-label {
		font-size: 0.65rem;
		font-weight: 600;
		opacity: 0.45;
		color: var(--secondary-color);
		width: 4rem;
		flex-shrink: 0;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.option-tag--strike {
		background: rgba(139, 92, 246, 0.15);
		color: rgb(167, 139, 250);
	}

	.ngrok-auth-hint {
		font-size: 0.68rem;
		opacity: 0.45;
		margin-top: 0.35rem;
	}

	.ngrok-auth-link {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		color: var(--secondary-color);
		text-decoration: underline;
		font-size: inherit;
		opacity: 0.9;
	}
	.ngrok-auth-link:hover { opacity: 1; }
</style>
