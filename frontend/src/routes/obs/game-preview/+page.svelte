<script lang="ts">
	import { bingoSession, bingoLobby, ironManSession, ironManLobby, ironManCurrentChar, currentPlayer, bingoRevertMessage, bingoVoteStates } from '$lib/utils/store.svelte';
	import { scale, fly, fade } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import { IRONMAN_CHAR_NAMES, IRONMAN_CHAR_FALLBACK } from '$lib/models/types/ironman';
	import { onMount } from 'svelte';
	import BingoBoardGrid from '$lib/components/bingo/BingoBoardGrid.svelte';
	import IronManRosterGrid from '$lib/components/ironman/IronManRosterGrid.svelte';
	import SlippiAd from '$lib/components/SlippiAd.svelte';
	// @ts-ignore
	import QrCode from 'svelte-qrcode';

	let isPopup = false;
	onMount(() => {
		isPopup = new URLSearchParams(location.search).get('popup') === '1';
		if (isPopup) {
			document.documentElement.style.setProperty('--overlay-bg', '#111');
		}
	});

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
	$: localWinTiles = new Set<number>(winState?.localWinTileIndices ?? []);
	$: oppWinTiles = new Set<number>(winState?.oppWinTileIndices ?? []);
	$: localControlledLines = winState?.localControlledLines ?? [];
	$: oppControlledLines = winState?.oppControlledLines ?? [];
	$: bingoHasWon = winState?.hasWon ?? false;
	$: localScore = winState?.localScore ?? 0;
	$: oppScore = winState?.oppScore ?? null;
	$: scoreTarget = winState?.scoreTarget ?? 3;
	$: localWinner = winState?.localWinner ?? false;
	$: oppWinner = winState?.oppWinner ?? false;

	// Local vote = the vote whose forRole matches local player's role (or 'all')
	$: localVote = (() => {
		if (!$bingoVoteStates) return null;
		const byRole = $bingoVoteStates[bingoRole as 'host' | 'guest'] ?? null;
		if (byRole) return byRole;
		// solo mode: host slot with forRole 'all'
		const host = $bingoVoteStates.host;
		if (host?.forRole === 'all') return host;
		return null;
	})();
	$: oppVote = (() => {
		if (!$bingoVoteStates || bingoRole === 'solo') return null;
		const oppRole = bingoRole === 'host' ? 'guest' : 'host';
		return $bingoVoteStates[oppRole] ?? null;
	})();
	$: localVoteActive = localVote?.active ?? false;
	$: oppVoteActive = oppVote?.active ?? false;
	$: voteTimeLeft = (() => {
		if (!localVote?.active) return null;
		return Math.max(0, Math.floor((localVote.startedAt + localVote.durationMs - now) / 1000));
	})();
	$: voteTotalVotes = localVote?.options.reduce((s, o) => s + o.votes, 0) ?? 0;

	// Backend serializes result popups — just reflect the current state
	interface VoteResult { description: string; channelName: string }
	$: currentVoteResult = (() => {
		if (!$bingoVoteStates) return null as VoteResult | null;
		const h = $bingoVoteStates.host;
		const g = $bingoVoteStates.guest;
		const r = (h && !h.active && h.result) ? h.result : (g && !g.active && g.result) ? g.result : null;
		if (!r) return null as VoteResult | null;
		return { description: r.description, channelName: r.channelName ?? 'Chat' };
	})();

	const cookingWords = ['cooking', 'vibing', 'plotting', 'scheming', 'rolling', 'heating up', 'stirring', 'brewing', 'deciding', 'gaming', 'locked in', 'calculating', 'big braining', 'in the lab', 'going ham', 'menacing', 'cooked', 'going wild', 'touched', 'activated', 'theory crafting', 'in shambles', 'speedrunning', 'doomscrolling', 'enlightened'];
	let cookingWordIdx = Math.floor(Math.random() * cookingWords.length);
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

	// Independent typer for opponent vote row — starts at a different random word
	let oppCookingWordIdx = (cookingWordIdx + Math.floor(cookingWords.length / 2) + Math.floor(Math.random() * 4)) % cookingWords.length;
	let oppCookingText = '';
	function startOppCookingTyper() {
		const word = cookingWords[oppCookingWordIdx];
		let i = 0;
		function type() {
			oppCookingText = word.slice(0, i);
			if (i < word.length) { i++; setTimeout(type, 65); }
			else setTimeout(eraseWord, 3000);
		}
		function eraseWord() {
			if (i > 0) { oppCookingText = word.slice(0, --i); setTimeout(eraseWord, 40); }
			else { oppCookingWordIdx = (oppCookingWordIdx + 1) % cookingWords.length; setTimeout(startOppCookingTyper, 150); }
		}
		type();
	}
	startOppCookingTyper();

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
		triggerWinExit(bingoBoard.tiles.length);
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

	$: imCharOrder = imSettings?.charOrder ?? 'fixed';
	$: imActiveCharId = $ironManCurrentChar.localCharId;
	$: imDisplaySlot = (() => {
		if (!imLocalRoster || imWinner) return null;
		const active = imLocalRoster.slots.find(s => s.characterId === imActiveCharId);
		if (active) return active;
		if (imCharOrder === 'free') return null;
		if (imVariant === 'full_roster' || imVariant === 'challenge') {
			if (imLocalRoster.currentIndex >= imLocalRoster.slots.length) return null;
			return imLocalRoster.slots[imLocalRoster.currentIndex];
		}
		return imLocalRoster.slots.find(s => !s.depleted) ?? null;
	})();
	$: imSelectingChar = !!imLocalRoster && !imWinner && imCharOrder === 'free' && imActiveCharId == null;
	$: imDisplaySlotLabel = imActiveCharId != null ? 'Playing' : 'Next';

	$: imLocalProgress = imLocalRoster
		? (imVariant !== 'standard' ? imLocalRoster.slots.filter(s => s.completed).length : imLocalRoster.slots.filter(s => s.depleted).length)
		: 0;
	$: imLocalTotal = imLocalRoster?.slots.length ?? 0;
	$: imLocalPct = imLocalTotal > 0 ? Math.min(100, (imLocalProgress / imLocalTotal) * 100) : 0;
	$: imOppProgress = imOpponentRoster
		? (imVariant !== 'standard' ? imOpponentRoster.slots.filter(s => s.completed).length : imOpponentRoster.slots.filter(s => s.depleted).length)
		: 0;
	$: imOppTotal = imOpponentRoster?.slots.length ?? 0;
	$: imOppPct = imOppTotal > 0 ? Math.min(100, (imOppProgress / imOppTotal) * 100) : 0;
