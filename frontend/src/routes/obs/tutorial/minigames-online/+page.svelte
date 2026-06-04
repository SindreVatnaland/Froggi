<script lang="ts">
	import { electronEmitter, ngrokStatus, tailscaleStatus, remoteAccess } from '$lib/utils/store.svelte';
	import { goto } from '$app/navigation';

	type Goal = 'none' | 'friends' | 'remote';
	let goal: Goal = 'none';
	let step = 0;

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

	// ── Ngrok state ──────────────────────────────────────────────────────────
	$: ngrokInstalled = $ngrokStatus?.installed ?? false;
	$: ngrokAuthenticated = $ngrokStatus?.authenticated ?? false;
	$: ngrokRunning = $ngrokStatus?.running ?? false;
	$: ngrokInstallMethod = $ngrokStatus?.installMethod ?? 'download';
	$: ngrokUrl = $remoteAccess?.ngrok ?? null;

	let ngrokAuthtoken = '';
	let ngrokEditToken = false;
	const applyAuthtoken = () => {
		if (!ngrokAuthtoken.trim()) return;
		$electronEmitter.emit('NgrokSetAuthtoken', ngrokAuthtoken.trim());
		ngrokAuthtoken = '';
		ngrokEditToken = false;
	};
	const toggleNgrok = () => ngrokRunning
		? $electronEmitter.emit('NgrokStop')
		: $electronEmitter.emit('NgrokStart');

	// ── Tailscale state ──────────────────────────────────────────────────────
	$: tsInstalled = $tailscaleStatus?.installed ?? false;
	$: tsAuthenticated = $tailscaleStatus?.authenticated ?? false;
	$: tsFunnelActive = $tailscaleStatus?.funnelActive ?? false;
	$: tsUrl = $remoteAccess?.tailscale ?? null;

	// ── Navigation ───────────────────────────────────────────────────────────
	const friendsSteps = [
		'host-only',
		'ngrok-install',
		'ngrok-token',
		'ngrok-tunnel',
		'ngrok-share',
	];
	const remoteSteps = [
		'ts-about',
		'ts-install',
		'ts-login',
		'ts-funnel',
		'ts-done',
	];

	$: steps = goal === 'friends' ? friendsSteps : goal === 'remote' ? remoteSteps : [];
	$: currentStep = steps[step] ?? '';
	$: isFirst = step === 0;
	$: isLast = step === steps.length - 1;
	$: progress = steps.length > 1 ? (step / (steps.length - 1)) * 100 : 100;

	const prev = () => { if (step > 0) step--; };
	const next = () => { if (!isLast) step++; };

	const selectGoal = (g: Goal) => { goal = g; step = 0; };

	// Auto-advance when a step becomes complete
	$: if (currentStep === 'ngrok-install' && ngrokInstalled) {}
	$: if (currentStep === 'ngrok-token' && ngrokAuthenticated) {}
	$: if (currentStep === 'ngrok-tunnel' && ngrokRunning) {}
	$: if (currentStep === 'ts-install' && tsInstalled) {}
	$: if (currentStep === 'ts-login' && tsAuthenticated) {}
	$: if (currentStep === 'ts-funnel' && tsFunnelActive) {}

	const STEP_LABELS: Record<string, string> = {
		'host-only':     'Before you start',
		'ngrok-install': 'Install ngrok',
		'ngrok-token':   'Get your auth token',
		'ngrok-tunnel':  'Start the tunnel',
		'ngrok-share':   'Share with your friend',
		'ts-about':      'What is Tailscale?',
		'ts-install':    'Install Tailscale',
		'ts-login':      'Log in',
		'ts-funnel':     'Enable Funnel',
		'ts-done':       'All done',
	};
</script>

