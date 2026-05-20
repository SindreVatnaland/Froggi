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

	const MELEE_CHARS = Array.from({ length: 26 }, (_, i) => i);
	const CHAR_NAMES: Record<number, string> = {
		0:'Falcon',1:'DK',2:'Fox',3:'G&W',4:'Kirby',5:'Bowser',6:'Link',
		7:'Luigi',8:'Mario',9:'Marth',10:'Mewtwo',11:'Ness',12:'Peach',
		13:'Pikachu',14:'ICs',15:'Puff',16:'Samus',17:'Yoshi',
		18:'Zelda',19:'Sheik',20:'Falco',21:'Y.Link',22:'Doc',
		23:'Roy',24:'Pichu',25:'Ganon',
	};

	function stageName(id: number): string {
		return STAGE_DATA[id]?.name ?? STAGE_NAMES[id] ?? `Stage ${id}`;
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

	function rpsChoice(choice: 'rock' | 'paper' | 'scissors') {
		if (myRps !== null && myRps !== undefined) return;
		$electronEmitter.emit('RpsChoice', playerNum, choice);
	}

	function chooseOrder(first: 1 | 2) {
		$electronEmitter.emit('RpsWinnerOrder', first);
	}

	function strikeStage(stageId: number) {
		$electronEmitter.emit('StrikeStage', stageId);
	}

	function pickStage(stageId: number) {
		$electronEmitter.emit('PickStage', stageId);
	}

	function selectChar(charId: number) {
		$electronEmitter.emit('SelectCharacter', playerNum, charId);
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
			<div class="rps-btns">
				<button class="rps-btn" on:click={() => rpsChoice('rock')}>✊<span>Rock</span></button>
				<button class="rps-btn" on:click={() => rpsChoice('paper')}>✋<span>Paper</span></button>
				<button class="rps-btn" on:click={() => rpsChoice('scissors')}>✌️<span>Scissors</span></button>
			</div>
			{/if}
		</div>

		<!-- RPS RESULT -->
		{:else if phase === 'rpsResult'}
		<div class="phase-section">
			<p class="phase-title">{rpsWinner === playerNum ? '🎉 You won RPS!' : `${oppName} won RPS`}</p>
			{#if rpsWinner === playerNum}
			<p class="phase-sub">Choose strike order</p>
			<div class="order-btns">
				<button class="order-btn" on:click={() => chooseOrder(playerNum)}>I strike first</button>
				<button class="order-btn" on:click={() => chooseOrder(playerNum === 1 ? 2 : 1)}>I strike second</button>
			</div>
			{:else}
			<p class="phase-sub">Opponent is choosing strike order…</p>
			{/if}
		</div>

		<!-- STRIKING (G1) -->
		{:else if phase === 'striking'}
		<div class="phase-section">
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
			{/if}
		</div>

		<!-- CHAR SELECT (double blind) -->
		{:else if phase === 'charSelect'}
		<div class="phase-section">
			{#if myChar !== null && myChar !== undefined}
			<div class="char-picked">
				<img src="/image/characters/{myChar}/0/vs-left.png" alt="" class="char-picked-img" />
				<p class="phase-sub">Locked in — waiting for opponent…</p>
			</div>
			{:else}
			<p class="phase-title">Pick your character</p>
			<p class="phase-sub">Double blind — don't show your screen</p>
			<div class="char-grid">
				{#each MELEE_CHARS as charId}
				<button class="char-btn" on:click={() => selectChar(charId)} title={CHAR_NAMES[charId]}>
					<img src="/image/characters/{charId}/0/vs-left.png" alt={CHAR_NAMES[charId]} class="char-btn-img" />
				</button>
				{/each}
			</div>
			{/if}
		</div>

		<!-- CHAR LOCK (winner locks) -->
		{:else if phase === 'charLock'}
		<div class="phase-section">
			{#if isWinner}
			{#if myChar !== null && myChar !== undefined}
			<div class="char-picked">
				<img src="/image/characters/{myChar}/0/vs-left.png" alt="" class="char-picked-img" />
				<p class="phase-sub">Locked in — opponent is picking…</p>
			</div>
			{:else}
			<p class="phase-title">Lock your character</p>
			<p class="phase-sub">Visible to opponent</p>
			<div class="char-grid">
				{#each MELEE_CHARS as charId}
				<button class="char-btn" on:click={() => selectChar(charId)} title={CHAR_NAMES[charId]}>
					<img src="/image/characters/{charId}/0/vs-left.png" alt={CHAR_NAMES[charId]} class="char-btn-img" />
				</button>
				{/each}
			</div>
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
				<img src="/image/characters/{myChar}/0/vs-left.png" alt="" class="char-picked-img" />
				<p class="phase-sub">Locked in!</p>
			</div>
			{:else}
			<p class="phase-title">Pick your character</p>
			{#if oppChar !== null && oppChar !== undefined}
			<div class="opp-locked">
				<span class="phase-sub">Opponent locked:</span>
				<img src="/image/characters/{oppChar}/0/vs-left.png" alt="" class="char-sm" />
			</div>
			{/if}
			<div class="char-grid">
				{#each MELEE_CHARS as charId}
				<button class="char-btn" on:click={() => selectChar(charId)} title={CHAR_NAMES[charId]}>
					<img src="/image/characters/{charId}/0/vs-left.png" alt={CHAR_NAMES[charId]} class="char-btn-img" />
				</button>
				{/each}
			</div>
			{/if}
			{:else}
			<p class="phase-title">Opponent is picking their character…</p>
			{#if myChar !== null && myChar !== undefined}
			<div class="char-picked">
				<img src="/image/characters/{myChar}/0/vs-left.png" alt="" class="char-picked-img" />
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
					<img src="/image/characters/{myChar}/0/vs-left.png" alt="" class="char-vs-img" />
					<span>{myName}</span>
				</div>
				{/if}
				<span class="vs-label">vs</span>
				{#if oppChar !== null && oppChar !== undefined}
				<div class="char-vs-side">
					<img src="/image/characters/{oppChar}/0/vs-right.png" alt="" class="char-vs-img" />
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
					on:error={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
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

	.rps-btns { display: flex; gap: 0.75rem; flex-wrap: wrap; }
	.rps-btn {
		flex: 1; min-width: 80px; padding: 1.2rem 0.5rem;
		display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
		font-size: 2rem; background: rgba(255,255,255,0.06);
		border: 1px solid rgba(255,255,255,0.15); border-radius: 0.5rem;
		color: var(--secondary-color); cursor: pointer;
	}
	.rps-btn span { font-size: 0.75rem; }
	.rps-btn:active { background: rgba(255,255,255,0.12); }

	.order-btns { display: flex; flex-direction: column; gap: 0.5rem; }
	.order-btn {
		padding: 0.7rem 1rem; font-size: 0.9rem; font-weight: 600;
		background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.2);
		border-radius: 0.4rem; color: var(--secondary-color); cursor: pointer;
		text-align: left;
	}
	.order-btn:active { background: rgba(64,220,165,0.15); border-color: #40dca5; }

	.stage-grid-p { display: flex; flex-wrap: wrap; gap: 0.5rem; }
	.stage-grid-p--passive { opacity: 0.6; pointer-events: none; }

	.stage-btn {
		position: relative; width: calc(33.3% - 0.34rem);
		min-width: 90px; display: flex; flex-direction: column; align-items: center;
		background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.15);
		border-radius: 0.4rem; overflow: hidden; cursor: pointer;
		font-size: 0.65rem; text-align: center; color: var(--secondary-color);
	}
	.stage-btn:active { border-color: #40dca5; }
	.stage-btn--struck { opacity: 0.3; pointer-events: none; }
	.stage-btn-img { width: 100%; height: 50px; object-fit: cover; display: block; }
	.strike-x {
		position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
		font-size: 1.8rem; color: #ff4444; font-weight: 900;
	}

	.char-grid {
		display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.3rem;
	}
	.char-btn {
		aspect-ratio: 1; background: rgba(255,255,255,0.04);
		border: 1px solid rgba(255,255,255,0.1); border-radius: 0.3rem;
		cursor: pointer; overflow: hidden; padding: 0;
	}
	.char-btn:active { border-color: #40dca5; background: rgba(64,220,165,0.1); }
	.char-btn-img { width: 100%; height: 100%; object-fit: contain; display: block; }

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
