<script lang="ts">
	import {
		currentPlayers,
		gameScore,
		gameState,
		gameSettings,
		gameFrame,
		recentGames,
	} from '$lib/utils/store.svelte';
	import { InGameState } from '$lib/models/enum';
	import { STAGE_DATA } from '$lib/models/constants/stageData';
	import { getWinnerIndex } from '$lib/utils/gamePredicates';

	export let playerNum: 1 | 2;

	$: myIdx = playerNum - 1;
	$: oppIdx = playerNum === 1 ? 1 : 0;

	$: me = $currentPlayers?.[myIdx];
	$: opp = $currentPlayers?.[oppIdx];
	$: myName = me?.displayName?.length ? me.displayName : `P${playerNum}`;
	$: oppName = opp?.displayName?.length ? opp.displayName : `P${playerNum === 1 ? 2 : 1}`;

	$: myScore = $gameScore?.[myIdx] ?? 0;
	$: oppScore = $gameScore?.[oppIdx] ?? 0;

	$: isLive = $gameState !== InGameState.Inactive;

	$: myPIdx = me?.playerIndex ?? myIdx;
	$: oppPIdx = opp?.playerIndex ?? oppIdx;

	$: myFrame = $gameFrame?.players?.[myPIdx]?.post;
	$: oppFrame = $gameFrame?.players?.[oppPIdx]?.post;
	$: myPercent = Math.floor(myFrame?.percent ?? 0);
	$: oppPercent = Math.floor(oppFrame?.percent ?? 0);
	$: myStocks = myFrame?.stocksRemaining ?? 0;
	$: oppStocks = oppFrame?.stocksRemaining ?? 0;
	$: myCharId = $gameSettings?.players?.[myPIdx]?.characterId ?? 0;
	$: oppCharId = $gameSettings?.players?.[oppPIdx]?.characterId ?? 0;
	$: myColorId = $gameSettings?.players?.[myPIdx]?.characterColor ?? 0;
	$: oppColorId = $gameSettings?.players?.[oppPIdx]?.characterColor ?? 0;
	$: stageId = $gameSettings?.stageId ?? -1;
	$: stageName = STAGE_DATA[stageId]?.name ?? '';
	$: gameNum = $recentGames.length + 1;

	const hideOnError = (e: Event) =>
		((e.currentTarget as HTMLImageElement).style.display = 'none');
</script>