<main class="fixed h-screen w-screen background-primary-color text-secondary-color flex justify-center">
	<div class="w-full max-w-2xl h-full flex flex-col p-6 gap-0">

		<!-- Header -->
		<div class="flex items-baseline justify-between mb-3">
			<button class="text-sm opacity-40 hover:opacity-70 transition-opacity" on:click={() => goto('/obs/tutorial')}>
				← Tutorials
			</button>
			{#if goal !== 'none'}
				<button class="text-xs opacity-30 hover:opacity-60 transition-opacity" on:click={() => { goal = 'none'; step = 0; }}>
					Change goal
				</button>
			{/if}
		</div>

		<div class="flex items-baseline justify-between mb-2">
			<h1 class="font-bold text-3xl">Play Online</h1>
			{#if goal !== 'none'}
				<span class="text-sm opacity-50 font-medium tabular-nums">{step + 1} / {steps.length}</span>
			{/if}
		</div>

		{#if goal !== 'none'}
			<!-- Progress bar -->
			<div class="progress-track mb-1">
				<div class="progress-fill" style="width: {progress}%" />
			</div>
			<p class="text-xs uppercase tracking-widest opacity-50 font-semibold mb-4 mt-2">
				{STEP_LABELS[currentStep] ?? ''}
			</p>
		{/if}

		<!-- Content -->
		<div class="flex-1 overflow-auto tutorial-content border-t border-secondary-color pt-6">

			<!-- ── Goal selector ── -->
			{#if goal === 'none'}
				<div class="flex flex-col gap-3">
					<p class="text-sm opacity-50 mb-2">What do you want to set up?</p>

					<button class="goal-card" on:click={() => selectGoal('friends')}>
						<div class="goal-icon">🎮</div>
						<div class="flex flex-col min-w-0 text-left">
							<span class="font-semibold text-base leading-tight">Play Bingo or Iron Man with a friend</span>
							<span class="text-sm opacity-55 mt-0.5 leading-snug">
								Host a game your friend can join from anywhere on the internet. You will need <b>ngrok</b> — it's free and your friend needs nothing.
							</span>
						</div>
						<span class="ml-auto opacity-30 text-lg shrink-0">→</span>
					</button>

					<button class="goal-card" on:click={() => selectGoal('remote')}>
						<div class="goal-icon">📡</div>
						<div class="flex flex-col min-w-0 text-left">
							<span class="font-semibold text-base leading-tight">Stable access and remote control</span>
							<span class="text-sm opacity-55 mt-0.5 leading-snug">
								Get a permanent URL that never changes — control Froggi from your phone, run stream-side without being at your PC, or share with a co-host.
								Uses <b>Tailscale</b>.
							</span>
						</div>
						<span class="ml-auto opacity-30 text-lg shrink-0">→</span>
					</button>
				</div>

			<!-- ── NGROK PATH ── -->
			{:else if currentStep === 'host-only'}
				<div class="step-content">
					<h2 class="step-title">Only the host needs to do this</h2>
					<p>
						Your friend (the guest) doesn't need to install anything. You'll share a short <b>connect code</b> with them, and they paste it into Froggi to join.
					</p>
					<p>
						<b>ngrok</b> creates a secure temporary tunnel from your PC to the internet so your friend can reach Froggi even if you're on different networks.
						The URL is temporary — it changes each session, which keeps it private.
					</p>
					<div class="info-box">
						<span class="info-label">What you'll set up</span>
						<ol>
							<li>Install ngrok (free)</li>
							<li>Create a free account and get an auth token</li>
							<li>Start the tunnel and share the code with your friend</li>
						</ol>
					</div>
				</div>

			{:else if currentStep === 'ngrok-install'}
				<div class="step-content">
					<h2 class="step-title">Install ngrok</h2>
					<p>ngrok is a free tool that creates a public URL for your PC. It takes about a minute to set up.</p>

					<div class="status-row">
						<span class="status-label">Install status</span>
						<span class="status-pill" class:status-ok={ngrokInstalled} class:status-err={!ngrokInstalled}>
							{ngrokInstalled ? '✓ Installed' : '✗ Not found'}
						</span>
					</div>

					{#if !ngrokInstalled}
						<div class="flex items-center gap-3 flex-wrap mt-3">
							<button class="btn text-sm h-9 px-5 border-secondary rounded" on:click={() => $electronEmitter.emit('NgrokInstall')}>
								{INSTALL_LABELS[ngrokInstallMethod] ?? 'Download ngrok →'}
							</button>
							{#if INSTALL_CMDS[ngrokInstallMethod]}
								<code class="cmd-badge">{INSTALL_CMDS[ngrokInstallMethod]}</code>
							{/if}
						</div>
						<p class="hint mt-3">After installing, click <b>Next</b> to continue — Froggi will detect it automatically.</p>
					{:else}
						<p class="success-note">ngrok is installed. You can move on.</p>
					{/if}
				</div>

			{:else if currentStep === 'ngrok-token'}
				<div class="step-content">
					<h2 class="step-title">Get your auth token</h2>
					<p>
						ngrok requires a free account and an auth token to run. The token links the tool on your PC to your account.
					</p>

					<div class="status-row">
						<span class="status-label">Token status</span>
						<span class="status-pill" class:status-ok={ngrokAuthenticated} class:status-err={!ngrokAuthenticated}>
							{ngrokAuthenticated ? '✓ Configured' : '✗ Missing'}
						</span>
					</div>

					{#if !ngrokAuthenticated || ngrokEditToken}
						<div class="flex flex-col gap-2 mt-3">
							<button class="btn text-sm h-9 px-5 border-secondary rounded w-fit" on:click={() => $electronEmitter.emit('OpenUrl', 'https://dashboard.ngrok.com/get-started/your-authtoken')}>
								Open ngrok dashboard →
							</button>
							<p class="hint">Log in or create a free account, copy your <b>authtoken</b> from the page, then paste it below.</p>
							<div class="flex gap-2 mt-1 flex-wrap">
								<input
									class="flex-1 min-w-0 text-sm h-9 px-3 background-primary-color text-secondary-color border-secondary rounded"
									style="min-width:8rem"
									type="text"
									placeholder="Paste your authtoken here…"
									bind:value={ngrokAuthtoken}
									on:keydown={(e) => e.key === 'Enter' && applyAuthtoken()}
								/>
								<button class="btn text-sm h-9 px-4 border-secondary rounded shrink-0 disabled:opacity-40" disabled={!ngrokAuthtoken.trim()} on:click={applyAuthtoken}>
									Apply
								</button>
							</div>
						</div>
					{:else}
						<p class="success-note">Auth token is configured. You can move on.</p>
						<button class="text-xs opacity-40 hover:opacity-70 mt-2" on:click={() => ngrokEditToken = true}>Change token</button>
					{/if}
				</div>

			{:else if currentStep === 'ngrok-tunnel'}
				<div class="step-content">
					<h2 class="step-title">Start the tunnel</h2>
					<p>Enable the ngrok tunnel to get a public URL. Your friend will use this to connect.</p>

					<div class="status-row">
						<span class="status-label">Tunnel</span>
						<span class="status-pill" class:status-ok={ngrokRunning} class:status-err={!ngrokRunning}>
							{ngrokRunning ? '✓ Running' : '○ Stopped'}
						</span>
					</div>

					{#if ngrokAuthenticated}
						<label class="toggle-row border-secondary mt-3">
							<span class="toggle-label text-secondary-color">Run ngrok tunnel</span>
							<input type="checkbox" class="toggle-check" checked={ngrokRunning} on:change={toggleNgrok} />
						</label>
					{/if}

					{#if ngrokRunning && ngrokUrl}
						<div class="url-display border-secondary mt-3">
							<span class="url-display-label">Your tunnel URL</span>
							<span class="url-display-value font-mono">{ngrokUrl}</span>
						</div>
						<p class="hint mt-2">Froggi automatically turns this into a share code for your friend. You don't need to copy the full URL.</p>
					{:else if !ngrokAuthenticated}
						<p class="hint mt-3">Go back and add your auth token first.</p>
					{:else}
						<p class="hint mt-3">Toggle the tunnel on to get your URL.</p>
					{/if}
				</div>

			{:else if currentStep === 'ngrok-share'}
				<div class="step-content">
					<h2 class="step-title">Share with your friend</h2>
					{#if ngrokRunning}
						<p>The tunnel is running. Here's what to do next:</p>
						<ol>
							<li>Open the <b>Minigames</b> page in Froggi</li>
							<li>Select <b>Bingo</b> or <b>Iron Man</b> and choose <b>Host</b></li>
							<li>Copy the <b>share code</b> shown on that page</li>
							<li>Send it to your friend via Discord or chat</li>
						</ol>
						<p>Your friend opens Froggi, selects the same game, chooses <b>Join</b>, and pastes the code. That's it.</p>
						<div class="info-box">
							<span class="info-label">Remember</span>
							<p>The share code changes each time you restart ngrok. Always share a fresh code at the start of each session.</p>
						</div>
					{:else}
						<p class="hint">Start the tunnel on the previous step first.</p>
						<button class="btn text-sm h-9 px-5 border-secondary rounded mt-3" on:click={() => step--}>← Go back</button>
					{/if}
				</div>

			<!-- ── TAILSCALE PATH ── -->
			{:else if currentStep === 'ts-about'}
				<div class="step-content">
					<h2 class="step-title">A permanent, stable URL</h2>
					<p>
						Unlike ngrok, your <b>Tailscale</b> URL never changes. Once set up, you can bookmark it and use it forever.
					</p>
					<p>It's ideal for:</p>
					<ul>
						<li>Controlling Froggi from your phone while away from your PC</li>
						<li>Letting a co-host follow or take over from their own device</li>
						<li>Running stage striking over the internet without reconnecting each session</li>
						<li>Watching overlays and stats from a second screen reliably</li>
					</ul>
					<div class="info-box">
						<span class="info-label">What you'll set up</span>
						<ol>
							<li>Install Tailscale (free)</li>
							<li>Log in with a free account</li>
							<li>Enable Funnel to expose Froggi publicly</li>
						</ol>
					</div>
				</div>

			{:else if currentStep === 'ts-install'}
				<div class="step-content">
					<h2 class="step-title">Install Tailscale</h2>
					<p>Tailscale is a free VPN tool that also supports public "Funnel" URLs. Download and install it for your platform.</p>

					<div class="status-row">
						<span class="status-label">Install status</span>
						<span class="status-pill" class:status-ok={tsInstalled} class:status-err={!tsInstalled}>
							{tsInstalled ? '✓ Installed' : '✗ Not found'}
						</span>
					</div>

					{#if !tsInstalled}
						<button class="btn text-sm h-9 px-5 border-secondary rounded mt-3" on:click={() => $electronEmitter.emit('OpenUrl', 'https://tailscale.com/download')}>
							Download Tailscale →
						</button>
						<p class="hint mt-3">After installing, click <b>Next</b> — Froggi detects it automatically.</p>
					{:else}
						<p class="success-note">Tailscale is installed. You can move on.</p>
					{/if}
				</div>

			{:else if currentStep === 'ts-login'}
				<div class="step-content">
					<h2 class="step-title">Log in to Tailscale</h2>
					<p>A free Tailscale account is required to use Funnel. Click the button below to log in or create an account.</p>

					<div class="status-row">
						<span class="status-label">Account</span>
						<span class="status-pill" class:status-ok={tsAuthenticated} class:status-err={!tsAuthenticated && tsInstalled}>
							{tsAuthenticated ? '✓ Connected' : tsInstalled ? '✗ Not logged in' : '—'}
						</span>
					</div>

					{#if tsInstalled && !tsAuthenticated}
						<button class="btn text-sm h-9 px-5 border-secondary rounded mt-3" on:click={() => $electronEmitter.emit('TailscaleLogin')}>
							Log in with Tailscale
						</button>
						<p class="hint mt-3">A browser window will open. Log in or create a free account, then return here.</p>
					{:else if tsAuthenticated}
						<p class="success-note">You're logged in. You can move on.</p>
					{:else}
						<p class="hint mt-3">Install Tailscale first, then come back to this step.</p>
					{/if}
				</div>

			{:else if currentStep === 'ts-funnel'}
				<div class="step-content">
					<h2 class="step-title">Enable Funnel</h2>
					<p>
						Tailscale Funnel exposes Froggi on a stable public URL. Once enabled, anyone with the URL can reach your Froggi — no tunnel restarts, no changing addresses.
					</p>

					<div class="status-row">
						<span class="status-label">Funnel</span>
						<span class="status-pill" class:status-ok={tsFunnelActive} class:status-err={!tsFunnelActive && tsAuthenticated}>
							{tsFunnelActive ? '✓ Active' : tsAuthenticated ? '○ Off' : '—'}
						</span>
					</div>

					{#if tsAuthenticated}
						<label class="toggle-row border-secondary mt-3">
							<span class="toggle-label text-secondary-color">Expose Froggi via Tailscale Funnel</span>
							<input type="checkbox" class="toggle-check" checked={tsFunnelActive} on:change={() => $electronEmitter.emit('TailscaleFunnel', !tsFunnelActive)} />
						</label>
					{/if}

					{#if tsFunnelActive && tsUrl}
						<div class="url-display border-secondary mt-3">
							<span class="url-display-label">Your permanent URL</span>
							<span class="url-display-value font-mono">{tsUrl}</span>
						</div>
						<p class="hint mt-2">Bookmark this — it never changes between sessions.</p>
					{:else if !tsAuthenticated}
						<p class="hint mt-3">Log in to Tailscale first.</p>
					{/if}
				</div>

			{:else if currentStep === 'ts-done'}
				<div class="step-content">
					<h2 class="step-title">You're set up</h2>
					{#if tsFunnelActive && tsUrl}
						<p>Your Tailscale URL is active:</p>
						<div class="url-display border-secondary">
							<span class="url-display-value font-mono">{tsUrl}</span>
						</div>
						<p>You can now:</p>
						<ul>
							<li>Open it on your phone to watch stats and overlays</li>
							<li>Share it with a co-host for remote control</li>
							<li>Use it as the join URL for online stage striking</li>
							<li>Add <code>/obs/bingo</code> or <code>/obs/ironman</code> for dedicated minigame views</li>
						</ul>
						<p class="hint">The URL stays the same every time — no need to re-share it after a restart.</p>
					{:else}
						<p class="hint">Enable Funnel on the previous step to get your URL.</p>
						<button class="btn text-sm h-9 px-5 border-secondary rounded mt-3" on:click={() => step--}>← Go back</button>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Navigation -->
		{#if goal !== 'none'}
		<div class="nav-bar">
			<button
				disabled={isFirst}
				class="btn text-sm h-9 px-4 border-secondary rounded disabled:opacity-30 shrink-0"
				on:click={prev}
			>← Prev</button>

			<div class="flex gap-1.5 flex-wrap justify-center flex-1 min-w-0">
				{#each steps as _, i}
					<button
						class="step-dot {i === step ? 'step-dot-active' : ''} {i < step ? 'step-dot-done' : ''}"
						on:click={() => step = i}
						aria-label="Go to step {i + 1}"
					/>
				{/each}
			</div>

			<button
				disabled={isLast}
				class="btn text-sm h-9 px-4 border-secondary rounded disabled:opacity-30 shrink-0"
				on:click={next}
			>Next →</button>
		</div>
		{/if}
	</div>
</main>

<style>
	.tutorial-content h2 { display: none; }

	.goal-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.1rem;
		border: 1px solid var(--secondary-color);
		border-radius: 0.5rem;
		background: transparent;
		color: var(--secondary-color);
		cursor: pointer;
		transition: background 0.15s;
		width: 100%;
		text-align: left;
	}
	.goal-card:hover {
		background: color-mix(in srgb, var(--secondary-color) 6%, transparent);
	}
	.goal-icon {
		font-size: 1.8rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.step-content {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}
	.step-title {
		font-size: 1.35rem;
		font-weight: 700;
		margin-bottom: 0.1rem;
	}
	.step-content p, .step-content li {
		font-size: 0.9rem;
		line-height: 1.6;
		opacity: 0.8;
	}
	.step-content ol, .step-content ul {
		padding-left: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.step-content ol { list-style: decimal; }
	.step-content ul { list-style: disc; }

	.status-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}
	.status-label {
		font-size: 0.78rem;
		opacity: 0.5;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.status-pill {
		font-size: 0.78rem;
		font-weight: 600;
		padding: 0.15rem 0.6rem;
		border-radius: 1rem;
		border: 1px solid var(--secondary-color);
		opacity: 0.5;
	}
	.status-pill.status-ok { opacity: 1; color: #4ade80; border-color: #4ade80; }
	.status-pill.status-err { opacity: 0.7; color: #f87171; border-color: #f87171; }

	.hint {
		font-size: 0.8rem !important;
		opacity: 0.45 !important;
		line-height: 1.5 !important;
	}
	.success-note {
		font-size: 0.85rem !important;
		color: #4ade80;
		opacity: 1 !important;
	}

	.info-box {
		border: 1px solid var(--secondary-color);
		border-radius: 0.375rem;
		padding: 0.75rem 0.9rem;
		opacity: 0.75;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-top: 0.25rem;
	}
	.info-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		opacity: 0.5;
		font-weight: 600;
	}

	.url-display {
		padding: 0.6rem 0.9rem;
		border-radius: 0.375rem;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.url-display-label {
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		opacity: 0.4;
	}
	.url-display-value {
		font-size: 0.82rem;
		word-break: break-all;
	}

	.cmd-badge {
		font-size: 0.78rem;
		background: rgba(255,255,255,0.06);
		padding: 0.2rem 0.6rem;
		border-radius: 0.25rem;
		font-family: monospace;
		opacity: 0.7;
		word-break: break-all;
		min-width: 0;
	}

	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		cursor: pointer;
	}
	.toggle-label { font-size: 0.85rem; min-width: 0; }
	.toggle-check { cursor: pointer; flex-shrink: 0; }

	input[type="text"] {
		outline: none;
		font-size: 0.82rem;
	}

	.progress-track {
		width: 100%; height: 3px;
		background: var(--secondary-color); opacity: 0.15;
		border-radius: 2px; overflow: hidden; position: relative;
	}
	.progress-fill {
		position: absolute; top: 0; left: 0; height: 100%;
		background: var(--secondary-color); opacity: 1;
		border-radius: 2px; transition: width 0.3s ease;
	}
	.nav-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding-top: 1rem;
		border-top: 1px solid var(--secondary-color);
		margin-top: 1rem;
		flex-wrap: wrap;
	}

	.step-dot {
		width: 7px; height: 7px; border-radius: 50%;
		background: var(--secondary-color); opacity: 0.2;
		border: none; padding: 0; cursor: pointer;
		transition: opacity 0.2s, transform 0.2s; flex-shrink: 0;
	}
	.step-dot:hover { opacity: 0.5; }
	.step-dot-done { opacity: 0.4; }
	.step-dot-active { opacity: 1; transform: scale(1.4); }
</style>
