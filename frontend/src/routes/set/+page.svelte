<script lang="ts">
	import { onMount } from 'svelte';
	import { strikeState, electronEmitter, urls, remoteAccess } from '$lib/utils/store.svelte';
	import { STAGE_DATA } from '$lib/models/constants/stageData';
	import { CHARACTERS } from '$lib/models/constants/characterData';
	// @ts-ignore
	import QrCode from 'svelte-qrcode';

	const STAGE_NAMES: Record<number, string> = {
		2: 'Fountain of Dreams',
		3: 'Pokémon Stadium',
		6: 'Brinstar',
		7: 'Corneria',
		8: "Yoshi's Story",
		10: 'Mute City',
		11: 'Rainbow Cruise',
		17: 'Green Greens',
		22: 'Venom',
		27: 'Flat Zone',
		28: 'Dream Land N64',
		31: 'Battlefield',
		32: 'Final Destination',
	};

	const CHAR_NAMES: Record<number, string> = {
		0: 'Falcon', 1: 'DK', 2: 'Fox', 3: 'G&W', 4: 'Kirby',
		5: 'Bowser', 6: 'Link', 7: 'Luigi', 8: 'Mario', 9: 'Marth',
		10: 'Mewtwo', 11: 'Ness', 12: 'Peach', 13: 'Pikachu',
		14: 'ICs', 15: 'Puff', 16: 'Samus', 17: 'Yoshi',
		18: 'Zelda', 19: 'Sheik', 20: 'Falco', 21: 'Y.Link',
		22: 'Doc', 23: 'Roy', 24: 'Pichu', 25: 'Ganon',
	};

	function stageName(id: number): string {
		return STAGE_DATA[id]?.name ?? STAGE_NAMES[id] ?? `Stage ${id}`;
	}

	let p1Name = '';
	let p2Name = '';
	let bestOf: 3 | 5 = 3;

	$: s = $strikeState;
	$: phase = s?.phase ?? 'lobby';
	$: baseUrl = $remoteAccess.url ?? $urls?.external ?? '';
	$: p1Url = baseUrl ? `${baseUrl}/set/p/1` : '';
	$: p2Url = baseUrl ? `${baseUrl}/set/p/2` : '';

	function startSet() {
		$electronEmitter.emit('StartSet', p1Name || 'Player 1', p2Name || 'Player 2', bestOf);
	}

	function rpsWinnerOrder(first: 1 | 2) {
		$electronEmitter.emit('RpsWinnerOrder', first);
	}

	function reportWinner(player: 1 | 2) {
		$electronEmitter.emit('ReportWinner', player);
	}

	function markWarmup() {
		$electronEmitter.emit('MarkWarmup');
	}

	function resetSet() {
		$electronEmitter.emit('ResetSet');
	}

	function undoLastGame() {
		$electronEmitter.emit('UndoLastGame');
	}

	$: isOnline = !!($remoteAccess.tailscale || $remoteAccess.ngrok);
	$: p1Connected = s?.connectedPlayers?.includes(1) ?? false;
	$: p2Connected = s?.connectedPlayers?.includes(2) ?? false;
	$: bothConnected = p1Connected && p2Connected;

	$: winsNeeded = s ? Math.ceil(s.bestOf / 2) : 2;
	$: p1Wins = s?.score?.p1 ?? 0;
	$: p2Wins = s?.score?.p2 ?? 0;
	$: setWinner = s?.phase === 'setComplete'
		? (p1Wins > p2Wins ? s.p1Name : s.p2Name)
		: null;
</script>

