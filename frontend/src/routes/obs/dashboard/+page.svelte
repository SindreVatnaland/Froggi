<script lang="ts">
	import { BestOf, ConnectionState, InGameState } from '$lib/models/enum';
	import { CommandType } from '$lib/models/types/commandTypes';
	import ReplayBufferHandler from '$lib/components/dashboard/ReplayBufferHandler.svelte';
	import ScoreUpdateModal from '$lib/components/dashboard/Modals/ScoreUpdateModal.svelte';
	import TagUpdateModal from '$lib/components/dashboard/Modals/TagUpdateModal.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import SliderInput from '$lib/components/input/SliderInput.svelte';
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import {
		controller,
		currentPlayers,
		electronEmitter,
		gameFrame,
		gameScore,
		gameSettings,
		gameState,
		obsConnection,
		recentGames,
		sceneSwitch,
		urls,
		remoteAccess,
	} from '$lib/utils/store.svelte';
	// @ts-ignore
	import QrCode from 'svelte-qrcode';
	import SceneSelect from '$lib/components/obs/overlays/selector/SceneSelect.svelte';
	import { STAGE_DATA } from '$lib/models/constants/stageData';
	import { getWinnerIndex } from '$lib/utils/gamePredicates';

	let isScoreModalOpen = false;
	let isTagModalOpen = false;
	let isResetModalOpen = false;
	let isBoConfirmOpen = false;
	let pendingBo: BestOf | null = null;

	$: p1 = $currentPlayers?.at(0);
	$: p2 = $currentPlayers?.at(1);
	$: p1Name = p1?.displayName?.length ? p1.displayName : 'Player 1';
	$: p2Name = p2?.displayName?.length ? p2.displayName : 'Player 2';
	$: score0 = $gameScore?.at(0) ?? 0;
	$: score1 = $gameScore?.at(1) ?? 0;
	$: bestOf = $gameSettings?.matchInfo?.bestOf ?? BestOf.BestOf3;
	$: obsConnected = $obsConnection?.state === ConnectionState.Connected;
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
		if ($recentGames.length > 0 && v !== bestOf) { pendingBo = v; isBoConfirmOpen = true; }
		else $electronEmitter.emit('BestOfUpdate', v);
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

	$: clientBase = $remoteAccess.url ?? $urls?.external ?? '';
	$: p1Url = clientBase ? `${clientBase}/client/p1` : '';
	$: p2Url = clientBase ? `${clientBase}/client/p2` : '';
</script>

<main class="flex justify-center">
<div class="w-full max-w-3xl">
<h1 class="text-xl font-semibold text-secondary-color mb-4">Dashboard</h1>

<!-- ── Match bar ── -->
<div class="match-bar border-secondary mb-3">
	<div class="match-names">
		<button class="player-name" on:click={() => (isTagModalOpen = true)}>{p1Name}</button>
		<div class="score-block">
			<span class="score-num">{score0}</span>
			<span class="score-sep">—</span>
			<span class="score-num">{score1}</span>
		</div>
		<button class="player-name text-right" on:click={() => (isTagModalOpen = true)}>{p2Name}</button>
	</div>
	<div class="match-controls">
		<div class="flex gap-1.5 flex-wrap">
			{#each Object.values(BestOf).filter((v) => typeof v === 'number') as bo}
				<button
					class="btn text-xs h-6 px-2.5 border-secondary rounded"
					class:bo-active={bestOf === bo}
					on:click={() => trySetBestOf(bo)}
				>BO{bo}</button>
			{/each}
		</div>
		<div class="flex gap-1.5 flex-wrap ml-auto">
			<button class="btn text-xs h-6 px-2.5 border-secondary rounded" on:click={() => (isScoreModalOpen = true)}>Games</button>
			<button class="btn text-xs h-6 px-2.5 border-secondary rounded" on:click={() => (isResetModalOpen = true)}>Reset</button>
			<button class="btn text-xs h-6 px-2.5 border-secondary rounded" on:click={() => $electronEmitter.emit('SimulateGameStart')}>▶ Sim</button>
			<button class="btn text-xs h-6 px-2.5 border-secondary rounded" on:click={() => $electronEmitter.emit('SimulateGameEnd')}>⏹ End</button>
		</div>
	</div>
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

<!-- ── Scene + client row ── -->
<div class="utility-grid mb-3">
	<div class="dash-card border-secondary">
		<p class="dash-label mb-3">Scene</p>
		<SceneSelect />
	</div>
	<div class="dash-card border-secondary">
		<p class="dash-label mb-2">Player Clients</p>
		{#if clientBase}
			<div class="qr-grid">
				<div class="qr-col">
					<span class="qr-label">P1</span>
					<div class="qr-wrap border-secondary">
						<QrCode value={p1Url} size="96" color="#ffffff" background="#000000" />
					</div>
					<span class="qr-url">/client/p1</span>
				</div>
				<div class="qr-col">
					<span class="qr-label">P2</span>
					<div class="qr-wrap border-secondary">
						<QrCode value={p2Url} size="96" color="#ffffff" background="#000000" />
					</div>
					<span class="qr-url">/client/p2</span>
				</div>
			</div>
		{:else}
			<p class="clients-hint">Set up remote access in Settings to generate QR codes.</p>
		{/if}
	</div>
</div>

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
			<p class="replay-hint">Enable in OBS → Output → Replay Buffer</p>
			<div class="mt-3"><ReplayBufferHandler /></div>
		</div>

	</div>
</div>

</div>
</main>

<ScoreUpdateModal bind:open={isScoreModalOpen} />
<TagUpdateModal bind:open={isTagModalOpen} />
<ConfirmModal bind:open={isResetModalOpen} on:confirm={handleReset}>Reset all games?</ConfirmModal>
<ConfirmModal bind:open={isBoConfirmOpen} on:confirm={confirmBestOf}>
	Change to BO{pendingBo}? Games already played may affect scoring.
</ConfirmModal>

<style>
	/* ── Match bar ── */
	.match-bar {
		padding: 0.75rem 1rem;
		border-radius: 0.25rem;
	}

	.match-names {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.6rem;
	}

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

	.score-block {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

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
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
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

	/* Utility grid */
	.utility-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 0.75rem;
	}

	.clients-hint {
		font-size: 0.75rem;
		opacity: 0.3;
		line-height: 1.5;
		margin-top: 0.25rem;
	}

	.qr-grid {
		display: flex;
		gap: 1rem;
		justify-content: space-around;
	}

	.qr-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
	}

	.qr-label {
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: 0.5;
		color: var(--secondary-color);
	}

	.qr-wrap {
		padding: 0.35rem;
		border-radius: 0.25rem;
	}

	.qr-url {
		font-size: 0.6rem;
		font-family: monospace;
		opacity: 0.35;
		color: var(--secondary-color);
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
</style>
