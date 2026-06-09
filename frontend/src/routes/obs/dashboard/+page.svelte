<script lang="ts">
	import { BestOf, ConnectionState, InGameState } from '$lib/models/enum';
	import { CommandType } from '$lib/models/types/commandTypes';
	import ReplayBufferHandler from '$lib/components/dashboard/ReplayBufferHandler.svelte';
	import ScoreUpdateModal from '$lib/components/dashboard/Modals/ScoreUpdateModal.svelte';
	import TagUpdateModal from '$lib/components/dashboard/Modals/TagUpdateModal.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import SliderInput from '$lib/components/input/SliderInput.svelte';
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { goto } from '$app/navigation';
	import ObsIntegration from '$lib/components/obs/ObsIntegration.svelte';
	import LiveShareCard from '$lib/components/LiveShareCard.svelte';
	import {
		controller,
		currentPlayers,
		electronEmitter,
		gameFrame,
		gameScore,
		gameSettings,
		gameState,
		isElectron,
		obsConnection,
		obsPreviewFrame,
		obsProcessStatus,
		recentGames,
		sceneSwitch,
		strikeState,
		tailscaleStatus,
		ngrokStatus,
		urls,
		remoteAccess,
	} from '$lib/utils/store.svelte';
	// @ts-ignore
	import QrCode from 'svelte-qrcode';
	import { STAGE_DATA } from '$lib/models/constants/stageData';
	import { getWinnerIndex } from '$lib/utils/gamePredicates';

	let isScoreModalOpen = false;
	let isTagModalOpen = false;
	let isResetModalOpen = false;
	let isBoConfirmOpen = false;
	let pendingBo: BestOf | null = null;
	let backdropMousedownSelf = false;
	let copiedIdx: number | null = null;
	let obsPreviewEnabled = false;

	const toggleObsPreview = () => {
		obsPreviewEnabled = !obsPreviewEnabled;
		$electronEmitter.emit('OBSPreviewToggle', obsPreviewEnabled);
	};

	$: p1 = $currentPlayers?.at(0);
	$: p2 = $currentPlayers?.at(1);
	$: p1Name = p1?.displayName?.length ? p1.displayName : 'Player 1';
	$: p2Name = p2?.displayName?.length ? p2.displayName : 'Player 2';
	$: score0 = $gameScore?.at(0) ?? 0;
	$: score1 = $gameScore?.at(1) ?? 0;
	$: bestOf = $gameSettings?.matchInfo?.bestOf ?? BestOf.BestOf3;
	$: obsConnected = $obsConnection?.state === ConnectionState.Connected;
	$: obsWebsocketDisabled = $obsProcessStatus?.running && $obsProcessStatus?.websocketEnabled === false;
	$: isLive = $gameState !== InGameState.Inactive;

	$: p1Idx = p1?.playerIndex ?? 0;
	$: p2Idx = p2?.playerIndex ?? 1;
	$: p1Frame = $gameFrame?.players?.[p1Idx]?.post;
	$: p2Frame = $gameFrame?.players?.[p2Idx]?.post;
	$: p1Stocks = p1Frame?.stocksRemaining ?? 0;
	$: p2Stocks = p2Frame?.stocksRemaining ?? 0;
	$: p1Percent = Math.floor(p1Frame?.percent ?? 0);
	$: p2Percent = Math.floor(p2Frame?.percent ?? 0);
	$: p1CharId = $gameSettings?.players?.[p1Idx]?.characterId ?? 0;
	$: p2CharId = $gameSettings?.players?.[p2Idx]?.characterId ?? 0;
	$: p1ColorId = $gameSettings?.players?.[p1Idx]?.characterColor ?? 0;
	$: p2ColorId = $gameSettings?.players?.[p2Idx]?.characterColor ?? 0;
	$: stageId = $gameSettings?.stageId ?? -1;
	$: stageName = STAGE_DATA[stageId]?.name ?? '';
	$: gameNum = $recentGames.length + 1;

	// Damage shake tracking
	let p1DamageTick = 0;
	let p2DamageTick = 0;
	let p1PrevPercent = -1;
	let p2PrevPercent = -1;

	$: if (isLive && p1Percent !== p1PrevPercent) {
		if (p1PrevPercent >= 0 && p1Percent > p1PrevPercent) p1DamageTick++;
		p1PrevPercent = p1Percent;
	}
	$: if (isLive && p2Percent !== p2PrevPercent) {
		if (p2PrevPercent >= 0 && p2Percent > p2PrevPercent) p2DamageTick++;
		p2PrevPercent = p2Percent;
	}

	// OBS
	$: obsItems = $obsConnection?.items ?? [];
	$: activeItemNames = obsItems.filter((i) => i.sceneItemEnabled).map((i) => i.sourceName);
	$: obsInputs = ($obsConnection?.inputs ?? []).filter(
		(input) => activeItemNames.includes(input.inputName) || input.inputKind === 'coreaudio_input_capture'
	);

	const trySetBestOf = (v: BestOf) => {
		if (v !== bestOf) { pendingBo = v; isBoConfirmOpen = true; }
	};
	const confirmBestOf = () => {
		if (pendingBo !== null) { $electronEmitter.emit('BestOfUpdate', pendingBo); pendingBo = null; }
	};
	const handleReset = () => $electronEmitter.emit('RecentGamesReset');
	let controllerEnabled = false;
	let sceneSwitchEnabled = false;
	$: controllerEnabled = $controller.enabled ?? false;
	$: sceneSwitchEnabled = $sceneSwitch?.enabled ?? false;

	const toggleController = () => {
		$electronEmitter.emit('ControllerCommandStateToggle');
	};
	const toggleSceneSwitch = () => {
		$electronEmitter.emit('SceneSwitchCommandStateToggle');
	};
	const toggleObsItem = (sceneItemId: number, enabled: boolean) =>
		$electronEmitter.emit('ExecuteCommand', CommandType.Obs, 'SetSceneItemEnabled', {
			sceneName: $obsConnection?.scenes?.currentProgramSceneName ?? '',
			sceneItemId,
			sceneItemEnabled: enabled,
		});
	const updateVolume = (inputName: string, volume: number) =>
		$electronEmitter.emit('ExecuteCommand', CommandType.Obs, 'SetInputVolume', {
			inputName,
			inputVolumeMul: volume,
		});

	const hideOnError = (e: Event) => {
		(e.currentTarget as HTMLImageElement).style.display = 'none';
	};

	$: matchId = $gameSettings?.matchInfo?.matchId ?? '';
	$: isOnline = ngrokRunning;
	$: strikeBase = isOnline
		? ($remoteAccess.ngrok ?? $urls?.external ?? '')
		: ($remoteAccess.tailscale ?? $urls?.external ?? '');
	$: strikeP1Url = strikeBase ? `${strikeBase}/set/p/1` : '';
	$: strikeP2Url = strikeBase ? `${strikeBase}/set/p/2` : '';

	$: tsInstalled = $tailscaleStatus?.installed ?? false;
	$: tsAuthenticated = $tailscaleStatus?.authenticated ?? false;
	$: tsFunnelActive = $tailscaleStatus?.funnelActive ?? false;
	$: tsConfigured = tsInstalled && tsAuthenticated;
	$: ngrokInstalled = $ngrokStatus?.installed ?? false;
	$: ngrokAuthenticated = $ngrokStatus?.authenticated ?? false;
	$: ngrokRunning = $ngrokStatus?.running ?? false;
	$: ngrokConfigured = ngrokInstalled && ngrokAuthenticated;



	const toggleTailscaleFunnel = () => $electronEmitter.emit('TailscaleFunnel', !tsFunnelActive);
	const toggleNgrok = () => ngrokRunning
		? $electronEmitter.emit('NgrokStop')
		: $electronEmitter.emit('NgrokStart');

	let _ngrokAutoStarted = false;
	$: if ($isElectron && !_ngrokAutoStarted && ngrokConfigured && !ngrokRunning) {
		_ngrokAutoStarted = true;
		$electronEmitter.emit('NgrokStart');
	}

	let ngrokRefreshHint = false;
	let _prevMatchId = '';
	$: {
		const mid = matchId;
		if (ngrokRunning && mid && mid !== _prevMatchId && _prevMatchId !== '') {
			ngrokRefreshHint = true;
		}
		_prevMatchId = mid;
	}
	const restartNgrok = () => {
		$electronEmitter.emit('NgrokRestart');
		ngrokRefreshHint = false;
	};

	$: ngrokLoading = ngrokConfigured && ngrokRunning && !$remoteAccess.ngrok;

	$: strikePhase = $strikeState?.phase ?? 'lobby';
	$: setComplete = strikePhase === 'setComplete';
	$: setInProgress = strikePhase !== 'lobby' && strikePhase !== 'setComplete';

	$: buffActive = $obsConnection?.replayBufferState?.outputActive ?? false;

	const SET_BOS: (3 | 5)[] = [3, 5];
	let isStartSetModalOpen = false;
	let setP1Name = '';
	let setP2Name = '';
	let setBo: 3 | 5 = 3;

	const openStartSetModal = () => {
		setP1Name = p1Name;
		setP2Name = p2Name;
		setBo = 3;
		isStartSetModalOpen = true;
	};

	const confirmStartSet = () => {
		$electronEmitter.emit('StartSet', setP1Name || 'Player 1', setP2Name || 'Player 2', setBo);
		isStartSetModalOpen = false;
	};
	const enableReplayBuffer = () => {
		$electronEmitter.emit('EnableReplayBuffer');
	};
