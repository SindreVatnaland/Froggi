<script lang="ts">
	import { bingoSession, bingoLobby, ironManSession, ironManLobby, ironManCurrentChar, currentPlayer, bingoRevertMessage, bingoVoteState } from '$lib/utils/store.svelte';
	import { scale, fly, fade } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import { IRONMAN_CHAR_NAMES, IRONMAN_CHAR_FALLBACK } from '$lib/models/types/ironman';
	import BingoBoardGrid from '$lib/components/bingo/BingoBoardGrid.svelte';
	import IronManRosterGrid from '$lib/components/ironman/IronManRosterGrid.svelte';
	import SlippiAd from '$lib/components/SlippiAd.svelte';
	// @ts-ignore
	import QrCode from 'svelte-qrcode';

	// ── Active game detection ──────────────────────────────────────────────────
	// displayBingoBoard persists after session clears so the overlay stays visible
	$: activeGame = $ironManSession ? 'ironman' : ($bingoSession || displayBingoBoard) ? 'bingo' : null;

	// ── Bingo state ───────────────────────────────────────────────────────────
	$: bingoBoard = $bingoSession?.board;
	let displayBingoBoard = bingoBoard;
	$: if (bingoBoard) displayBingoBoard = bingoBoard;
	$: bingoSize = displayBingoBoard?.size ?? 5;
	$: bingoRole = $bingoSession?.role ?? 'solo';
	$: localName = $currentPlayer?.displayName || 'You';
	$: opponentName = $bingoSession?.opponentName ?? null;

	$: winState = $bingoSession?.winState ?? null;
	$: localWinBoxes = new Set<number>(winState?.localWinBoxIndices ?? []);
	$: oppWinBoxes = new Set<number>(winState?.oppWinBoxIndices ?? []);
	$: localControlledLines = winState?.localControlledLines ?? [];
	$: oppControlledLines = winState?.oppControlledLines ?? [];
	$: bingoHasWon = winState?.hasWon ?? false;
	$: localScore = winState?.localScore ?? 0;
	$: oppScore = winState?.oppScore ?? null;
	$: scoreTarget = winState?.scoreTarget ?? 3;
	$: localWinner = winState?.localWinner ?? false;
	$: oppWinner = winState?.oppWinner ?? false;

	$: vote = $bingoVoteState;
	$: voteActive = vote?.active ?? false;
	$: localVoteActive = voteActive && (vote?.forRole === bingoRole || vote?.forRole === 'all');
	$: oppVoteActive = voteActive && vote?.forRole !== bingoRole;
	$: voteTimeLeft = (() => {
		if (!vote?.active) return null;
		return Math.max(0, Math.floor((vote.startedAt + vote.durationMs - now) / 1000));
	})();
	$: voteTotalVotes = vote?.options.reduce((s, o) => s + o.votes, 0) ?? 0;

	const cookingWords = ['cooking', 'vibing', 'plotting', 'scheming', 'rolling', 'heating up', 'stirring', 'brewing', 'deciding', 'gaming', 'locked in', 'calculating', 'big braining', 'in the lab', 'going ham', 'menacing', 'cooked', 'going wild', 'touched', 'activated', 'theory crafting', 'in shambles', 'speedrunning', 'doomscrolling', 'enlightened'];
	let cookingWordIdx = 0;
	let cookingText = '';
	function startCookingTyper() {
		const word = cookingWords[cookingWordIdx];
		let i = 0;
		function type() {
			cookingText = word.slice(0, i);
			if (i < word.length) { i++; setTimeout(type, 65); }
			else setTimeout(eraseWord, 3000);
		}
		function eraseWord() {
			if (i > 0) { cookingText = word.slice(0, --i); setTimeout(eraseWord, 40); }
			else { cookingWordIdx = (cookingWordIdx + 1) % cookingWords.length; setTimeout(startCookingTyper, 150); }
		}
		type();
	}
	startCookingTyper();

	// ── Bingo timer ────────────────────────────────────────────────────────────
	let now = Date.now();
	setInterval(() => (now = Date.now()), 1000);

	$: timerEnabled = $bingoSession?.settings?.timer?.enabled ?? false;
	$: timerSecondsLeft = (() => {
		if (!timerEnabled || !$bingoSession) return null;
		const end = $bingoSession.startedAt + $bingoSession.settings.timer.durationMinutes * 60 * 1000;
		return Math.max(0, Math.floor((end - now) / 1000));
	})();

	function formatTime(s: number): string {
		const h = Math.floor(s / 3600);
		const m = Math.floor((s % 3600) / 60);
		const sec = s % 60;
		if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
		return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
	}

	// ── Bingo win animation ────────────────────────────────────────────────────
	type AnimPhase = 'idle' | 'playing' | 'exit' | 'winner' | 'winner-ad';
	let animPhase: AnimPhase = 'idle';
	let isLocalWinner = false;
	let exitingBoxIndices = new Set<number>();
	let winElapsedSeconds = 0;
	let prevBoardId: string | null = null;
	let winTriggered = false;
	let exitTimers: ReturnType<typeof setTimeout>[] = [];

	function clearExitTimers() {
		exitTimers.forEach(clearTimeout);
		exitTimers = [];
	}

	$: {
		const boardId = bingoBoard?.id ?? null;
		if (boardId !== prevBoardId) {
			prevBoardId = boardId;
			clearExitTimers();
			winTriggered = false;
			exitingBoxIndices = new Set();
			animPhase = boardId ? 'playing' : 'idle';
		}
	}

	$: if (animPhase === 'playing' && bingoBoard && !winTriggered && bingoHasWon) {
		winTriggered = true;
		winElapsedSeconds = $bingoSession ? Math.floor((now - $bingoSession.startedAt) / 1000) : 0;
		isLocalWinner = winState?.localWinner ?? false;
		triggerWinExit(bingoBoard.boxes.length);
	}

	function triggerWinExit(count: number) {
		animPhase = 'exit';
		const order = shuffleIndices(count);
		order.forEach((idx, step) => {
			exitTimers.push(setTimeout(() => {
				exitingBoxIndices = new Set([...exitingBoxIndices, idx]);
			}, Math.floor((step / count) * 900)));
		});
		exitTimers.push(setTimeout(() => { animPhase = 'winner'; }, 1300));
		exitTimers.push(setTimeout(() => { animPhase = 'winner-ad'; }, 11300));
		exitTimers.push(setTimeout(() => { animPhase = 'playing'; }, 181300));
	}

	function shuffleIndices(n: number): number[] {
		const arr = Array.from({ length: n }, (_, i) => i);
		for (let i = n - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}


	// ── Iron Man state ─────────────────────────────────────────────────────────
	$: imSession = $ironManSession;
	$: imLocalRoster = imSession?.localRoster ?? null;
	$: imOpponentRoster = imSession?.opponentRoster ?? null;
	$: imRole = imSession?.role ?? 'solo';
	$: imLocalName = imSession?.localName ?? 'You';
	$: imOpponentName = imSession?.opponentName ?? 'Opponent';
	$: imWinner = imSession?.winner ?? null;
	$: imSettings = imSession?.settings;
	$: imVariant = imSettings?.variant ?? 'standard';

	$: imActiveSlot = (() => {
		if (!imLocalRoster || (imVariant !== 'full_roster' && imVariant !== 'challenge')) return null;
		if (imLocalRoster.currentIndex >= imLocalRoster.slots.length) return null;
		return imLocalRoster.slots[imLocalRoster.currentIndex];
	})();

	$: imIconSize = imLocalRoster
		? `${Math.max(3.5, Math.min(9, 65 / imLocalRoster.slots.length))}vmin`
		: null;
</script>

<div class="overlay-root">

	{#if !activeGame}
		<!-- Waiting screen -->
		<div class="overlay-page" in:fade={{ duration: 350, delay: 200 }} out:fade={{ duration: 200 }}>
			<div class="no-session">
				<div class="no-session-header">
					<img src="/icon.png" alt="Froggi" class="no-session-icon" />
					<span class="no-session-name">Froggi</span>
				</div>
				{#if $bingoLobby?.opponentConnected || $ironManLobby?.opponentConnected}
					<span class="no-session-text">Ready to start</span>
				{:else if $bingoLobby || $ironManLobby}
					<span class="no-session-text">Waiting for opponent…</span>
				{:else}
					<span class="no-session-text">No active game</span>
				{/if}
				<div class="no-session-qr">
					<QrCode value="https://sindrevatnaland.github.io/Froggi/" size="100" color="#ffffff" background="#111111" />
					<span class="no-session-url">sindrevatnaland.github.io/Froggi</span>
				</div>
			</div>
		</div>

	{:else if activeGame === 'ironman' && imSession && imLocalRoster}
		<!-- Iron Man overlay -->
		<div class="overlay-page overlay-page--game im-page" out:fade={{ duration: 200 }}>
			{#if imWinner}
				<div class="win-screen" class:win-screen--winner={imWinner === 'local'} in:scale={{ duration: 450, start: 0.75, easing: backOut }}>
					<div class="win-crown">{imWinner === 'local' ? '🏆' : '💀'}</div>
					<div class="win-title" class:win-title--loser={imWinner !== 'local'}>IRON MAN!</div>
					<div class="win-subtitle">
						{imWinner === 'local' ? `${imLocalName} wins!` : `${imOpponentName} wins!`}
					</div>
				</div>
			{:else}
				<div class="im-rosters">
					<div class="im-roster-col im-roster-col--local">
						<p class="im-player-name">{imLocalName}</p>
						<IronManRosterGrid
							roster={imLocalRoster}
							settings={imSession.settings}
							isLocal={true}
							variant={imVariant}
							activeGameCharId={$ironManCurrentChar.localCharId}
							iconSizeOverride={imIconSize}
						/>
					</div>
					{#if imOpponentRoster && imRole !== 'solo'}
						<div class="im-divider">VS</div>
						<div class="im-roster-col im-roster-col--opp">
							<p class="im-player-name">{imOpponentName}</p>
							<IronManRosterGrid
								roster={imOpponentRoster}
								settings={imSession.settings}
								isLocal={false}
								obscured={imSession.settings.hideOpponent}
								variant={imVariant}
								activeGameCharId={$ironManCurrentChar.oppCharId}
								iconSizeOverride={imIconSize}
							/>
						</div>
					{/if}
				</div>

				{#if imActiveSlot}
					<div class="im-next-char" in:fly={{ y: 8, duration: 200 }}>
						<img
							src="/image/characters/css/{IRONMAN_CHAR_FALLBACK[imActiveSlot.characterId] ?? imActiveSlot.characterId}.png"
							alt={IRONMAN_CHAR_NAMES[imActiveSlot.characterId]}
							class="im-next-icon"
						/>
						<span class="im-next-label">Next: {IRONMAN_CHAR_NAMES[imActiveSlot.characterId]}</span>
					</div>
				{/if}
			{/if}
		</div>

	{:else if activeGame === 'bingo'}
		<!-- Bingo overlay -->
		{#if animPhase === 'winner'}
			<div class="overlay-page" out:fade={{ duration: 220 }}>
				<div class="win-screen" class:win-screen--winner={isLocalWinner} in:scale={{ duration: 400, start: 0.75, easing: backOut }}>
					<div class="win-crown">{isLocalWinner ? '🏆' : '💀'}</div>
					<div class="win-title" class:win-title--loser={!isLocalWinner}>BINGO!</div>
					<div class="win-subtitle">{isLocalWinner ? `${localName} wins!` : 'Opponent wins'}</div>
					<div class="win-time">Completed in {formatTime(winElapsedSeconds)}</div>
				</div>
			</div>
		{:else if animPhase === 'winner-ad'}
			<div class="overlay-page" out:fade={{ duration: 220 }}>
				<div class="froggi-ad" in:scale={{ duration: 500, start: 0.82, easing: backOut }}>
					<div class="froggi-ad-header">
						<img src="/icon.png" alt="Froggi" class="froggi-ad-icon" />
						<span class="froggi-ad-name">Froggi</span>
					</div>
					<SlippiAd />
					<div class="froggi-ad-qr">
						<QrCode value="https://sindrevatnaland.github.io/Froggi/" size="90" color="#ffffff" background="#111111" />
						<span class="froggi-ad-url">sindrevatnaland.github.io/Froggi</span>
					</div>
				</div>
			</div>
		{:else}
			<div class="overlay-page overlay-page--game" out:fade={{ duration: 220 }}>
				{#if $bingoRevertMessage}
					<div class="revert-backdrop" in:fade={{ duration: 180 }} out:fade={{ duration: 200 }}>
						<div class="revert-popup" in:scale={{ start: 0.9, duration: 300, easing: backOut }} out:scale={{ start: 0.9, duration: 180 }}>
							<span class="revert-icon">↩</span>
							<p class="revert-title">{$bingoRevertMessage.split(' — ')[0]}</p>
							<p class="revert-sub">{$bingoRevertMessage.split(' — ')[1] ?? ''}</p>
						</div>
					</div>
				{/if}
				<div class="board-wrap">
					{#if animPhase === 'exit'}
						<div class="exit-backdrop" class:exit-backdrop--winner={isLocalWinner} in:fade={{ duration: 300 }}>
							BINGO!
						</div>
					{/if}
					{#if vote && !vote.active && vote.result && animPhase !== 'exit'}
						<div class="vote-result-overlay" in:fade={{ duration: 300, delay: 400 }} out:fade={{ duration: 200 }}>
							<div class="vote-result-card" in:fly={{ y: -16, duration: 380, delay: 400, easing: backOut }}>
								<div class="vote-result-label">Chat voted</div>
								<div class="vote-result-action">{vote.result.description}</div>
							</div>
						</div>
					{/if}
					{#if timerSecondsLeft !== null && animPhase !== 'exit'}
						<div class="timer" class:timer--urgent={timerSecondsLeft <= 300}>
							{timerSecondsLeft === 0 ? "⏱ Time's up!" : `⏱ ${formatTime(timerSecondsLeft)}`}
						</div>
					{/if}
					<div style="width:100%; aspect-ratio:1/1; flex-shrink:0; overflow:visible; --bingo-font-size:2.8vmin; --bingo-char-size:6vmin; --bingo-char-size-lg:8vmin; --bingo-sub-size:2.2vmin; --bingo-badge-size:2vmin; --bingo-desc-size:1.9vmin; --bingo-gap:3px; --bingo-radius:4px; --bingo-frozen-icon-lg:3.5em; --bingo-frozen-cd-lg:2.2em;">
						<BingoBoardGrid
							boxes={displayBingoBoard?.boxes ?? []}
							size={bingoSize}
							role={bingoRole}
							{localWinBoxes}
							{oppWinBoxes}
							{exitingBoxIndices}
							{isLocalWinner}
							{localControlledLines}
							{oppControlledLines}
							animateEntry={true}
						/>
					</div>
					{#if animPhase !== 'exit' && winState}
						<div class="pb-wrap">
							<div class="pb-player">
								<div class="pb-header">
									<span class="pb-name">{$bingoSession?.localName || localName}</span>
									{#if localVoteActive}
										<span class="pb-cooking">chat is {cookingText}…</span>
									{/if}
									<span class="pb-score" class:pb-score--winner={localWinner}>{localScore}<span class="pb-of">/{scoreTarget}</span></span>
								</div>
								<div class="pb-track">
									<div class="pb-fill pb-fill--local" class:pb-fill--winner={localWinner} style="width:{Math.min(100, (localScore / scoreTarget) * 100)}%"></div>
								</div>
							</div>
							{#if oppScore !== null}
								<div class="pb-player">
									<div class="pb-header">
										<span class="pb-name">{opponentName ?? 'Opponent'}</span>
										{#if oppVoteActive}
											<span class="pb-cooking">chat is {cookingText}…</span>
										{/if}
										<span class="pb-score" class:pb-score--winner={oppWinner}>{oppScore}<span class="pb-of">/{scoreTarget}</span></span>
									</div>
									<div class="pb-track">
										<div class="pb-fill pb-fill--opp" class:pb-fill--winner={oppWinner} style="width:{Math.min(100, (oppScore / scoreTarget) * 100)}%"></div>
									</div>
								</div>
							{/if}
						</div>
					{/if}
				{#if localVoteActive && vote && animPhase !== 'exit'}
					<div class="vote-banner" class:vote-banner--special={vote.special} in:fly={{ y: 8, duration: 300 }} out:fade={{ duration: 180 }}>
						<div class="vote-title">{vote.question ?? 'Chat Vote'}</div>
						<div class="vote-options">
							{#each vote.options as opt, i}
								<div class="vote-opt">
									<div class="vote-opt-top">
										<span class="vote-key">{i + 1}</span>
										<span class="vote-label">{opt.label}</span>
										<span class="vote-pct">{voteTotalVotes > 0 ? Math.round(opt.votes / voteTotalVotes * 100) : 0}%</span>
									</div>
									<div class="vote-bar-track">
										<div class="vote-bar-fill" style="width:{voteTotalVotes > 0 ? Math.round(opt.votes / voteTotalVotes * 100) : 0}%"></div>
									</div>
								</div>
							{/each}
						</div>
						{#if voteTimeLeft !== null}
							<div class="vote-timer">{voteTimeLeft}s</div>
						{/if}
					</div>
				{/if}
				</div>
			</div>
		{/if}
	{/if}

</div>

<style>
	:global(html), :global(body) {
		background: transparent !important;
		margin: 0 !important;
		padding: 0 !important;
		overflow: hidden !important;
		width: 100%;
		height: 100%;
	}

	.overlay-root {
		position: fixed;
		inset: 0;
		overflow: hidden;
	}

	.overlay-page {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		overflow: hidden;
	}

	.overlay-page--game {
		justify-content: flex-start;
		padding-top: 6px;
	}

	/* ── Waiting ── */
	.no-session {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5vmin;
		background: rgba(0,0,0,0.7);
		padding: 3vmin 4vmin;
		border-radius: 8px;
		font-family: sans-serif;
	}

	.no-session-header { display: flex; align-items: center; gap: 1.5vmin; }
	.no-session-icon { width: 9vmin; height: 9vmin; object-fit: contain; image-rendering: pixelated; }
	.no-session-name { font-size: 5vmin; font-weight: 800; color: rgba(255,255,255,0.95); letter-spacing: 0.05em; }
	.no-session-text { font-size: 3.2vmin; font-weight: 600; color: rgba(255,255,255,0.6); letter-spacing: 0.02em; }
	.no-session-qr { display: flex; flex-direction: column; align-items: center; gap: 0.6vmin; margin-top: 2vmin; opacity: 0.5; }
	.no-session-url { font-size: 1.8vmin; color: rgba(255,255,255,0.8); font-family: sans-serif; }

	/* ── Iron Man ── */
	.im-page {
		flex-direction: column;
		gap: 2vmin;
		padding: 2vmin;
	}


	.im-rosters {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		gap: 3vmin;
		flex: 1;
		width: 100%;
	}

	.im-roster-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1vmin;
		min-width: 0;
	}

	.im-roster-col--local { flex: 55; }
	.im-roster-col--opp   { flex: 45; }

	.im-player-name {
		font-size: 3vmin;
		font-weight: 700;
		font-family: sans-serif;
		color: rgba(255,255,255,0.95);
		letter-spacing: 0.04em;
		text-shadow: 0 0 10px rgba(0,0,0,0.98), 0 1px 5px rgba(0,0,0,0.95), 0 0 25px rgba(0,0,0,0.8);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}

	.im-divider {
		font-size: 2.4vmin;
		color: rgba(255,255,255,0.25);
		font-family: sans-serif;
		font-weight: 600;
		padding-top: 4vmin;
		flex-shrink: 0;
	}

	.im-next-char {
		display: flex;
		align-items: center;
		gap: 1.5vmin;
		background: rgba(0,0,0,0.55);
		padding: 1.2vmin 2.5vmin;
		border-radius: 6px;
	}

	.im-next-icon {
		width: 6vmin;
		height: 6vmin;
		object-fit: contain;
	}

	.im-next-label {
		font-size: 2.2vmin;
		font-weight: 600;
		font-family: sans-serif;
		color: rgba(255,255,255,0.8);
	}

	/* ── Froggi ad ── */
	.froggi-ad {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2.5vmin;
		background: rgba(0,0,0,0.9);
		padding: 4vmin 5vmin;
		border-radius: 14px;
		font-family: sans-serif;
		border: 2px solid rgba(255,255,255,0.08);
	}

	.froggi-ad-header { display: flex; align-items: center; gap: 1.5vmin; }
	.froggi-ad-icon { width: 8vmin; height: 8vmin; object-fit: contain; image-rendering: pixelated; }
	.froggi-ad-name { font-size: 5.5vmin; font-weight: 800; color: rgba(255,255,255,0.9); letter-spacing: 0.05em; }

	.froggi-ad-qr { display: flex; flex-direction: column; align-items: center; gap: 0.8vmin; opacity: 0.55; }
	.froggi-ad-url { font-size: 1.8vmin; color: rgba(255,255,255,0.85); }

	/* ── Bingo win screen ── */
	.win-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5vmin;
		background: rgba(0,0,0,0.88);
		padding: 4vmin 6vmin;
		border-radius: 12px;
		font-family: sans-serif;
		border: 2px solid rgba(255,255,255,0.12);
	}

	.win-screen--winner { border-color: rgba(255,215,0,0.4); box-shadow: 0 0 40px rgba(255,215,0,0.15); }
	.win-crown { font-size: 6vmin; }
	.win-title { font-size: 10vmin; font-weight: 900; color: #fff; letter-spacing: 0.2em; text-shadow: 0 0 30px rgba(255,255,255,0.6); animation: flash 1s ease-in-out infinite; }
	.win-title--loser { color: rgba(255,255,255,0.55); text-shadow: none; animation: none; }
	.win-subtitle { font-size: 2.8vmin; font-weight: 700; color: rgba(255,255,255,0.8); letter-spacing: 0.08em; text-transform: uppercase; }
	.win-time { font-size: 2vmin; color: rgba(255,255,255,0.5); }

	/* ── Bingo board ── */
	.board-wrap {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 4px;
		width: min(100vw, 100vh);
		z-index: 1;
	}

	.exit-backdrop {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12vmin;
		font-weight: 900;
		font-family: sans-serif;
		color: rgba(255,255,255,0.15);
		letter-spacing: 0.2em;
		z-index: 0;
		pointer-events: none;
	}

	.exit-backdrop--winner { color: rgba(255,215,0,0.25); }

	.timer {
		width: 100%;
		text-align: center;
		font-size: 3.5vmin;
		font-weight: 700;
		font-family: sans-serif;
		color: rgba(255,255,255,0.9);
		background: rgba(0,0,0,0.6);
		border-radius: 4px;
		padding: 1vmin 0;
		letter-spacing: 0.05em;
		flex-shrink: 0;
		z-index: 1;
	}

	.timer--urgent { color: #f87171; animation: flash 1s ease-in-out infinite; }

	.pb-wrap {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.8vmin;
		padding: 1.2vmin 0.5vmin 0.4vmin;
		flex-shrink: 0;
	}

	.pb-player {
		display: flex;
		flex-direction: column;
		gap: 0.3vmin;
	}

	.pb-header {
		display: flex;
		align-items: baseline;
		gap: 0.8vmin;
	}

	.pb-name {
		font-size: 2.4vmin;
		font-weight: 700;
		color: rgba(255,255,255,0.7);
		letter-spacing: 0.05em;
		text-transform: uppercase;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-family: sans-serif;
		flex-shrink: 0;
	}

	.pb-cooking {
		font-size: 2.4vmin;
		font-style: italic;
		color: rgba(255,255,255,0.5);
		font-family: sans-serif;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		animation: cooking-pulse 2.2s ease-in-out infinite;
	}

	@keyframes cooking-pulse {
		0%, 100% { opacity: 0.45; }
		50% { opacity: 1; color: rgba(250, 204, 21, 0.85); }
	}

	.pb-score {
		font-size: 2.2vmin;
		font-weight: 700;
		font-family: sans-serif;
		color: rgba(255,255,255,0.75);
		margin-left: auto;
		flex-shrink: 0;
		line-height: 1;
	}

	.pb-score--winner { color: #4ade80; }

	.pb-of {
		font-size: 1.2vmin;
		opacity: 0.45;
		font-weight: 400;
	}

	.pb-track {
		width: 100%;
		height: 0.35vmin;
		border-radius: 999px;
		background: rgba(255,255,255,0.1);
		overflow: hidden;
	}

	.pb-fill {
		height: 100%;
		border-radius: 999px;
		transition: width 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
	}

	.pb-fill--local { background: rgba(74, 222, 128, 0.85); }
	.pb-fill--opp   { background: rgba(248, 113, 113, 0.85); }
	.pb-fill--winner { background: rgba(74, 222, 128, 0.95); }

	/* ── Vote banner ── */
	.vote-banner {
		position: relative;
		width: 100%;
		background: rgba(0,0,0,0.88);
		border: 1.5px solid rgba(255,255,255,0.12);
		border-radius: 8px;
		padding: 2vmin 7vmin 2vmin 2.5vmin;
		display: flex;
		flex-direction: column;
		gap: 1.2vmin;
		flex-shrink: 0;
		font-family: sans-serif;
		animation: vote-flash-in 1s ease-out both;
	}

	@keyframes vote-flash-in {
		0%   { border-color: rgba(250,204,21,0.9); background: rgba(250,204,21,0.22); box-shadow: 0 0 24px rgba(250,204,21,0.4); }
		40%  { border-color: rgba(250,204,21,0.6); background: rgba(250,204,21,0.1);  box-shadow: 0 0 12px rgba(250,204,21,0.2); }
		100% { border-color: rgba(255,255,255,0.12); background: rgba(0,0,0,0.88); box-shadow: none; }
	}

	.vote-banner--special { border-color: rgba(255,215,0,0.45); }

	.vote-title {
		font-size: 4.5vmin;
		font-weight: 800;
		color: rgba(255,255,255,0.95);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.vote-options {
		display: flex;
		flex-direction: column;
		gap: 1vmin;
	}

	.vote-opt {
		display: flex;
		flex-direction: column;
		gap: 0.4vmin;
	}

	.vote-opt-top {
		display: flex;
		align-items: center;
		gap: 1.2vmin;
	}

	.vote-key {
		font-size: 2.8vmin;
		font-weight: 800;
		color: rgba(255,255,255,0.9);
		background: rgba(255,255,255,0.1);
		border-radius: 4px;
		width: 4.5vmin;
		height: 4.5vmin;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.vote-label {
		font-size: 3vmin;
		font-weight: 700;
		color: rgba(255,255,255,0.85);
		flex: 1;
	}

	.vote-pct {
		font-size: 2.5vmin;
		font-weight: 700;
		color: rgba(255,255,255,0.6);
		flex-shrink: 0;
	}

	.vote-bar-track {
		width: 100%;
		height: 0.6vmin;
		border-radius: 999px;
		background: rgba(255,255,255,0.1);
		overflow: hidden;
	}

	.vote-bar-fill {
		height: 100%;
		border-radius: 999px;
		background: rgba(250,204,21,0.8);
		transition: width 0.4s ease;
	}

	.vote-timer {
		position: absolute;
		top: 1.5vmin;
		right: 2vmin;
		font-size: 3.5vmin;
		font-weight: 800;
		color: rgba(250, 204, 21, 0.9);
		font-family: sans-serif;
		font-variant-numeric: tabular-nums;
	}

	/* ── Vote result popup ── */
	.vote-result-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0,0,0,0.65);
		z-index: 10;
		pointer-events: none;
		padding: 4vmin;
	}

	.vote-result-card {
		background: rgba(10,10,10,0.97);
		border: 2px solid rgba(250,204,21,0.55);
		border-radius: 14px;
		padding: 3.5vmin 6vmin;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1vmin;
		text-align: center;
		font-family: sans-serif;
		box-shadow: 0 0 40px rgba(250,204,21,0.2);
	}

	.vote-result-label {
		font-size: 2.2vmin;
		font-weight: 600;
		color: rgba(250, 204, 21, 0.75);
		text-transform: uppercase;
		letter-spacing: 0.12em;
	}

	.vote-result-action {
		font-size: 5vmin;
		font-weight: 900;
		color: #fff;
		letter-spacing: 0.02em;
		line-height: 1.1;
	}

	/* ── Revert popup ── */
	.revert-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.52);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
		pointer-events: none;
	}

	.revert-popup {
		background: rgba(10,10,10,0.97);
		border: 2px solid rgba(220,115,0,0.6);
		border-radius: 14px;
		padding: 3vmin 5.5vmin;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.8vmin;
		font-family: sans-serif;
		text-align: center;
	}

	.revert-icon { font-size: 5.5vmin; line-height: 1; margin-bottom: 0.4vmin; }
	.revert-title { font-size: 4vmin; font-weight: 800; color: rgba(255,255,255,0.95); margin: 0; }
	.revert-sub { font-size: 2.2vmin; font-weight: 500; color: rgba(255,185,80,0.85); margin: 0; text-transform: uppercase; letter-spacing: 0.06em; }

	@keyframes flash {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
</style>