</script>

<div class="overlay-root" class:overlay-root--popup={isPopup}>
<div class="popup-frame">

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
		<div class="overlay-page im-page" out:fade={{ duration: 200 }}>
			{#if imWinner}
				<div class="win-screen" class:win-screen--winner={imWinner === 'local'} in:scale={{ duration: 450, start: 0.75, easing: backOut }}>
					<div class="win-crown">{imWinner === 'local' ? '🏆' : '💀'}</div>
					<div class="win-title" class:win-title--loser={imWinner !== 'local'}>IRON MAN!</div>
					<div class="win-subtitle">
						{imWinner === 'local' ? `${imLocalName} wins!` : `${imOpponentName} wins!`}
					</div>
				</div>
			{:else}
				<div class="im-container">
					<!-- P1 -->
					<div class="im-player-section">
						<div class="im-header-row">
							<span class="im-name-pill">{imLocalName}</span>
							<span class="im-progress-badge">{imLocalProgress}/{imLocalTotal}</span>
						</div>
						<div class="im-roster-clip">
							<IronManRosterGrid
								roster={imLocalRoster}
								settings={imSession.settings}
								isLocal={true}
								variant={imVariant}
								activeGameCharId={$ironManCurrentChar.localCharId}
								iconSizeOverride="6cqmin"
								cols={8}
								showActiveMarker={imCharOrder !== 'free'}
							/>
						</div>
						<div class="im-pb">
							<div class="im-pb-fill im-pb-fill--local" style="width:{imLocalPct}%"></div>
						</div>
					</div>

					{#if imRole !== 'solo' && imOpponentRoster}
						<div class="im-section-divider"></div>
						<!-- P2 -->
						<div class="im-player-section">
							<div class="im-header-row">
								<span class="im-name-pill">{imOpponentName}</span>
								<span class="im-progress-badge">{imOppProgress}/{imOppTotal}</span>
							</div>
							<div class="im-roster-clip">
								<IronManRosterGrid
									roster={imOpponentRoster}
									settings={imSession.settings}
									isLocal={false}
									obscured={imSession.settings.hideOpponent}
									variant={imVariant}
									activeGameCharId={$ironManCurrentChar.oppCharId}
									iconSizeOverride="6cqmin"
									cols={8}
									showActiveMarker={imCharOrder !== 'free'}
								/>
							</div>
							<div class="im-pb">
								<div class="im-pb-fill im-pb-fill--opp" style="width:{imOppPct}%"></div>
							</div>
						</div>
					{/if}

					<div class="im-bottom">
						{#if imDisplaySlot}
							<div class="im-next-char" in:fly={{ y: 8, duration: 200 }}>
								<img
									src="/image/characters/css/{IRONMAN_CHAR_FALLBACK[imDisplaySlot.characterId] ?? imDisplaySlot.characterId}.png"
									alt={IRONMAN_CHAR_NAMES[imDisplaySlot.characterId]}
									class="im-next-icon"
								/>
								<span class="im-next-label">{imDisplaySlotLabel}: {IRONMAN_CHAR_NAMES[imDisplaySlot.characterId]}</span>
							</div>
						{:else if imSelectingChar}
							<div class="im-next-char" in:fly={{ y: 8, duration: 200 }}>
								<span class="im-next-label">Selecting character…</span>
							</div>
						{/if}
						<!-- Reserved for future chat integration -->
						<div class="im-chat-reserved"></div>
					</div>
				</div>
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
					{#if currentVoteResult && animPhase !== 'exit'}
						<div class="vote-result-overlay" in:fade={{ duration: 300, delay: 400 }} out:fade={{ duration: 200 }}>
							<div class="vote-result-card" in:fly={{ y: -16, duration: 380, delay: 400, easing: backOut }}>
								<div class="vote-result-label">{currentVoteResult.channelName}'s chat voted</div>
								<div class="vote-result-action">{currentVoteResult.description}</div>
							</div>
						</div>
					{/if}
					{#if timerSecondsLeft !== null && animPhase !== 'exit'}
						<div class="timer" class:timer--urgent={timerSecondsLeft <= 300}>
							{timerSecondsLeft === 0 ? "⏱ Time's up!" : `⏱ ${formatTime(timerSecondsLeft)}`}
						</div>
					{/if}
					<div style="width:100%; aspect-ratio:1/1; flex-shrink:0; overflow:visible; --bingo-font-size:2.8cqmin; --bingo-char-size:6cqmin; --bingo-char-size-lg:8cqmin; --bingo-sub-size:2.2cqmin; --bingo-badge-size:2cqmin; --bingo-desc-size:1.9cqmin; --bingo-gap:3px; --bingo-radius:4px; --bingo-frozen-icon-lg:3.5em; --bingo-frozen-cd-lg:2.2em;">
						<BingoBoardGrid
							tiles={displayBingoBoard?.tiles ?? []}
							size={bingoSize}
							role={bingoRole}
							{localWinTiles}
							{oppWinTiles}
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
										<span class="pb-cooking" in:fade={{ duration: 400 }} out:fade={{ duration: 250 }}>chat is {cookingText}…</span>
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
											<span class="pb-cooking" in:fade={{ duration: 400 }} out:fade={{ duration: 250 }}>chat is {oppCookingText}…</span>
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
				{#if localVoteActive && localVote && animPhase !== 'exit'}
					<div class="vote-banner" class:vote-banner--special={localVote.special} in:fly={{ y: 8, duration: 300 }} out:fade={{ duration: 180 }}>
						<div class="vote-title">{localVote.question ?? 'Chat Vote'}</div>
						<div class="vote-options">
							{#each localVote.options as opt, i}
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

</div><!-- end popup-frame -->
</div><!-- end overlay-root -->

<style>
	:global(html), :global(body) {
		background: var(--overlay-bg, transparent) !important;
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

	/* Popup mode: 8:11 aspect-ratio container, centered, fills portrait viewport */
	.overlay-root--popup {
		display: flex;
		justify-content: center;
		align-items: flex-start;
		overflow: hidden;
	}

	.popup-frame {
		position: relative;
		width: 100%;
		height: 100%;
		container-type: size;
	}

	.overlay-root--popup .popup-frame {
		height: 100%;
		width: auto;
		aspect-ratio: 8 / 11;
		max-width: 100%;
		overflow: hidden;
		flex-shrink: 0;
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
		padding-top: 3px;
	}

	/* ── Waiting ── */
	.no-session {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5cqmin;
		background: rgba(0,0,0,0.7);
		padding: 3cqmin 4cqmin;
		border-radius: 8px;
		font-family: sans-serif;
	}

	.no-session-header { display: flex; align-items: center; gap: 1.5cqmin; }
	.no-session-icon { width: 9cqmin; height: 9cqmin; object-fit: contain; image-rendering: pixelated; }
	.no-session-name { font-size: 5cqmin; font-weight: 800; color: rgba(255,255,255,0.95); letter-spacing: 0.05em; }
	.no-session-text { font-size: 3.2cqmin; font-weight: 600; color: rgba(255,255,255,0.6); letter-spacing: 0.02em; }
	.no-session-qr { display: flex; flex-direction: column; align-items: center; gap: 0.6cqmin; margin-top: 2cqmin; opacity: 0.5; }
	.no-session-url { font-size: 1.8cqmin; color: rgba(255,255,255,0.8); font-family: sans-serif; }

	/* ── Iron Man ── */
	.im-page {
		align-items: center;
		justify-content: center;
	}

	.im-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		padding: 2.5cqmin;
		box-sizing: border-tile;
		overflow: hidden;
	}

	.im-player-section {
		display: flex;
		flex-direction: column;
		gap: 1cqmin;
		flex: 1;
		min-height: 0;
	}

	.im-header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1cqmin;
		flex-shrink: 0;
	}

	.im-name-pill {
		font-size: 2.8cqmin;
		font-weight: 700;
		font-family: sans-serif;
		color: rgba(255,255,255,0.95);
		letter-spacing: 0.04em;
		background: rgba(0,0,0,0.55);
		padding: 0.6cqmin 1.8cqmin;
		border-radius: 4px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.im-progress-badge {
		font-size: 2.4cqmin;
		font-weight: 700;
		font-family: sans-serif;
		font-variant-numeric: tabular-nums;
		color: rgba(255,255,255,0.5);
		flex-shrink: 0;
	}

	.im-roster-clip {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.im-pb {
		width: 100%;
		height: 1cqmin;
		border-radius: 999px;
		background: rgba(255,255,255,0.12);
		overflow: hidden;
		flex-shrink: 0;
	}

	.im-pb-fill {
		height: 100%;
		border-radius: 999px;
		transition: width 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
	}

	.im-pb-fill--local { background: rgba(74, 222, 128, 0.85); }
	.im-pb-fill--opp   { background: rgba(248, 113, 113, 0.85); }

	.im-section-divider {
		height: 1px;
		background: rgba(255,255,255,0.08);
		margin: 1.5cqmin 0;
		flex-shrink: 0;
	}

	.im-bottom {
		display: flex;
		flex-direction: column;
		gap: 1cqmin;
		flex-shrink: 0;
		margin-top: 1cqmin;
	}

	.im-next-char {
		display: flex;
		align-items: center;
		gap: 1.5cqmin;
		background: rgba(0,0,0,0.55);
		padding: 1.2cqmin 2.5cqmin;
		border-radius: 6px;
		align-self: flex-start;
	}

	.im-next-icon {
		width: 6cqmin;
		height: 6cqmin;
		object-fit: contain;
	}

	.im-next-label {
		font-size: 2.2cqmin;
		font-weight: 600;
		font-family: sans-serif;
		color: rgba(255,255,255,0.8);
	}

	.im-chat-reserved {
		height: 6cqmin;
		flex-shrink: 0;
	}

	/* ── Froggi ad ── */
	.froggi-ad {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2.5cqmin;
		background: rgba(0,0,0,0.9);
		padding: 4cqmin 5cqmin;
		border-radius: 14px;
		font-family: sans-serif;
		border: 2px solid rgba(255,255,255,0.08);
	}

	.froggi-ad-header { display: flex; align-items: center; gap: 1.5cqmin; }
	.froggi-ad-icon { width: 8cqmin; height: 8cqmin; object-fit: contain; image-rendering: pixelated; }
	.froggi-ad-name { font-size: 5.5cqmin; font-weight: 800; color: rgba(255,255,255,0.9); letter-spacing: 0.05em; }

	.froggi-ad-qr { display: flex; flex-direction: column; align-items: center; gap: 0.8cqmin; opacity: 0.55; }
	.froggi-ad-url { font-size: 1.8cqmin; color: rgba(255,255,255,0.85); }

	/* ── Bingo win screen ── */
	.win-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5cqmin;
		background: rgba(0,0,0,0.88);
		padding: 4cqmin 6cqmin;
		border-radius: 12px;
		font-family: sans-serif;
		border: 2px solid rgba(255,255,255,0.12);
	}

	.win-screen--winner { border-color: rgba(255,215,0,0.4); box-shadow: 0 0 40px rgba(255,215,0,0.15); }
	.win-crown { font-size: 6cqmin; }
	.win-title { font-size: 10cqmin; font-weight: 900; color: #fff; letter-spacing: 0.2em; text-shadow: 0 0 30px rgba(255,255,255,0.6); animation: flash 1s ease-in-out infinite; }
	.win-title--loser { color: rgba(255,255,255,0.55); text-shadow: none; animation: none; }
	.win-subtitle { font-size: 2.8cqmin; font-weight: 700; color: rgba(255,255,255,0.8); letter-spacing: 0.08em; text-transform: uppercase; }
	.win-time { font-size: 2cqmin; color: rgba(255,255,255,0.5); }

	/* ── Bingo board ── */
	.board-wrap {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 2px;
		width: 100%;
		z-index: 1;
	}

	.exit-backdrop {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12cqmin;
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
		font-size: 3.5cqmin;
		font-weight: 700;
		font-family: sans-serif;
		color: rgba(255,255,255,0.9);
		background: rgba(0,0,0,0.6);
		border-radius: 4px;
		padding: 1cqmin 0;
		letter-spacing: 0.05em;
		flex-shrink: 0;
		z-index: 1;
	}

	.timer--urgent { color: #f87171; animation: flash 1s ease-in-out infinite; }

	.pb-wrap {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.8cqmin;
		padding: 1.2cqmin 0.5cqmin 0.4cqmin;
		flex-shrink: 0;
	}

	.pb-player {
		display: flex;
		flex-direction: column;
		gap: 0.3cqmin;
	}

	.pb-header {
		display: flex;
		align-items: baseline;
		gap: 0.8cqmin;
	}

	.pb-name {
		font-size: 2.8cqmin;
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
		font-size: 2.4cqmin;
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
		font-size: 2.6cqmin;
		font-weight: 700;
		font-family: sans-serif;
		color: rgba(255,255,255,0.75);
		margin-left: auto;
		flex-shrink: 0;
		line-height: 1;
	}

	.pb-score--winner { color: #4ade80; }

	.pb-of {
		font-size: 2.2cqmin;
		opacity: 0.55;
	}

	.pb-track {
		width: 100%;
		height: 0.35cqmin;
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
		padding: 1.5cqmin 7cqmin 1.5cqmin 2.5cqmin;
		display: flex;
		flex-direction: column;
		gap: 0.8cqmin;
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
		font-size: 4cqmin;
		font-weight: 800;
		color: rgba(255,255,255,0.95);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.vote-options {
		display: flex;
		flex-direction: column;
		gap: 0.7cqmin;
	}

	.vote-opt {
		display: flex;
		flex-direction: column;
		gap: 0.4cqmin;
	}

	.vote-opt-top {
		display: flex;
		align-items: center;
		gap: 1.2cqmin;
	}

	.vote-key {
		font-size: 2.8cqmin;
		font-weight: 800;
		color: rgba(255,255,255,0.9);
		background: rgba(255,255,255,0.1);
		border-radius: 4px;
		width: 4.5cqmin;
		height: 4.5cqmin;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.vote-label {
		font-size: 3cqmin;
		font-weight: 700;
		color: rgba(255,255,255,0.85);
		flex: 1;
	}

	.vote-pct {
		font-size: 2.5cqmin;
		font-weight: 700;
		color: rgba(255,255,255,0.6);
		flex-shrink: 0;
	}

	.vote-bar-track {
		width: 100%;
		height: 0.6cqmin;
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
		top: 1.5cqmin;
		right: 2cqmin;
		font-size: 3.5cqmin;
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
		padding: 4cqmin;
	}

	.vote-result-card {
		background: rgba(10,10,10,0.97);
		border: 2px solid rgba(250,204,21,0.55);
		border-radius: 14px;
		padding: 3.5cqmin 6cqmin;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1cqmin;
		text-align: center;
		font-family: sans-serif;
		box-shadow: 0 0 40px rgba(250,204,21,0.2);
	}

	.vote-result-label {
		font-size: 2.2cqmin;
		font-weight: 600;
		color: rgba(250, 204, 21, 0.75);
		text-transform: uppercase;
		letter-spacing: 0.12em;
	}

	.vote-result-action {
		font-size: 5cqmin;
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
		padding: 3cqmin 5.5cqmin;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.8cqmin;
		font-family: sans-serif;
		text-align: center;
	}

	.revert-icon { font-size: 5.5cqmin; line-height: 1; margin-bottom: 0.4cqmin; }
	.revert-title { font-size: 4cqmin; font-weight: 800; color: rgba(255,255,255,0.95); margin: 0; }
	.revert-sub { font-size: 2.2cqmin; font-weight: 500; color: rgba(255,185,80,0.85); margin: 0; text-transform: uppercase; letter-spacing: 0.06em; }

	@keyframes flash {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
</style>
