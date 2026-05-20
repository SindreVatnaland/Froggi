<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { strikeState, electronEmitter, isOverlayPage, urls } from '$lib/utils/store.svelte';
	import { STAGE_DATA } from '$lib/models/constants/stageData';

	onMount(() => {
		isOverlayPage.set(true);
		$electronEmitter.emit('StrikePlayerConnect', playerNum);
		return () => isOverlayPage.set(false);
	});

	const STAGE_NAMES: Record<number, string> = {
		2: 'Fountain of Dreams', 3: 'Pokémon Stadium', 6: 'Brinstar',
		7: 'Corneria', 8: "Yoshi's Story", 10: 'Mute City',
		11: 'Rainbow Cruise', 17: 'Green Greens', 22: 'Venom',
		28: 'Dream Land N64', 31: 'Battlefield', 32: 'Final Destination',
	};

	const MELEE_CHARS = [
		22,  8,  7,  5, 12, 17,  1,  0, 25, // Dr.Mario Mario Luigi Bowser Peach Yoshi DK Falcon Ganon
		20,  2, 11, 14,  4, 16, 18,  6, 21, // Falco Fox Ness ICs Kirby Samus Zelda Link Y.Link
		24, 13, 15, 10,  3,  9, 23,          // Pichu Pikachu Puff Mewtwo G&W Marth Roy
	];
	const CHAR_NAMES: Record<number, string> = {
		0:'C. Falcon',1:'Donkey Kong',2:'Fox',3:'Mr. Game & Watch',4:'Kirby',5:'Bowser',6:'Link',
		7:'Luigi',8:'Mario',9:'Marth',10:'Mewtwo',11:'Ness',12:'Peach',
		13:'Pikachu',14:'Ice Climbers',15:'Jigglypuff',16:'Samus',17:'Yoshi',
		18:'Zelda',19:'Sheik',20:'Falco',21:'Young Link',22:'Dr. Mario',
		23:'Roy',24:'Pichu',25:'Ganondorf',
	};

	function stageName(id: number): string {
		return STAGE_DATA[id]?.name ?? STAGE_NAMES[id] ?? `Stage ${id}`;
	}

	function hideImgOnError(e: Event) {
		(e.currentTarget as HTMLImageElement).style.display = 'none';
	}

	$: playerNum = parseInt($page.params.num) as 1 | 2;
	$: myKey = playerNum === 1 ? 'p1' : 'p2';
	$: s = $strikeState;
	$: phase = s?.phase ?? 'lobby';

	$: myName = playerNum === 1 ? (s?.p1Name ?? 'Player 1') : (s?.p2Name ?? 'Player 2');
	$: oppName = playerNum === 1 ? (s?.p2Name ?? 'Player 2') : (s?.p1Name ?? 'Player 1');
	$: isMyTurn = s?.currentStriker === playerNum;
	$: rpsWinner = s?.rps?.winner;
	$: myRps = playerNum === 1 ? s?.rps?.p1 : s?.rps?.p2;
	$: lastWinner = s?.lastWinner;
	$: isWinner = lastWinner === playerNum;
	$: isLoser = lastWinner !== null && lastWinner !== playerNum;
	$: myChar = playerNum === 1 ? s?.characters?.p1 : s?.characters?.p2;
	$: oppChar = playerNum === 1 ? s?.characters?.p2 : s?.characters?.p1;

	const RPS_CHOICES = ['rock', 'paper', 'scissors'] as const;
	let rpsCountdown = 5;
	let rpsTimerHandle: ReturnType<typeof setInterval> | null = null;

	function rpsChoice(choice: 'rock' | 'paper' | 'scissors') {
		if (myRps !== null && myRps !== undefined) return;
		stopRpsTimer();
		$electronEmitter.emit('RpsChoice', playerNum, choice);
	}

	function startRpsTimer() {
		if (rpsTimerHandle) return;
		rpsCountdown = 5;
		rpsTimerHandle = setInterval(() => {
			rpsCountdown -= 1;
			if (rpsCountdown <= 0) {
				stopRpsTimer();
				if (!myRps) rpsChoice(RPS_CHOICES[Math.floor(Math.random() * 3)]);
			}
		}, 1000);
	}

	function stopRpsTimer() {
		if (rpsTimerHandle) { clearInterval(rpsTimerHandle); rpsTimerHandle = null; }
	}

	$: if (phase === 'rps' && !myRps) startRpsTimer();
	else stopRpsTimer();

	function strikeStage(stageId: number) {
		$electronEmitter.emit('StrikeStage', stageId);
	}

	function pickStage(stageId: number) {
		$electronEmitter.emit('PickStage', stageId);
	}

	let pendingChar: number | null = null;

	function tapChar(charId: number) {
		pendingChar = charId;
	}

	function confirmChar() {
		if (pendingChar === null) return;
		$electronEmitter.emit('SelectCharacter', playerNum, pendingChar);
		pendingChar = null;
	}

	function cancelChar() {
		pendingChar = null;
	}

	const RPS_EMOJI: Record<string, string> = { rock: '✊', paper: '✋', scissors: '✌️' };