</script>

<main class="flex justify-center">
<div class="w-full max-w-3xl">
<h1 class="text-xl font-semibold text-secondary-color mb-4">Dashboard</h1>

<!-- ── Match bar ── -->
<div class="match-bar border-secondary mb-3">
	<div class="match-names">
		<div class="player-col">
			<button class="player-name" on:click={() => (isTagModalOpen = true)}>{p1Name}</button>
			{#if strikeBase}
				<div class="player-qr-group">
					<span class="qr-type-label">Strike</span>
					<button class="qr-click" title={strikeP1Url} on:click={async () => { await navigator.clipboard.writeText(strikeP1Url); copiedIdx = 11; setTimeout(() => (copiedIdx = null), 2000); }}>
						<QrCode value={strikeP1Url} size="64" color="#ffffff" background="#000000" />
						{#if copiedIdx === 11}<span class="qr-copied-overlay">✓</span>{/if}
					</button>
				</div>
			{:else if ngrokLoading}
				<div class="player-qr-group">
					<span class="qr-type-label">Strike</span>
					<div class="qr-placeholder" style="width:64px;height:64px;" />
				</div>
			{/if}
		</div>

		<button class="score-block" on:click={() => (isScoreModalOpen = true)}>
			<span class="score-num">{score0}</span>
			<span class="score-sep">—</span>
			<span class="score-num">{score1}</span>
		</button>

		<div class="player-col player-col--right">
			<button class="player-name text-right" on:click={() => (isTagModalOpen = true)}>{p2Name}</button>
			{#if strikeBase}
				<div class="player-qr-group player-qr-group--right">
					<span class="qr-type-label">Strike</span>
					<button class="qr-click" title={strikeP2Url} on:click={async () => { await navigator.clipboard.writeText(strikeP2Url); copiedIdx = 12; setTimeout(() => (copiedIdx = null), 2000); }}>
						<QrCode value={strikeP2Url} size="64" color="#ffffff" background="#000000" />
						{#if copiedIdx === 12}<span class="qr-copied-overlay">✓</span>{/if}
					</button>
				</div>
			{:else if ngrokLoading}
				<div class="player-qr-group player-qr-group--right">
					<span class="qr-type-label">Strike</span>
					<div class="qr-placeholder" style="width:64px;height:64px;" />
				</div>
			{/if}
		</div>
	</div>
	<div class="match-controls">
		<div class="ctrl-left">
			{#if $isElectron && ngrokConfigured}
				<label class="flex items-center gap-1.5">
					<span class="text-xs opacity-40">Online</span>
					<input type="checkbox" class="toggle-check" checked={isOnline} on:change={toggleNgrok} />
				</label>
			{/if}
		</div>
		<div class="ctrl-center">
			<button
				class="btn text-xs h-6 px-3 border-secondary rounded start-set-btn"
				class:start-set-btn--complete={setComplete}
				class:start-set-btn--progress={setInProgress}
				on:click={openStartSetModal}
			>Start Set</button>
		</div>
		<div class="ctrl-right">
			<button class="btn text-xs h-6 px-2.5 border-secondary rounded" on:click={() => (isScoreModalOpen = true)}>Edit Games</button>
		</div>
	</div>
	{#if !strikeBase}
		<p class="no-tunnel-hint">No tunnel — <button class="inline-link" on:click={() => goto('/settings')}>configure ngrok</button> for strike links</p>
	{/if}
</div>

<!-- ── Live game ── -->
{#if isLive}
<div class="live-arena border-secondary mb-3">

	<!-- Game info header -->
	<div class="arena-header">
		<span class="dash-label">Live — Game {gameNum}</span>
		<span class="state-pill">{$gameState}</span>
	</div>

	<!-- Main vs layout -->
	<div class="vs-layout">

		<!-- P1 side -->
		<div class="player-side player-side--left">
			<p class="side-name">{p1Name}</p>

			{#key p1DamageTick}
				<img
					class="char-render char-render--left char-shake"
					src="/image/characters/{p1CharId}/{p1ColorId}/vs-left.png"
					alt="P1 character"
					on:error={hideOnError}
				/>
			{/key}

			<div class="side-stocks">
				{#each [3, 2, 1, 0] as i}
					<img
						class="stock-icon"
						class:stock-dead={p1Stocks <= i}
						src="/image/characters/{p1CharId}/{p1ColorId}/stock.png"
						alt=""
					/>
				{/each}
			</div>
			<span class="percent" class:percent--high={p1Percent >= 100} class:percent--danger={p1Percent >= 150}>{p1Percent}%</span>
		</div>

		<!-- Center stage -->
		<div class="stage-center">
			{#if stageId}
				<img
					class="stage-img"
					src="/image/stages/{stageId}.png"
					alt={stageName}
					on:error={hideOnError}
				/>
			{/if}
			{#if stageName}
				<span class="stage-label">{stageName}</span>
			{/if}
		</div>

		<!-- P2 side -->
		<div class="player-side player-side--right">
			<p class="side-name text-right">{p2Name}</p>

			{#key p2DamageTick}
				<img
					class="char-render char-render--right char-shake"
					src="/image/characters/{p2CharId}/{p2ColorId}/vs-right.png"
					alt="P2 character"
					on:error={hideOnError}
				/>
			{/key}

			<div class="side-stocks side-stocks--right">
				{#each [0, 1, 2, 3] as i}
					<img
						class="stock-icon"
						class:stock-dead={p2Stocks <= i}
						src="/image/characters/{p2CharId}/{p2ColorId}/stock.png"
						alt=""
					/>
				{/each}
			</div>
			<span class="percent text-right" class:percent--high={p2Percent >= 100} class:percent--danger={p2Percent >= 150}>{p2Percent}%</span>
		</div>

	</div>
</div>
{/if}

<!-- ── Game history ── -->
{#if $recentGames.length > 0}
<div class="dash-card border-secondary mb-3">
	<p class="dash-label mb-2">Games</p>
	<div class="history-list">
		{#each $recentGames as game, i}
			{@const wi = getWinnerIndex(game)}
			{@const gp1c = game.settings?.players?.[p1Idx]?.characterId ?? 0}
			{@const gp2c = game.settings?.players?.[p2Idx]?.characterId ?? 0}
			{@const gp1col = game.settings?.players?.[p1Idx]?.characterColor ?? 0}
			{@const gp2col = game.settings?.players?.[p2Idx]?.characterColor ?? 0}
			{@const gStage = STAGE_DATA[game.settings?.stageId ?? -1]?.name ?? '—'}
			<div class="history-row">
				<span class="history-num">G{i + 1}</span>
				<img class="history-char" class:history-char--win={wi === p1Idx} class:history-char--lose={wi !== p1Idx}
					src="/image/characters/{gp1c}/{gp1col}/stock.png" alt="" />
				<span class="history-stage">{gStage}</span>
				<img class="history-char" class:history-char--win={wi === p2Idx} class:history-char--lose={wi !== p2Idx}
					src="/image/characters/{gp2c}/{gp2col}/stock.png" alt="" />
			</div>
		{/each}
	</div>
</div>
{/if}

<!-- ── Share live game ── -->
{#if $isElectron}
<div class="mb-3">
	<LiveShareCard />
</div>
{/if}

<!-- ── Connectivity ── -->
{#if $isElectron}
<div class="dash-card border-secondary mb-3">
	<p class="dash-label mb-3">Connectivity</p>
	<div class="flex flex-col gap-2">
		<div class="conn-row">
			<span class="conn-tag conn-tag--obs">OBS</span>
			{#if obsConnected}
				<span class="font-mono text-xs opacity-55 flex-1 truncate min-w-0">ws://localhost:{$obsConnection?.port ?? '4455'}</span>
				<button class="btn text-xs h-6 px-2 border-secondary rounded shrink-0" on:click={async () => { await navigator.clipboard.writeText(`ws://localhost:${$obsConnection?.port ?? '4455'}`); copiedIdx = 22; setTimeout(() => copiedIdx = null, 2000); }}>{copiedIdx === 22 ? '✓' : '⎘'}</button>
			{:else if $obsConnection?.state === ConnectionState.Searching}
				<span class="text-xs opacity-40 flex-1">Connecting…</span>
			{:else if obsWebsocketDisabled}
				<span class="text-xs opacity-40 flex-1">WebSocket disabled</span>
				<ObsIntegration cls="btn text-xs h-6 px-3 border-secondary rounded shrink-0" />
			{:else}
				<span class="text-xs opacity-40 flex-1">Disconnected</span>
				<ObsIntegration cls="btn text-xs h-6 px-3 border-secondary rounded shrink-0" />
			{/if}
		</div>
		<div class="conn-row">
			<span class="conn-tag conn-tag--ts">Remote Control</span>
			{#if !tsConfigured}
				<span class="text-xs opacity-40 flex-1">Not configured</span>
				<button class="btn text-xs h-6 px-2 border-secondary rounded shrink-0" on:click={() => goto('/settings')}>Set up →</button>
			{:else if tsFunnelActive && $remoteAccess.tailscale}
				<span class="font-mono text-xs opacity-55 flex-1 truncate min-w-0">{$remoteAccess.tailscale}</span>
				<button class="btn text-xs h-6 px-2 border-secondary rounded shrink-0" on:click={async () => { await navigator.clipboard.writeText($remoteAccess.tailscale ?? ''); copiedIdx = 20; setTimeout(() => copiedIdx = null, 2000); }}>{copiedIdx === 20 ? '✓' : '⎘'}</button>
				<input type="checkbox" class="toggle-check shrink-0" checked={tsFunnelActive} on:change={toggleTailscaleFunnel} />
			{:else}
				<span class="text-xs opacity-40 flex-1">Funnel off</span>
				<button class="btn text-xs h-6 px-3 border-secondary rounded shrink-0" on:click={toggleTailscaleFunnel}>Enable</button>
			{/if}
		</div>
		<div class="conn-row">
			<span class="conn-tag conn-tag--ngrok">Stage Striking</span>
			{#if !ngrokConfigured}
				<span class="text-xs opacity-40 flex-1">Not configured</span>
				<button class="btn text-xs h-6 px-2 border-secondary rounded shrink-0" on:click={() => goto('/settings')}>Set up →</button>
			{:else if ngrokRunning && $remoteAccess.ngrok}
				<span class="font-mono text-xs opacity-55 flex-1 truncate min-w-0">{$remoteAccess.ngrok}</span>
				<button class="btn text-xs h-6 px-2 border-secondary rounded shrink-0" on:click={async () => { await navigator.clipboard.writeText($remoteAccess.ngrok ?? ''); copiedIdx = 21; setTimeout(() => copiedIdx = null, 2000); }}>{copiedIdx === 21 ? '✓' : '⎘'}</button>
				<button
					class="btn text-xs h-6 px-2 border-secondary rounded shrink-0"
					class:conn-refresh-pulse={ngrokRefreshHint}
					title="Restart tunnel for a fresh URL"
					on:click={restartNgrok}
				>↻</button>
				<input type="checkbox" class="toggle-check shrink-0" checked={ngrokRunning} on:change={toggleNgrok} />
			{:else}
				<span class="text-xs opacity-40 flex-1">{ngrokRunning ? 'Starting…' : 'Stopped'}</span>
				<button class="btn text-xs h-6 px-3 border-secondary rounded shrink-0" on:click={toggleNgrok}>{ngrokRunning ? 'Stop' : 'Start'}</button>
			{/if}
		</div>
	</div>
</div>
{/if}



<!-- ── OBS Controls ── -->
<div class="obs-section" class:obs-section--offline={!obsConnected}>
	<div class="obs-header">
		<span class="dash-label">OBS Controls</span>
		<span class="status-pill" class:status-pill--ok={obsConnected} class:status-pill--err={!obsConnected}>
			OBS {obsConnected ? 'Connected' : 'Disconnected'}
		</span>
	</div>

	<div class="obs-grid">

		<div class="dash-card border-secondary">
			<p class="dash-label mb-3">Automation</p>
			<div class="flex flex-col gap-2">
				<label class="toggle-row border-secondary">
					<span class="toggle-label text-secondary-color">Controller commands</span>
					<input type="checkbox" class="toggle-check" bind:checked={controllerEnabled} on:change={toggleController} />
				</label>
				<label class="toggle-row border-secondary">
					<span class="toggle-label text-secondary-color">Auto scene switch</span>
					<input type="checkbox" class="toggle-check" bind:checked={sceneSwitchEnabled} on:change={toggleSceneSwitch} />
				</label>
			</div>
		</div>

{#if obsItems.length > 0}
		<div class="dash-card border-secondary">
			<p class="dash-label mb-3">Scene Items</p>
			<div class="flex flex-col gap-2">
				{#each obsItems as item}
					<label class="toggle-row border-secondary">
						<span class="toggle-label text-secondary-color">{item.sourceName}</span>
						<input type="checkbox" class="toggle-check" bind:checked={item.sceneItemEnabled}
							on:change={() => toggleObsItem(item.sceneItemId, item.sceneItemEnabled)} />
					</label>
				{/each}
			</div>
		</div>
		{/if}

		{#if obsInputs.length > 0}
		<div class="dash-card border-secondary">
			<p class="dash-label mb-3">Volume</p>
			<div class="flex flex-col gap-3">
				{#each obsInputs as input (input.inputName)}
					<SliderInput label={input.inputName} bind:value={input.volume.inputVolumeMul}
						on:change={(e) => updateVolume(input.inputName, e.detail)} />
				{/each}
			</div>
		</div>
		{/if}

		<div class="dash-card border-secondary">
			<p class="dash-label mb-1">Replay Buffer</p>
			{#if buffActive}
				<div class="mt-3"><ReplayBufferHandler /></div>
			{:else}
				<p class="replay-hint">Captures last 30s of gameplay</p>
				<button class="btn text-xs h-8 px-4 border-secondary rounded mt-3" on:click={enableReplayBuffer}>
					Enable 30s
				</button>
			{/if}
		</div>

	</div>
</div>

</div>
</main>

<ScoreUpdateModal bind:open={isScoreModalOpen} />
<TagUpdateModal bind:open={isTagModalOpen} />
<ConfirmModal bind:open={isBoConfirmOpen} on:confirm={confirmBestOf}>
	Change to BO{pendingBo}? Games already played may affect scoring.
</ConfirmModal>

{#if isStartSetModalOpen}
<div class="modal-backdrop" role="dialog"
	on:mousedown={(e) => { backdropMousedownSelf = e.target === e.currentTarget; }}
	on:click|self={() => { if (backdropMousedownSelf) isStartSetModalOpen = false; }}
>
	<div class="start-set-box background-primary-color border-secondary">
		<p class="start-set-title">Start Set</p>
		<div class="start-set-fields">
			<div class="start-set-field">
				<span class="start-set-hint">Player 1</span>
				<input class="start-set-input border-secondary" bind:value={setP1Name} placeholder="Tag" />
			</div>
			<div class="start-set-field">
				<span class="start-set-hint">Player 2</span>
				<input class="start-set-input border-secondary" bind:value={setP2Name} placeholder="Tag" />
			</div>
		</div>
		<div class="flex gap-2 mb-3">
			{#each SET_BOS as bo}
			<button class="btn text-xs h-7 px-4 border-secondary rounded flex-1"
				class:bo-active={setBo === bo}
				on:click={() => (setBo = bo)}>BO{bo}</button>
			{/each}
		</div>
		<div class="start-set-footer">
			<button class="btn border-secondary text-sm px-4" on:click={() => (isStartSetModalOpen = false)}>Cancel</button>
			<button class="start-set-ok" on:click={confirmStartSet}>Start</button>
		</div>
	</div>
</div>
{/if}

<style>
	/* ── Match bar ── */
	.match-bar {
		padding: 0.75rem 1rem;
		border-radius: 0.25rem;
	}

	.match-names {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: start;
		gap: 0.75rem;
		margin-bottom: 0.6rem;
	}

	.player-col {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.4rem;
	}
	.player-col--right { align-items: flex-end; }

	.player-name {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--secondary-color);
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		opacity: 0.8;
		transition: opacity 0.1s;
	}
	.player-name:hover { opacity: 1; }

	.no-tunnel-hint {
		font-size: 0.7rem;
		opacity: 0.35;
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(128,128,128,0.1);
	}

	.score-block {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0.2rem 0.5rem;
		border-radius: 0.25rem;
		transition: opacity 0.1s;
	}
	.score-block:hover { opacity: 0.7; }

	.score-num {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--secondary-color);
		line-height: 1;
	}

	.score-sep {
		font-size: 1rem;
		opacity: 0.3;
		color: var(--secondary-color);
	}

	.match-controls {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		padding-top: 0.25rem;
	}
	.ctrl-left { display: flex; align-items: center; }
	.ctrl-center { display: flex; justify-content: center; }
	.ctrl-right { display: flex; gap: 0.5rem; justify-content: flex-end; }

	.start-set-btn { transition: background 0.2s, color 0.2s, border-color 0.2s, opacity 0.2s; }
	.start-set-btn--progress { opacity: 0.45; }
	.start-set-btn--complete {
		background-color: var(--secondary-color) !important;
		color: var(--primary-color) !important;
		border-color: transparent !important;
		opacity: 1;
	}

	/* ── Live arena ── */
	.live-arena {
		padding: 0.875rem 1rem;
		border-radius: 0.25rem;
	}

	.arena-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.vs-layout {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 0.5rem;
	}

	.player-side {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.player-side--right {
		align-items: flex-end;
	}

	.side-name {
		font-size: 0.75rem;
		font-weight: 600;
		opacity: 0.6;
		color: var(--secondary-color);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.char-render {
		width: 100%;
		max-width: 130px;
		height: auto;
		object-fit: contain;
		object-position: bottom;
	}

	.char-render--right {
		align-self: flex-end;
	}

	@keyframes damage-shake {
		0%   { transform: translateX(0) rotate(0deg); }
		15%  { transform: translateX(-5px) rotate(-2deg); }
		30%  { transform: translateX(5px) rotate(2deg); }
		45%  { transform: translateX(-4px) rotate(-1deg); }
		60%  { transform: translateX(4px) rotate(1deg); }
		75%  { transform: translateX(-2px); }
		90%  { transform: translateX(2px); }
		100% { transform: translateX(0) rotate(0deg); }
	}

	.char-shake {
		animation: damage-shake 0.45s ease-out;
	}

	.side-stocks {
		display: flex;
		gap: 3px;
		align-items: center;
	}

	.side-stocks--right {
		flex-direction: row-reverse;
	}

	.stock-icon {
		width: 1.1rem;
		height: 1.1rem;
		object-fit: contain;
		transition: opacity 0.15s;
	}

	.stock-dead {
		opacity: 0.12;
	}

	.percent {
		font-size: 1.6rem;
		font-weight: 800;
		color: var(--secondary-color);
		line-height: 1;
		font-family: monospace;
	}

	.percent--high {
		color: rgb(234, 179, 8);
	}

	.percent--danger {
		color: rgb(239, 68, 68);
	}

	/* Stage center */
	.stage-center {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		min-width: 80px;
	}

	.stage-img {
		width: 100px;
		height: auto;
		border-radius: 0.25rem;
		opacity: 0.85;
		object-fit: cover;
	}

	.stage-label {
		font-size: 0.65rem;
		opacity: 0.4;
		color: var(--secondary-color);
		text-align: center;
		white-space: nowrap;
	}

	/* State pill */
	.state-pill {
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.15rem 0.45rem;
		border-radius: 999px;
		background: rgba(34, 197, 94, 0.12);
		color: rgb(34, 197, 94);
	}

	/* Game history */
	.dash-card {
		padding: 1rem 1.25rem;
		border-radius: 0.25rem;
	}

	.dash-label {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.4;
		color: var(--secondary-color);
	}

	.history-list {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.history-row {
		display: grid;
		grid-template-columns: 1.5rem 1.25rem 1fr 1.25rem;
		align-items: center;
		gap: 0.4rem;
		padding: 0.15rem 0;
	}

	.history-num {
		font-size: 0.65rem;
		font-weight: 600;
		opacity: 0.35;
		color: var(--secondary-color);
	}

	.history-char {
		width: 1.25rem;
		height: 1.25rem;
		object-fit: contain;
	}

	.history-char--win { opacity: 1; }
	.history-char--lose { opacity: 0.2; }

	.history-stage {
		font-size: 0.7rem;
		opacity: 0.45;
		color: var(--secondary-color);
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.inline-link {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		color: var(--secondary-color);
		text-decoration: underline;
		font-size: inherit;
		opacity: 0.75;
	}
	.inline-link:hover { opacity: 1; }

	.player-qr-group {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.15rem;
	}
	.player-qr-group--right { align-items: flex-end; }

	.qr-type-label {
		font-size: 0.55rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.35;
		color: var(--secondary-color);
	}

	.qr-click {
		position: relative;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		display: block;
		border-radius: 0.2rem;
		overflow: hidden;
		flex-shrink: 0;
	}
	.qr-click:hover { opacity: 0.8; }

	.qr-copied-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0,0,0,0.65);
		color: #fff;
		font-size: 1.3rem;
		font-weight: 700;
	}

	/* OBS Preview */
	.preview-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.preview-active {
		background-color: rgba(239, 68, 68, 0.15) !important;
		color: rgb(239, 68, 68) !important;
		border-color: rgba(239, 68, 68, 0.4) !important;
	}

	.preview-frame {
		width: 100%;
		aspect-ratio: 16/9;
		background: #000;
		border-radius: 0.25rem;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.preview-img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
	}

	.preview-loading {
		font-size: 0.75rem;
		opacity: 0.3;
	}

	.strike-qr-row {
		display: flex;
		gap: 1.5rem;
		margin-top: 0.75rem;
		flex-wrap: wrap;
	}
	.strike-qr-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
	}
	.qr-placeholder {
		width: 88px;
		height: 88px;
		border-radius: 0.25rem;
		background: rgba(128,128,128,0.1);
		animation: qr-pulse 1.4s ease-in-out infinite;
	}
	@keyframes qr-pulse {
		0%, 100% { opacity: 0.3; }
		50% { opacity: 0.7; }
	}

	.conn-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}
	.conn-tag {
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		padding: 0.15rem 0.45rem;
		border-radius: 999px;
		flex-shrink: 0;
		min-width: 6.5rem;
		text-align: center;
	}
	.conn-tag--ts {
		background: rgba(34, 197, 94, 0.12);
		color: rgb(34, 197, 94);
	}
	.conn-tag--ngrok {
		background: rgba(139, 92, 246, 0.15);
		color: rgb(167, 139, 250);
	}
	.conn-tag--obs {
		background: rgba(59, 130, 246, 0.15);
		color: rgb(96, 165, 250);
	}

	@keyframes refresh-pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.4; }
	}
	.conn-refresh-pulse {
		animation: refresh-pulse 1.2s ease-in-out infinite;
		color: rgb(167, 139, 250) !important;
		border-color: rgba(139, 92, 246, 0.4) !important;
	}

	/* BO active */
	.bo-active {
		background-color: var(--secondary-color) !important;
		color: var(--primary-color) !important;
		border-color: var(--secondary-color) !important;
		opacity: 1;
	}

	/* OBS section */
	.obs-section {
		transition: opacity 0.2s;
	}

	.obs-section--offline {
		opacity: 0.5;
		pointer-events: none;
	}

	.obs-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.obs-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 0.75rem;
	}

	.replay-hint {
		font-size: 0.7rem;
		opacity: 0.35;
		margin-top: 0.15rem;
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

	/* Shared toggle rows */
	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.4rem 0.6rem;
		border-radius: 0.25rem;
		cursor: pointer;
	}

	.toggle-label {
		font-size: 0.8rem;
		font-weight: 500;
	}

	.toggle-check {
		width: 0.9rem;
		height: 0.9rem;
		cursor: pointer;
		flex-shrink: 0;
	}

	/* Start set modal */
	.modal-backdrop {
		position: fixed; inset: 0;
		background: rgba(0,0,0,0.6);
		display: flex; align-items: center; justify-content: center;
		z-index: 50;
	}
	.start-set-box {
		padding: 1.25rem;
		border-radius: 0.35rem;
		width: 100%;
		max-width: 360px;
	}
	.start-set-title {
		font-size: 0.9rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
	}
	.start-set-fields {
		display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem;
	}
	.start-set-field {
		display: flex; flex-direction: column; gap: 0.2rem;
	}
	.start-set-hint {
		font-size: 0.6rem; opacity: 0.4;
		text-transform: uppercase; letter-spacing: 0.06em;
	}
	.start-set-input {
		padding: 0.35rem 0.5rem;
		background: transparent;
		border-radius: 0.25rem;
		color: var(--secondary-color);
		font-size: 0.85rem;
		outline: none;
		width: 100%;
		box-sizing: border-box;
	}
	.start-set-input:focus { opacity: 0.8; }
	.start-set-footer {
		display: flex; gap: 0.5rem; justify-content: flex-end;
	}
	.start-set-ok {
		padding: 0.4rem 1.2rem;
		background: var(--secondary-color);
		color: var(--primary-color);
		border: none; border-radius: 0.25rem;
		font-size: 0.85rem; font-weight: 600;
		cursor: pointer;
	}
	.start-set-ok:hover { opacity: 0.9; }
</style>