<div class="client-root">

	<!-- Score header — always visible -->
	<div class="score-header">
		<div class="score-side score-side--me">
			<span class="score-name">{myName}</span>
			<span class="score-num score-num--me">{myScore}</span>
		</div>
		<span class="score-sep">—</span>
		<div class="score-side score-side--opp">
			<span class="score-num score-num--opp">{oppScore}</span>
			<span class="score-name text-right">{oppName}</span>
		</div>
	</div>

	<!-- Live game -->
	{#if isLive}
	<div class="live-section">
		<div class="live-badge">Game {gameNum} — Live</div>

		<div class="vs-row">
			<!-- My side -->
			<div class="vs-player vs-player--me">
				<img
					class="char-img"
					src="/image/characters/{myCharId}/{myColorId}/vs-left.png"
					alt="P{playerNum}"
					on:error={hideOnError}
				/>
				<div class="vs-info">
					<div class="stocks-row">
						{#each Array(4) as _, i}
							<img
								class="stock-dot"
								class:stock-dot--dead={myStocks <= i}
								src="/image/characters/{myCharId}/{myColorId}/stock.png"
								alt=""
								on:error={hideOnError}
							/>
						{/each}
					</div>
					<span
						class="pct"
						class:pct--high={myPercent >= 100}
						class:pct--danger={myPercent >= 150}
					>{myPercent}%</span>
				</div>
			</div>

			<!-- Stage -->
			<div class="stage-col">
				{#if stageId > 0}
					<img
						class="stage-img"
						src="/image/stages/{stageId}.png"
						alt={stageName}
						on:error={hideOnError}
					/>
				{/if}
				{#if stageName}
					<span class="stage-name">{stageName}</span>
				{/if}
			</div>

			<!-- Opponent side -->
			<div class="vs-player vs-player--opp">
				<img
					class="char-img char-img--flip"
					src="/image/characters/{oppCharId}/{oppColorId}/vs-right.png"
					alt="Opponent"
					on:error={hideOnError}
				/>
				<div class="vs-info vs-info--opp">
					<div class="stocks-row stocks-row--opp">
						{#each Array(4) as _, i}
							<img
								class="stock-dot"
								class:stock-dot--dead={oppStocks <= i}
								src="/image/characters/{oppCharId}/{oppColorId}/stock.png"
								alt=""
								on:error={hideOnError}
							/>
						{/each}
					</div>
					<span
						class="pct text-right"
						class:pct--high={oppPercent >= 100}
						class:pct--danger={oppPercent >= 150}
					>{oppPercent}%</span>
				</div>
			</div>
		</div>
	</div>
	{:else}
	<!-- Waiting state -->
	<div class="waiting-section">
		<span class="waiting-label">Waiting for game</span>
	</div>
	{/if}

	<!-- Game history -->
	{#if $recentGames.length > 0}
	<div class="history-section">
		<p class="section-label">Games</p>
		<div class="history-list">
			{#each $recentGames as game, i}
				{@const wi = getWinnerIndex(game)}
				{@const gc = game.settings?.players?.[myPIdx]?.characterId ?? 0}
				{@const gcol = game.settings?.players?.[myPIdx]?.characterColor ?? 0}
				{@const oc = game.settings?.players?.[oppPIdx]?.characterId ?? 0}
				{@const ocol = game.settings?.players?.[oppPIdx]?.characterColor ?? 0}
				{@const gs = STAGE_DATA[game.settings?.stageId ?? -1]?.name ?? '—'}
				{@const iWon = wi === myPIdx}
				<div class="history-row" class:history-row--win={iWon} class:history-row--loss={!iWon}>
					<span class="h-label">G{i + 1}</span>
					<img class="h-char" src="/image/characters/{gc}/{gcol}/stock.png" alt="" on:error={hideOnError} />
					<span class="h-stage">{gs}</span>
					<img class="h-char h-char--opp" src="/image/characters/{oc}/{ocol}/stock.png" alt="" on:error={hideOnError} />
					<span class="h-result" class:h-result--win={iWon} class:h-result--loss={!iWon}>{iWon ? 'W' : 'L'}</span>
				</div>
			{/each}
		</div>
	</div>
	{/if}

	<!-- Action area: locked during game, open between games -->
	<div class="action-area" class:action-area--locked={isLive}>
		{#if isLive}
			<div class="locked-notice">Game in progress — controls available after the game ends</div>
		{:else}
			<div class="idle-notice">
				<span class="idle-label">Stage striking coming soon</span>
				<p class="idle-hint">Character select and stage striking will appear here during a set.</p>
			</div>
		{/if}
	</div>

</div>

<style>
	.client-root {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		min-height: 100dvh;
		box-sizing: border-box;
		color: var(--secondary-color);
		background-color: var(--primary-color);
	}

	/* Score header */
	.score-header {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 0.75rem;
		border-radius: 0.25rem;
		border: 1px solid rgba(128, 128, 128, 0.2);
	}

	.score-side {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.score-side--opp {
		justify-content: flex-end;
	}

	.score-name {
		font-size: 0.8rem;
		font-weight: 600;
		opacity: 0.75;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.score-num {
		font-size: 2rem;
		font-weight: 800;
		line-height: 1;
		color: var(--secondary-color);
	}

	.score-num--me {
		color: rgb(96, 165, 250);
	}

	.score-sep {
		font-size: 1rem;
		opacity: 0.3;
		text-align: center;
	}

	/* Live section */
	.live-section {
		border-radius: 0.25rem;
		border: 1px solid rgba(34, 197, 94, 0.3);
		padding: 0.75rem;
		background: rgba(34, 197, 94, 0.04);
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.live-badge {
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgb(34, 197, 94);
	}

	.vs-row {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 0.5rem;
	}

	.vs-player {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.vs-player--opp {
		justify-content: flex-end;
		flex-direction: row-reverse;
	}

	.char-img {
		width: 64px;
		height: auto;
		object-fit: contain;
		object-position: bottom;
	}

	.char-img--flip {
		transform: scaleX(-1);
	}

	.vs-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.vs-info--opp {
		align-items: flex-end;
	}

	.stocks-row {
		display: flex;
		gap: 2px;
	}

	.stocks-row--opp {
		flex-direction: row-reverse;
	}

	.stock-dot {
		width: 0.9rem;
		height: 0.9rem;
		object-fit: contain;
	}

	.stock-dot--dead {
		opacity: 0.12;
	}

	.pct {
		font-size: 1.4rem;
		font-weight: 800;
		line-height: 1;
		font-family: monospace;
		color: var(--secondary-color);
	}

	.pct--high { color: rgb(234, 179, 8); }
	.pct--danger { color: rgb(239, 68, 68); }

	.stage-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.stage-img {
		width: 70px;
		height: auto;
		border-radius: 0.2rem;
		opacity: 0.8;
		object-fit: cover;
	}

	.stage-name {
		font-size: 0.6rem;
		opacity: 0.4;
		text-align: center;
		white-space: nowrap;
	}

	/* Waiting */
	.waiting-section {
		padding: 1.5rem;
		text-align: center;
		border-radius: 0.25rem;
		border: 1px solid rgba(128, 128, 128, 0.15);
	}

	.waiting-label {
		font-size: 0.8rem;
		opacity: 0.3;
		font-weight: 500;
	}

	/* History */
	.history-section {
		border-radius: 0.25rem;
		border: 1px solid rgba(128, 128, 128, 0.2);
		padding: 0.75rem;
	}

	.section-label {
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.35;
		margin-bottom: 0.5rem;
	}

	.history-list {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.history-row {
		display: grid;
		grid-template-columns: 1.5rem 1.25rem 1fr 1.25rem 1.5rem;
		align-items: center;
		gap: 0.4rem;
		padding: 0.25rem 0.35rem;
		border-radius: 0.2rem;
	}

	.history-row--win {
		background: rgba(34, 197, 94, 0.06);
	}

	.history-row--loss {
		background: rgba(239, 68, 68, 0.04);
	}

	.h-label {
		font-size: 0.65rem;
		font-weight: 600;
		opacity: 0.4;
	}

	.h-char {
		width: 1.25rem;
		height: 1.25rem;
		object-fit: contain;
	}

	.h-char--opp {
		opacity: 0.45;
	}

	.h-stage {
		font-size: 0.7rem;
		opacity: 0.45;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.h-result {
		font-size: 0.65rem;
		font-weight: 700;
		text-align: right;
	}

	.h-result--win { color: rgb(34, 197, 94); }
	.h-result--loss { color: rgb(239, 68, 68); opacity: 0.6; }

	/* Action area */
	.action-area {
		flex: 1;
		border-radius: 0.25rem;
		border: 1px solid rgba(128, 128, 128, 0.15);
		padding: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 80px;
		transition: opacity 0.2s;
	}

	.action-area--locked {
		opacity: 0.4;
		pointer-events: none;
	}

	.locked-notice {
		font-size: 0.75rem;
		opacity: 0.5;
		text-align: center;
	}

	.idle-notice {
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.idle-label {
		font-size: 0.8rem;
		font-weight: 600;
		opacity: 0.5;
	}

	.idle-hint {
		font-size: 0.7rem;
		opacity: 0.3;
		line-height: 1.5;
	}
</style>