</script>

<div class="player-root">

	<!-- Always-visible score bar -->
	{#if s && phase !== 'lobby'}
	<div class="top-bar">
		<div class="top-score" class:top-score--me={true}>
			<span class="top-name">{myName}</span>
			<span class="top-pts" class:pts-active={playerNum === 1}>{s?.score?.p1 ?? 0}</span>
		</div>
		<span class="top-sep">–</span>
		<div class="top-score top-score--opp">
			<span class="top-pts" class:pts-active={playerNum === 2}>{s?.score?.p2 ?? 0}</span>
			<span class="top-name">{oppName}</span>
		</div>
	</div>
	{/if}

	<div class="player-body">

		<!-- LOBBY / CONNECTING -->
		{#if phase === 'lobby'}
		{@const oppNum = playerNum === 1 ? 2 : 1}
		{@const connected = s?.connectedPlayers ?? []}
		{@const iAmConnected = $urls}
		{@const oppConnected = connected.includes(oppNum)}
		<div class="waiting-screen">
			<p class="app-name">Froggi</p>
			<p class="waiting-role">Stage Striking · Player {playerNum}</p>
			<div class="conn-status-list">
				<div class="conn-status-row">
					<span class="conn-dot" class:conn-dot--on={iAmConnected} class:conn-dot--off={!iAmConnected}></span>
					<span class="conn-label">You</span>
					<span class="conn-state">{iAmConnected ? 'Connected' : 'Connecting…'}</span>
				</div>
				<div class="conn-status-row">
					<span class="conn-dot" class:conn-dot--on={oppConnected} class:conn-dot--off={!oppConnected}></span>
					<span class="conn-label">Opponent</span>
					<span class="conn-state">{oppConnected ? 'Connected' : 'Not connected'}</span>
				</div>
			</div>
			<p class="waiting-hint">Waiting for the TO to start the set.</p>
		</div>

		<!-- RPS -->
		{:else if phase === 'rps'}
		<div class="phase-section">
			<p class="phase-title">Rock · Paper · Scissors</p>
			{#if myRps}
			<p class="phase-sub">You picked {RPS_EMOJI[myRps]} — waiting for opponent…</p>
			{:else}
			<div class="rps-countdown" class:rps-countdown--urgent={rpsCountdown <= 2}>{rpsCountdown}</div>
			<div class="rps-btns">
				<button class="rps-btn" on:click={() => rpsChoice('rock')}>✊<span>Rock</span></button>
				<button class="rps-btn" on:click={() => rpsChoice('paper')}>✋<span>Paper</span></button>
				<button class="rps-btn" on:click={() => rpsChoice('scissors')}>✌️<span>Scissors</span></button>
			</div>
			{/if}
		</div>

		<!-- STRIKING (G1) -->
		{:else if phase === 'striking'}
		<div class="phase-section">
			{#if s?.rps?.winner}
			<p class="rps-result-hint">{s.rps.winner === playerNum ? 'You won RPS · striking first' : `${oppName} won RPS · striking first`}</p>
			{/if}
			{#if isMyTurn}
			<p class="phase-title">Strike a stage</p>
			<p class="phase-sub">
				Strike {s?.strikeOrder?.[s?.strikeOrderIndex ?? 0]?.[1] ?? 1}
				stage{(s?.strikeOrder?.[s?.strikeOrderIndex ?? 0]?.[1] ?? 1) > 1 ? 's' : ''}
			</p>
			<div class="stage-grid-p">
				{#each s?.starters ?? [] as stageId}
				{#if !s?.strikes?.includes(stageId)}
				<button class="stage-btn" on:click={() => strikeStage(stageId)}>
					<img src="/image/stages/{stageId}.png" alt={stageName(stageId)} class="stage-btn-img" />
					<span>{stageName(stageId)}</span>
				</button>
				{:else}
				<div class="stage-btn stage-btn--struck">
					<img src="/image/stages/{stageId}.png" alt={stageName(stageId)} class="stage-btn-img" />
					<span>{stageName(stageId)}</span>
					<span class="strike-x">✕</span>
				</div>
				{/if}
				{/each}
			</div>
			{:else}
			<p class="phase-title">Opponent is striking…</p>
			<p class="phase-sub">&nbsp;</p>
			<div class="stage-grid-p stage-grid-p--passive">
				{#each s?.starters ?? [] as stageId}
				<div class="stage-btn" class:stage-btn--struck={s?.strikes?.includes(stageId)}>
					<img src="/image/stages/{stageId}.png" alt={stageName(stageId)} class="stage-btn-img" />
					<span>{stageName(stageId)}</span>
					{#if s?.strikes?.includes(stageId)}<span class="strike-x">✕</span>{/if}
				</div>
				{/each}
			</div>
			{/if}
		</div>

		<!-- STAGE BAN -->
		{:else if phase === 'stageBan'}
		<div class="phase-section">
			{#if isMyTurn}
			<p class="phase-title">Ban a stage</p>
			<div class="stage-grid-p">
				{#each s?.stages ?? [] as stageId}
				{#if !s?.strikes?.includes(stageId)}
				<button class="stage-btn" on:click={() => strikeStage(stageId)}>
					<img src="/image/stages/{stageId}.png" alt={stageName(stageId)} class="stage-btn-img" />
					<span>{stageName(stageId)}</span>
				</button>
				{:else}
				<div class="stage-btn stage-btn--struck">
					<img src="/image/stages/{stageId}.png" alt="" class="stage-btn-img" />
					<span>{stageName(stageId)}</span>
					<span class="strike-x">✕</span>
				</div>
				{/if}
				{/each}
			</div>
			{:else}
			<p class="phase-title">Opponent is banning a stage…</p>
			<div class="stage-grid-p stage-grid-p--passive">
				{#each s?.stages ?? [] as stageId}
				<div class="stage-btn" class:stage-btn--struck={s?.strikes?.includes(stageId)}>
					<img src="/image/stages/{stageId}.png" alt={stageName(stageId)} class="stage-btn-img" />
					<span>{stageName(stageId)}</span>
					{#if s?.strikes?.includes(stageId)}<span class="strike-x">✕</span>{/if}
				</div>
				{/each}
			</div>
			{/if}
		</div>

		<!-- STAGE PICK -->
		{:else if phase === 'stagePick'}
		<div class="phase-section">
			{#if isMyTurn}
			<p class="phase-title">Pick a stage</p>
			<div class="stage-grid-p">
				{#each s?.stages ?? [] as stageId}
				<button class="stage-btn" on:click={() => pickStage(stageId)}>
					<img src="/image/stages/{stageId}.png" alt={stageName(stageId)} class="stage-btn-img" />
					<span>{stageName(stageId)}</span>
				</button>
				{/each}
			</div>
			{:else}
			<p class="phase-title">Opponent is picking a stage…</p>
			<div class="stage-grid-p stage-grid-p--passive">
				{#each s?.stages ?? [] as stageId}
				<div class="stage-btn">
					<img src="/image/stages/{stageId}.png" alt={stageName(stageId)} class="stage-btn-img" />
					<span>{stageName(stageId)}</span>
				</div>
				{/each}
			</div>
			{/if}
		</div>

		<!-- CHAR SELECT (double blind) -->
		{:else if phase === 'charSelect'}
		<div class="phase-section">
			{#if myChar !== null && myChar !== undefined}
			<div class="char-picked">
				<img src="/image/characters/css/{myChar}.png" alt="" class="char-picked-img" />
				<p class="phase-sub">Locked in — waiting for opponent…</p>
			</div>
			{:else}
			<p class="phase-title">Pick your character</p>
			<p class="phase-sub">Double blind — don't show your screen</p>
			<div class="char-grid">
				{#each MELEE_CHARS as charId}
				<button class="char-btn" class:char-btn--pending={pendingChar === charId} on:click={() => tapChar(charId)} title={CHAR_NAMES[charId]}>
					<img src="/image/characters/css/{charId}.png" alt={CHAR_NAMES[charId]} class="char-btn-img" />
				</button>
				{/each}
			</div>
			{#if pendingChar !== null}
			<div class="char-confirm-bar">
				<img src="/image/characters/css/{pendingChar}.png" alt="" class="char-confirm-img" />
				<div class="char-confirm-btns">
					<button class="char-confirm-ok" on:click={confirmChar}>Confirm</button>
					<button class="char-confirm-cancel" on:click={cancelChar}>Cancel</button>
				</div>
			</div>
			{/if}
			{/if}
		</div>

		<!-- CHAR LOCK (winner locks) -->
		{:else if phase === 'charLock'}
		<div class="phase-section">
			{#if isWinner}
			{#if myChar !== null && myChar !== undefined}
			<div class="char-picked">
				<img src="/image/characters/css/{myChar}.png" alt="" class="char-picked-img" />
				<p class="phase-sub">Locked in — opponent is picking…</p>
			</div>
			{:else}
			<p class="phase-title">Lock your character</p>
			<p class="phase-sub">Visible to opponent</p>
			<div class="char-grid">
				{#each MELEE_CHARS as charId}
				<button class="char-btn" class:char-btn--pending={pendingChar === charId} on:click={() => tapChar(charId)} title={CHAR_NAMES[charId]}>
					<img src="/image/characters/css/{charId}.png" alt={CHAR_NAMES[charId]} class="char-btn-img" />
				</button>
				{/each}
			</div>
			{#if pendingChar !== null}
			<div class="char-confirm-bar">
				<img src="/image/characters/css/{pendingChar}.png" alt="" class="char-confirm-img" />
				<div class="char-confirm-btns">
					<button class="char-confirm-ok" on:click={confirmChar}>Confirm</button>
					<button class="char-confirm-cancel" on:click={cancelChar}>Cancel</button>
				</div>
			</div>
			{/if}
			{/if}
			{:else}
			<p class="phase-title">Opponent is locking their character…</p>
			{/if}
		</div>

		<!-- CHAR PICK (loser picks seeing winner's char) -->
		{:else if phase === 'charPick'}
		<div class="phase-section">
			{#if isLoser}
			{#if myChar !== null && myChar !== undefined}
			<div class="char-picked">
				<img src="/image/characters/css/{myChar}.png" alt="" class="char-picked-img" />
				<p class="phase-sub">Locked in!</p>
			</div>
			{:else}
			<p class="phase-title">Pick your character</p>
			{#if oppChar !== null && oppChar !== undefined}
			<div class="opp-locked">
				<span class="phase-sub">Opponent locked:</span>
				<img src="/image/characters/css/{oppChar}.png" alt="" class="char-sm" />
			</div>
			{/if}
			<div class="char-grid">
				{#each MELEE_CHARS as charId}
				<button class="char-btn" class:char-btn--pending={pendingChar === charId} on:click={() => tapChar(charId)} title={CHAR_NAMES[charId]}>
					<img src="/image/characters/css/{charId}.png" alt={CHAR_NAMES[charId]} class="char-btn-img" />
				</button>
				{/each}
			</div>
			{#if pendingChar !== null}
			<div class="char-confirm-bar">
				<img src="/image/characters/css/{pendingChar}.png" alt="" class="char-confirm-img" />
				<div class="char-confirm-btns">
					<button class="char-confirm-ok" on:click={confirmChar}>Confirm</button>
					<button class="char-confirm-cancel" on:click={cancelChar}>Cancel</button>
				</div>
			</div>
			{/if}
			{/if}
			{:else}
			<p class="phase-title">Opponent is picking their character…</p>
			{#if myChar !== null && myChar !== undefined}
			<div class="char-picked">
				<img src="/image/characters/css/{myChar}.png" alt="" class="char-picked-img" />
			</div>
			{/if}
			{/if}
		</div>

		<!-- PLAYING -->
		{:else if phase === 'playing'}
		<div class="phase-section playing-view">
			<p class="phase-title">Game {s?.gameNum}</p>
			{#if s?.finalStageId !== null}
			<div class="stage-display">
				<img src="/image/stages/{s?.finalStageId}.png" alt="" class="stage-display-img" />
				<span>{stageName(s?.finalStageId ?? -1)}</span>
			</div>
			{/if}
			<div class="char-vs">
				{#if myChar !== null && myChar !== undefined}
				<div class="char-vs-side">
					<img src="/image/characters/css/{myChar}.png" alt="" class="char-vs-img" />
					<span>{myName}</span>
				</div>
				{/if}
				<span class="vs-label">vs</span>
				{#if oppChar !== null && oppChar !== undefined}
				<div class="char-vs-side">
					<img src="/image/characters/css/{oppChar}.png" alt="" class="char-vs-img" />
					<span>{oppName}</span>
				</div>
				{/if}
			</div>
		</div>

		<!-- SET COMPLETE -->
		{:else if phase === 'setComplete'}
		<div class="phase-section set-complete-view">
			<p class="complete-label">
				{(s?.score?.p1 ?? 0) > (s?.score?.p2 ?? 0)
					? (playerNum === 1 ? '🏆 You win the set!' : `${s?.p1Name} wins the set`)
					: (playerNum === 2 ? '🏆 You win the set!' : `${s?.p2Name} wins the set`)}
			</p>
			<p class="complete-score">{s?.score?.p1 ?? 0} – {s?.score?.p2 ?? 0}</p>
		</div>
		{/if}

		<!-- Game history -->
		{#if phase !== 'lobby' && (s?.games?.filter(g => !g.warmup)?.length ?? 0) > 0}
		{@const countedGames = (s?.games ?? []).filter(g => !g.warmup)}
		<div class="game-history">
			<p class="history-label">Games</p>
			{#each countedGames as game, i}
			{@const myCharId = (playerNum === 1 ? game.p1Char : game.p2Char) ?? 0}
			{@const oppCharId = (playerNum === 1 ? game.p2Char : game.p1Char) ?? 0}
			{@const iWon = game.winner === playerNum}
			<div class="history-row">
				<span class="h-gnum">G{i + 1}</span>
				<img class="h-char" class:h-win={iWon} class:h-lose={!iWon}
					src="/image/characters/{myCharId}/0/stock.png" alt="" />
				<img class="h-stage" src="/image/stages/{game.stageId}.png" alt=""
					on:error={hideImgOnError} />
				<img class="h-char" class:h-win={!iWon} class:h-lose={iWon}
					src="/image/characters/{oppCharId}/0/stock.png" alt="" />
				<span class="h-result" class:h-result--w={iWon} class:h-result--l={!iWon}>
					{iWon ? 'W' : 'L'}
				</span>
			</div>
			{/each}
		</div>
		{/if}

	</div>
</div>

<style>
	:global(body) { overflow: hidden; }

	.player-root {
		position: fixed; inset: 0;
		display: flex; flex-direction: column;
		background: #111;
		color: #e0e0e0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}

	.top-bar {
		display: flex; align-items: center; justify-content: center;
		gap: 0.75rem; padding: 0.6rem 1rem;
		background: rgba(255,255,255,0.04);
		border-bottom: 1px solid rgba(255,255,255,0.08);
		flex-shrink: 0;
	}
	.top-score { display: flex; align-items: center; gap: 0.5rem; }
	.top-name { font-size: 0.8rem; font-weight: 600; }
	.top-sep { font-size: 1rem; color: rgba(255,255,255,0.3); }
	.top-pts { font-size: 1.1rem; font-weight: 800; color: rgba(255,255,255,0.3); }
	.pts-active { color: #40dca5; }

	.player-body {
		flex: 1; overflow-y: auto;
		display: flex; flex-direction: column;
		padding: 1rem;
	}

	.waiting-screen {
		flex: 1; display: flex; flex-direction: column; align-items: center;
		justify-content: center; gap: 0.6rem; text-align: center; padding: 1.5rem;
	}
	.app-name {
		font-size: 1.4rem; font-weight: 800; color: #40dca5; letter-spacing: 0.02em;
		margin-bottom: 0.1rem;
	}
	.waiting-role {
		font-size: 0.75rem; color: rgba(255,255,255,0.5); letter-spacing: 0.05em;
		text-transform: uppercase; margin-bottom: 0.5rem;
	}
	.conn-status-list {
		display: flex; flex-direction: column; gap: 0.4rem;
		background: rgba(255,255,255,0.05); border-radius: 0.5rem;
		padding: 0.6rem 1rem; min-width: 180px; margin-bottom: 0.25rem;
	}
	.conn-status-row {
		display: flex; align-items: center; gap: 0.6rem;
	}
	.conn-dot {
		width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
	}
	.conn-dot--on { background: #4ade80; }
	.conn-dot--off {
		background: #facc15;
		animation: blink 1.2s ease-in-out infinite;
	}
	.conn-label {
		font-size: 0.75rem; font-weight: 600; color: rgba(255,255,255,0.6);
		min-width: 5rem; text-align: left;
	}
	.conn-state {
		font-size: 0.75rem; color: rgba(255,255,255,0.4);
	}
	@keyframes blink {
		0%, 100% { opacity: 1; } 50% { opacity: 0.2; }
	}
	.waiting-hint {
		font-size: 0.72rem; color: rgba(255,255,255,0.3); max-width: 260px; line-height: 1.5;
	}

	.phase-section { display: flex; flex-direction: column; gap: 0.75rem; }
	.phase-title { font-size: 1.1rem; font-weight: 700; margin: 0; }
	.phase-sub { font-size: 0.8rem; color: rgba(255,255,255,0.5); margin: 0; }

	.rps-countdown {
		font-size: 2.5rem; font-weight: 700; text-align: center;
		color: rgba(255,255,255,0.6); margin-bottom: 0.5rem;
		transition: color 0.2s;
	}
	.rps-countdown--urgent { color: #f87171; }

	.rps-btns { display: flex; gap: 0.75rem; flex-wrap: wrap; }
	.rps-btn {
		flex: 1; min-width: 80px; padding: 1.2rem 0.5rem;
		display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
		font-size: 2rem; background: rgba(255,255,255,0.06);
		border: 1px solid rgba(255,255,255,0.15); border-radius: 0.5rem;
		color: #e0e0e0; cursor: pointer;
	}
	.rps-btn span { font-size: 0.75rem; }
	.rps-btn:active { background: rgba(255,255,255,0.12); }

	.rps-result-hint {
		font-size: 0.72rem; color: rgba(255,255,255,0.4);
		margin: 0 0 0.75rem; text-align: center;
	}

	.stage-grid-p { display: flex; flex-wrap: wrap; gap: 0.5rem; }
	.stage-grid-p--passive { opacity: 0.6; pointer-events: none; }

	.stage-btn {
		position: relative; width: calc(33.3% - 0.34rem);
		min-width: 90px; display: flex; flex-direction: column; align-items: center;
		background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.15);
		border-radius: 0.4rem; overflow: hidden; cursor: pointer;
		font-size: 0.65rem; text-align: center; color: #e0e0e0;
	}
	.stage-btn:active { border-color: #40dca5; }
	.stage-btn--struck { opacity: 0.3; pointer-events: none; }
	.stage-btn-img { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; }
	.strike-x {
		position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
		font-size: 1.8rem; color: #ff4444; font-weight: 900;
	}

	.char-grid {
		display: grid; grid-template-columns: repeat(9, 1fr); gap: 0.3rem;
	}
	.char-btn:nth-child(19) { grid-column-start: 2; }
	.char-btn {
		aspect-ratio: 1; background: rgba(255,255,255,0.04);
		border: 1px solid rgba(255,255,255,0.1); border-radius: 0.3rem;
		cursor: pointer; overflow: hidden; padding: 0;
	}
	.char-btn:active { border-color: #40dca5; background: rgba(64,220,165,0.1); }
	.char-btn-img { width: 100%; height: 100%; object-fit: contain; display: block; }

	.char-btn--pending { border-color: #40dca5; background: rgba(64,220,165,0.15); }

	.char-confirm-bar {
		display: flex; align-items: center; gap: 0.75rem;
		background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15);
		border-radius: 0.5rem; padding: 0.5rem 0.75rem; margin-top: 0.25rem;
	}
	.char-confirm-img { width: 48px; height: 48px; object-fit: contain; }
	.char-confirm-btns { display: flex; gap: 0.5rem; margin-left: auto; }
	.char-confirm-ok {
		padding: 0.4rem 1rem; border-radius: 0.35rem; font-size: 0.8rem; font-weight: 700;
		background: #40dca5; color: #111; border: none; cursor: pointer;
	}
	.char-confirm-cancel {
		padding: 0.4rem 0.75rem; border-radius: 0.35rem; font-size: 0.8rem;
		background: rgba(255,255,255,0.08); color: #e0e0e0;
		border: 1px solid rgba(255,255,255,0.15); cursor: pointer;
	}

	.char-picked { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1rem 0; }
	.char-picked-img { width: 96px; height: 96px; object-fit: contain; }

	.opp-locked { display: flex; align-items: center; gap: 0.5rem; }
	.char-sm { width: 48px; height: 48px; object-fit: contain; }

	.playing-view { align-items: center; padding-top: 1rem; }
	.stage-display { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; font-size: 0.8rem; }
	.stage-display-img { width: 180px; height: 100px; object-fit: cover; border-radius: 0.35rem; }
	.char-vs { display: flex; align-items: center; gap: 1rem; margin-top: 0.5rem; }
	.char-vs-side { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; font-size: 0.75rem; }
	.char-vs-img { width: 72px; height: 72px; object-fit: contain; }
	.vs-label { font-size: 0.7rem; color: rgba(255,255,255,0.3); }

	.set-complete-view { align-items: center; padding-top: 2rem; gap: 0.5rem; }
	.complete-label { font-size: 1.3rem; font-weight: 800; }
	.complete-score { font-size: 2.5rem; font-weight: 900; color: #40dca5; }

	.game-history {
		margin-top: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255,255,255,0.08);
	}
	.history-label {
		font-size: 0.6rem; font-weight: 700; text-transform: uppercase;
		letter-spacing: 0.08em; opacity: 0.3; margin-bottom: 0.5rem;
	}
	.history-row {
		display: grid;
		grid-template-columns: 1.5rem 1.25rem 1fr 1.25rem 1.5rem;
		align-items: center; gap: 0.4rem;
		padding: 0.2rem 0;
	}
	.h-gnum { font-size: 0.65rem; font-weight: 600; opacity: 0.35; }
	.h-char { width: 1.25rem; height: 1.25rem; object-fit: contain; }
	.h-win { opacity: 1; }
	.h-lose { opacity: 0.2; }
	.h-stage { width: 100%; height: 28px; object-fit: cover; border-radius: 0.2rem; opacity: 0.7; }
	.h-result { font-size: 0.65rem; font-weight: 800; text-align: right; }
	.h-result--w { color: #4ade80; }
	.h-result--l { color: rgba(255,255,255,0.25); }
</style>