<main class="flex justify-center">
<div class="set-to w-full max-w-2xl">

	<!-- Header -->
	{#if s && phase !== 'lobby'}
	<div class="dash-card border-secondary mb-3 score-bar">
		<span class="player-name">{s.p1Name}</span>
		<span class="score-pill">{p1Wins} – {p2Wins}</span>
		<span class="player-name text-right">{s.p2Name}</span>
		<button class="reset-btn" on:click={resetSet}>Reset</button>
	</div>
	{/if}

	<!-- LOBBY: guided start flow -->
	{#if phase === 'lobby'}
	<div class="dash-card border-secondary">
		<p class="dash-label">New Set</p>

		<!-- Step 1: Connect / Share -->
		<div class="guide-step" class:guide-step--done={bothConnected}>
			<span class="guide-num">1</span>
			<div class="guide-body">
				{#if isOnline}
				<p class="guide-title">Spectate a player in Slippi</p>
				<p class="guide-hint">Connect to one of the players via Direct Play → Spectate. Have them start a quick match so Froggi can read the player tags. Then share the player URLs below.</p>
				{:else}
				<p class="guide-title">Have players scan their QR code</p>
				<p class="guide-hint">Both players open their link on a phone or fixed device. Make sure all devices are on the same Wi-Fi.</p>
				{/if}

				{#if p1Url || p2Url}
				<div class="qr-row">
					{#if p1Url}
					<div class="qr-col">
						<p class="dash-label">Player 1</p>
						<QrCode value={p1Url} size="110" color="#ffffff" background="#1a1a1a" />
						<button class="qr-copy-btn" on:click={() => navigator.clipboard.writeText(p1Url)}>Copy URL</button>
					</div>
					{/if}
					{#if p2Url}
					<div class="qr-col">
						<p class="dash-label">Player 2</p>
						<QrCode value={p2Url} size="110" color="#ffffff" background="#1a1a1a" />
						<button class="qr-copy-btn" on:click={() => navigator.clipboard.writeText(p2Url)}>Copy URL</button>
					</div>
					{/if}
				</div>
				{/if}
			</div>
		</div>

		<!-- Step 2: Wait for connection -->
		<div class="guide-step" class:guide-step--done={bothConnected}>
			<span class="guide-num">2</span>
			<div class="guide-body">
				<p class="guide-title">Wait for both players to connect</p>
				<div class="conn-row">
					<span class="conn-dot" class:conn-dot--on={p1Connected}></span>
					<span class="conn-label">Player 1</span>
					<span class="conn-state">{p1Connected ? 'Connected' : 'Waiting…'}</span>
				</div>
				<div class="conn-row">
					<span class="conn-dot" class:conn-dot--on={p2Connected}></span>
					<span class="conn-label">Player 2</span>
					<span class="conn-state">{p2Connected ? 'Connected' : 'Waiting…'}</span>
				</div>
			</div>
		</div>

		<!-- Step 3: Names + start -->
		<div class="guide-step guide-step--last" class:guide-step--active={bothConnected}>
			<span class="guide-num">3</span>
			<div class="guide-body">
				<p class="guide-title">Enter player names and start</p>
				<div class="form-row mt-1">
					<input class="name-input" placeholder="Player 1" bind:value={p1Name} />
					<input class="name-input" placeholder="Player 2" bind:value={p2Name} />
				</div>
				<div class="bo-row">
					<button class="bo-btn" class:bo-active={bestOf === 3} on:click={() => bestOf = 3}>BO3</button>
					<button class="bo-btn" class:bo-active={bestOf === 5} on:click={() => bestOf = 5}>BO5</button>
				</div>
				<button class="start-btn" on:click={startSet}>Start Set</button>
			</div>
		</div>
	</div>

	<!-- RPS -->
	{:else if phase === 'rps'}
	<div class="dash-card border-secondary">
		<p class="dash-label">Rock · Paper · Scissors</p>
		<p class="phase-hint">Players pick on their phones</p>
		<div class="rps-status">
			<div class="rps-player">
				<span class="player-name">{s?.p1Name}</span>
				<span class="rps-dot" class:submitted={s?.rps?.p1 !== null}>{s?.rps?.p1 ? '✓' : '…'}</span>
			</div>
			<div class="rps-player">
				<span class="player-name">{s?.p2Name}</span>
				<span class="rps-dot" class:submitted={s?.rps?.p2 !== null}>{s?.rps?.p2 ? '✓' : '…'}</span>
			</div>
		</div>
	</div>

	<!-- RPS RESULT -->
	{:else if phase === 'rpsResult'}
	<div class="dash-card border-secondary">
		<p class="dash-label">RPS Result</p>
		<p class="phase-big">{s?.rps?.winner === 1 ? s?.p1Name : s?.p2Name} wins RPS</p>
		<p class="phase-hint">Winner chooses strike order</p>
		<div class="btn-row mt-2">
			<button class="action-btn" on:click={() => rpsWinnerOrder(s?.rps?.winner ?? 1)}>
				{s?.rps?.winner === 1 ? s?.p1Name : s?.p2Name} strikes first
			</button>
			<button class="action-btn" on:click={() => rpsWinnerOrder(s?.rps?.winner === 1 ? 2 : 1)}>
				{s?.rps?.winner === 1 ? s?.p1Name : s?.p2Name} strikes second
			</button>
		</div>
	</div>

	<!-- STRIKING (G1) -->
	{:else if phase === 'striking'}
	<div class="dash-card border-secondary">
		<p class="dash-label">Stage Striking — Game 1</p>
		<p class="phase-hint">
			{s?.currentStriker === 1 ? s?.p1Name : s?.p2Name} strikes
			({s?.strikeOrder?.[s?.strikeOrderIndex ?? 0]?.[1] ?? 1} stage{(s?.strikeOrder?.[s?.strikeOrderIndex ?? 0]?.[1] ?? 1) > 1 ? 's' : ''})
		</p>
		<div class="stage-grid">
			{#each s?.starters ?? [] as stageId}
			<div class="stage-card" class:struck={s?.strikes?.includes(stageId)}>
				<img src="/image/stages/{stageId}.png" alt={stageName(stageId)} class="stage-img" />
				<span class="stage-name">{stageName(stageId)}</span>
				{#if s?.strikes?.includes(stageId)}
				<span class="strike-x">✕</span>
				{/if}
			</div>
			{/each}
		</div>
		<p class="phase-hint mt-2">Players strike on their phones</p>
	</div>

	<!-- STAGE BAN (games 2+) -->
	{:else if phase === 'stageBan'}
	<div class="dash-card border-secondary">
		<p class="dash-label">Stage Ban — Game {s?.gameNum}</p>
		<p class="phase-hint">{s?.currentStriker === 1 ? s?.p1Name : s?.p2Name} bans 1 stage</p>
		<div class="stage-grid">
			{#each s?.stages ?? [] as stageId}
			<div class="stage-card" class:struck={s?.strikes?.includes(stageId)}>
				<img src="/image/stages/{stageId}.png" alt={stageName(stageId)} class="stage-img" />
				<span class="stage-name">{stageName(stageId)}</span>
				{#if s?.strikes?.includes(stageId)}
				<span class="strike-x">✕</span>
				{/if}
			</div>
			{/each}
		</div>
		<p class="phase-hint mt-2">Winner bans on their phone</p>
	</div>

	<!-- STAGE PICK -->
	{:else if phase === 'stagePick'}
	<div class="dash-card border-secondary">
		<p class="dash-label">Stage Pick — Game {s?.gameNum}</p>
		<p class="phase-hint">{s?.currentStriker === 1 ? s?.p1Name : s?.p2Name} picks</p>
		<div class="stage-grid">
			{#each s?.stages ?? [] as stageId}
			<div class="stage-card">
				<img src="/image/stages/{stageId}.png" alt={stageName(stageId)} class="stage-img" />
				<span class="stage-name">{stageName(stageId)}</span>
			</div>
			{/each}
		</div>
		<p class="phase-hint mt-2">Loser picks on their phone</p>
	</div>

	<!-- CHAR SELECT -->
	{:else if phase === 'charSelect'}
	<div class="dash-card border-secondary">
		<p class="dash-label">Character Select — Double Blind</p>
		{#if s?.finalStageId != null}
		<div class="stage-preview">
			<img src="/image/stages/{s.finalStageId}.png" alt={stageName(s.finalStageId)} class="stage-preview-img" />
			<span class="stage-preview-name">{stageName(s.finalStageId)}</span>
		</div>
		{/if}
		<div class="char-status">
			<div class="char-status-player">
				<span>{s?.p1Name}</span>
				<span class="rps-dot" class:submitted={s?.characters?.p1 !== null}>{s?.characters?.p1 !== null ? '✓' : '…'}</span>
			</div>
			<div class="char-status-player">
				<span>{s?.p2Name}</span>
				<span class="rps-dot" class:submitted={s?.characters?.p2 !== null}>{s?.characters?.p2 !== null ? '✓' : '…'}</span>
			</div>
		</div>
		<p class="phase-hint mt-2">Players pick on their phones simultaneously</p>
	</div>

	<!-- CHAR LOCK -->
	{:else if phase === 'charLock'}
	<div class="dash-card border-secondary">
		<p class="dash-label">Character Lock — Game {s?.gameNum}</p>
		{#if s?.finalStageId != null}
		<div class="stage-preview">
			<img src="/image/stages/{s.finalStageId}.png" alt={stageName(s.finalStageId)} class="stage-preview-img" />
			<span class="stage-preview-name">{stageName(s.finalStageId)}</span>
		</div>
		{/if}
		<p class="phase-hint">
			{s?.lastWinner === 1 ? s?.p1Name : s?.p2Name} (winner) locks character
		</p>
		{#if s?.characters?.p1 !== null || s?.characters?.p2 !== null}
		<div class="char-reveal">
			{#if s?.characters?.p1 !== null}
			<img src="/image/characters/{s.characters.p1}/0/vs-left.png" alt="P1 char" class="char-img" />
			{/if}
		</div>
		{/if}
	</div>

	<!-- CHAR PICK -->
	{:else if phase === 'charPick'}
	<div class="dash-card border-secondary">
		<p class="dash-label">Character Pick — Game {s?.gameNum}</p>
		{#if s?.finalStageId != null}
		<div class="stage-preview">
			<img src="/image/stages/{s.finalStageId}.png" alt={stageName(s.finalStageId)} class="stage-preview-img" />
			<span class="stage-preview-name">{stageName(s.finalStageId)}</span>
		</div>
		{/if}
		<p class="phase-hint">
			{s?.lastWinner === 1 ? s?.p1Name : s?.p2Name} locked:
		</p>
		{#if s?.characters}
		<div class="char-reveal">
			{#if s.characters.p1 !== null}
			<div class="char-lock-display">
				<img src="/image/characters/{s.characters.p1}/0/vs-left.png" alt="P1" class="char-img" />
				<span>{s.p1Name}</span>
			</div>
			{/if}
			{#if s.characters.p2 !== null}
			<div class="char-lock-display">
				<img src="/image/characters/{s.characters.p2}/0/vs-left.png" alt="P2" class="char-img" />
				<span>{s.p2Name}</span>
			</div>
			{/if}
		</div>
		{/if}
		<p class="phase-hint mt-2">Loser picks on their phone</p>
	</div>

	<!-- PLAYING -->
	{:else if phase === 'playing'}
	<div class="dash-card border-secondary">
		<p class="dash-label">Game {s?.gameNum} — Playing</p>
		{#if s?.finalStageId !== null}
		<div class="playing-stage">
			<img src="/image/stages/{s.finalStageId}.png" alt={stageName(s?.finalStageId ?? -1)} class="stage-img-large" />
			<span class="stage-name">{stageName(s?.finalStageId ?? -1)}</span>
		</div>
		{/if}
		{#if s?.characters}
		<div class="playing-chars">
			<div class="playing-char">
				{#if s.characters.p1 !== null}
				<img src="/image/characters/{s.characters.p1}/0/vs-left.png" alt="P1" class="char-img" />
				{/if}
				<span>{s.p1Name}</span>
			</div>
			<span class="vs-sep">vs</span>
			<div class="playing-char playing-char--right">
				<span>{s.p2Name}</span>
				{#if s.characters.p2 !== null}
				<img src="/image/characters/{s.characters.p2}/0/vs-right.png" alt="P2" class="char-img" />
				{/if}
			</div>
		</div>
		{/if}
		<div class="winner-row mt-3">
			<button class="winner-btn winner-btn--p1" on:click={() => reportWinner(1)}>{s?.p1Name} wins</button>
			<button class="warmup-btn" on:click={markWarmup}>Warmup</button>
			<button class="winner-btn winner-btn--p2" on:click={() => reportWinner(2)}>{s?.p2Name} wins</button>
		</div>
		{#if (s?.games?.length ?? 0) > 0}
		<button class="undo-btn mt-2" on:click={undoLastGame}>↩ Undo last game</button>
		{/if}
	</div>

	<!-- SET COMPLETE -->
	{:else if phase === 'setComplete'}
	<div class="dash-card border-secondary set-complete">
		<p class="dash-label">Set Complete</p>
		<p class="phase-big">{setWinner} wins the set</p>
		<p class="final-score">{p1Wins} – {p2Wins}</p>
		{#if s?.games?.filter(g => !g.warmup).length}
		<div class="game-history">
			{#each s.games.filter(g => !g.warmup) as game, i}
			<div class="game-row">
				<span class="game-num">G{i + 1}</span>
				<img src="/image/stages/{game.stageId}.png" alt="" class="history-stage" />
				<span class="history-winner">{game.winner === 1 ? s?.p1Name : s?.p2Name}</span>
			</div>
			{/each}
		</div>
		{/if}
		<div class="set-complete-actions">
			<button class="start-btn" on:click={resetSet}>New Set</button>
			<button class="undo-btn" on:click={undoLastGame}>↩ Undo last game</button>
		</div>
	</div>
	{/if}

</div>
</main>

<style>
	.set-to { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }

	.score-bar {
		display: flex; align-items: center; gap: 0.75rem;
		padding: 0.75rem 1rem;
	}
	.score-bar .player-name { flex: 1; font-size: 0.85rem; font-weight: 600; }
	.score-bar .text-right { text-align: right; }
	.score-pill {
		font-size: 1.1rem; font-weight: 700; letter-spacing: 0.05em;
		color: var(--accent, #40dca5);
	}
	.reset-btn {
		font-size: 0.7rem; padding: 0.25rem 0.6rem;
		background: transparent; border: 1px solid rgba(255,255,255,0.15);
		border-radius: 0.25rem; color: var(--muted, rgba(255,255,255,0.4));
		cursor: pointer;
	}
	.reset-btn:hover { color: #fff; border-color: rgba(255,255,255,0.3); }

	.form-row { display: flex; gap: 0.75rem; margin-bottom: 0.75rem; }
	.name-input {
		flex: 1; background: var(--primary-color); border: 1px solid rgba(255,255,255,0.15);
		border-radius: 0.3rem; padding: 0.45rem 0.75rem;
		color: var(--secondary-color); font-size: 0.85rem;
	}

	.bo-row { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
	.bo-btn {
		flex: 1; padding: 0.4rem; font-size: 0.8rem; font-weight: 600;
		background: transparent; border: 1px solid rgba(255,255,255,0.15);
		border-radius: 0.3rem; color: var(--secondary-color); cursor: pointer;
	}
	.bo-active { background: var(--accent, #40dca5); color: #000; border-color: transparent; }

	.start-btn {
		width: 100%; padding: 0.6rem; font-size: 0.9rem; font-weight: 700;
		background: var(--accent, #40dca5); color: #000;
		border: none; border-radius: 0.35rem; cursor: pointer;
	}
	.start-btn:hover { opacity: 0.85; }

	/* Guide steps */
	.guide-step {
		display: flex; gap: 0.75rem; padding: 0.75rem 0;
		border-bottom: 1px solid rgba(255,255,255,0.06);
		opacity: 0.5;
	}
	.guide-step--done { opacity: 0.35; }
	.guide-step--active { opacity: 1; }
	.guide-step--last { border-bottom: none; }
	.guide-num {
		width: 1.4rem; height: 1.4rem; border-radius: 50%; flex-shrink: 0;
		display: flex; align-items: center; justify-content: center;
		font-size: 0.65rem; font-weight: 700;
		border: 1px solid rgba(255,255,255,0.2);
		color: rgba(255,255,255,0.5); margin-top: 0.1rem;
	}
	.guide-body { flex: 1; display: flex; flex-direction: column; gap: 0.4rem; }
	.guide-title { font-size: 0.85rem; font-weight: 600; margin: 0; }
	.guide-hint { font-size: 0.75rem; color: rgba(255,255,255,0.45); margin: 0; line-height: 1.5; }
	.mt-1 { margin-top: 0.25rem; }

	/* Connection status */
	.conn-row { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem; }
	.conn-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.2); flex-shrink: 0; }
	.conn-dot--on { background: #4ade80; }
	.conn-label { font-size: 0.75rem; font-weight: 600; min-width: 4.5rem; }
	.conn-state { font-size: 0.75rem; color: rgba(255,255,255,0.4); }

	.qr-row { display: flex; gap: 1.5rem; padding-top: 0.5rem; }
	.qr-col { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; }
	.qr-copy-btn {
		font-size: 0.65rem; padding: 0.2rem 0.6rem;
		background: transparent; border: 1px solid rgba(255,255,255,0.15);
		border-radius: 0.25rem; color: rgba(255,255,255,0.4); cursor: pointer;
	}
	.qr-copy-btn:hover { color: #fff; border-color: rgba(255,255,255,0.3); }

	/* Undo */
	.undo-btn {
		width: 100%; padding: 0.4rem; font-size: 0.75rem;
		background: transparent; border: 1px solid rgba(255,255,255,0.1);
		border-radius: 0.3rem; color: rgba(255,255,255,0.35); cursor: pointer;
	}
	.undo-btn:hover { color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.25); }

	.set-complete-actions { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem; }

	.phase-hint { font-size: 0.8rem; color: rgba(255,255,255,0.5); margin: 0.25rem 0; }
	.phase-big { font-size: 1.1rem; font-weight: 700; margin: 0.5rem 0; }
	.mt-2 { margin-top: 0.5rem; }
	.mt-3 { margin-top: 0.75rem; }

	.rps-status, .char-status { display: flex; gap: 1.5rem; margin-top: 0.75rem; flex-wrap: wrap; }
	.rps-player, .char-status-player { display: flex; align-items: center; gap: 0.5rem; }
	.rps-dot { font-size: 0.75rem; color: rgba(255,255,255,0.3); }
	.rps-dot.submitted { color: var(--accent, #40dca5); }

	.btn-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
	.action-btn {
		flex: 1; padding: 0.5rem 0.75rem; font-size: 0.8rem; font-weight: 600;
		background: transparent; border: 1px solid rgba(255,255,255,0.2);
		border-radius: 0.3rem; color: var(--secondary-color); cursor: pointer;
	}
	.action-btn:hover { border-color: var(--accent, #40dca5); color: var(--accent, #40dca5); }

	.stage-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }
	.stage-card {
		position: relative; width: 100px; border-radius: 0.35rem;
		overflow: hidden; border: 1px solid rgba(255,255,255,0.12);
		display: flex; flex-direction: column; align-items: center;
	}
	.stage-card.struck { opacity: 0.35; }
	.stage-img { width: 100%; height: 56px; object-fit: cover; display: block; }
	.stage-name { font-size: 0.65rem; padding: 0.2rem 0.3rem; text-align: center; line-height: 1.2; }
	.strike-x {
		position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
		font-size: 2rem; color: #ff4444; font-weight: 900; text-shadow: 0 0 4px rgba(0,0,0,0.8);
	}

	.char-reveal { display: flex; gap: 1rem; margin-top: 0.75rem; align-items: center; }
	.char-lock-display { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; font-size: 0.75rem; }
	.char-img { width: 64px; height: 64px; object-fit: contain; }
	.char-status-player { font-size: 0.85rem; }

	.playing-stage { display: flex; align-items: center; gap: 0.75rem; margin: 0.5rem 0; }
	.stage-img-large { width: 120px; height: 68px; object-fit: cover; border-radius: 0.25rem; }

	.stage-preview {
		position: relative;
		width: 100%;
		margin: 0.5rem 0 0.25rem;
		border-radius: 0.375rem;
		overflow: hidden;
	}
	.stage-preview-img {
		width: 100%;
		height: 100px;
		object-fit: cover;
		display: block;
		opacity: 0.85;
	}
	.stage-preview-name {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 0.3rem 0.6rem;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		background: linear-gradient(transparent, rgba(0,0,0,0.65));
		color: #fff;
	}
	.playing-chars { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem; flex-wrap: wrap; }
	.playing-char { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; font-weight: 600; }
	.playing-char--right { flex-direction: row-reverse; }
	.vs-sep { font-size: 0.7rem; color: rgba(255,255,255,0.3); }

	.winner-row { display: flex; gap: 0.5rem; align-items: stretch; }
	.winner-btn {
		flex: 1; padding: 0.65rem 0.5rem; font-size: 0.85rem; font-weight: 700;
		border: none; border-radius: 0.35rem; cursor: pointer;
	}
	.winner-btn--p1 { background: #3b82f6; color: #fff; }
	.winner-btn--p1:hover { background: #2563eb; }
	.winner-btn--p2 { background: #ef4444; color: #fff; }
	.winner-btn--p2:hover { background: #dc2626; }
	.warmup-btn {
		padding: 0.65rem 0.75rem; font-size: 0.75rem;
		background: transparent; border: 1px solid rgba(255,255,255,0.2);
		border-radius: 0.35rem; color: rgba(255,255,255,0.5); cursor: pointer;
	}
	.warmup-btn:hover { color: #fff; border-color: rgba(255,255,255,0.4); }

	.set-complete { text-align: center; }
	.final-score { font-size: 2rem; font-weight: 800; color: var(--accent, #40dca5); margin: 0.25rem 0; }
	.game-history { display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.75rem; }
	.game-row { display: flex; align-items: center; gap: 0.6rem; font-size: 0.8rem; }
	.game-num { width: 1.5rem; color: rgba(255,255,255,0.4); }
	.history-stage { width: 48px; height: 27px; object-fit: cover; border-radius: 0.2rem; }
	.history-winner { font-weight: 600; }

	.player-name { font-size: 0.85rem; font-weight: 600; }
</style>
