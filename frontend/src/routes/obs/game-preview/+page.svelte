<script lang="ts">
	import { bingoSession, bingoLobby, ironManSession, ironManLobby, ironManCurrentChar, currentPlayer, bingoRevertMessage } from '$lib/utils/store.svelte';
	import { scale, fly, fade } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import type { BingoWinCondition, BingoBox } from '$lib/models/types/bingo';
	import { IRONMAN_CHAR_NAMES, IRONMAN_CHAR_FALLBACK } from '$lib/models/types/ironman';
	import BingoBoardGrid from '$lib/components/bingo/BingoBoardGrid.svelte';
	import IronManRosterGrid from '$lib/components/ironman/IronManRosterGrid.svelte';
	// @ts-ignore
	import QrCode from 'svelte-qrcode';

	// ── Active game detection ──────────────────────────────────────────────────
	$: activeGame = $ironManSession ? 'ironman' : $bingoSession ? 'bingo' : null;

	// ── Bingo state ───────────────────────────────────────────────────────────
	$: bingoBoard = $bingoSession?.board;
	let displayBingoBoard = bingoBoard;
	$: if (bingoBoard) displayBingoBoard = bingoBoard;
	$: bingoSize = displayBingoBoard?.size ?? 5;
	$: bingoRole = $bingoSession?.role ?? 'solo';
	$: winCondition = ($bingoSession?.settings?.winCondition ?? 3) as BingoWinCondition;
	$: localName = $currentPlayer?.displayName || 'You';
	$: opponentName = $bingoSession?.opponentName ?? null;

	function countLines(boxes: BingoBox[], sz: number, filter: (b: BingoBox) => boolean): number {
		const done = new Set(boxes.map((b, i) => (filter(b) ? i : -1)).filter(i => i >= 0));
		let n = 0;
		for (let r = 0; r < sz; r++) {
			if (Array.from({ length: sz }, (_, c) => r * sz + c).every(i => done.has(i))) n++;
		}
		for (let c = 0; c < sz; c++) {
			if (Array.from({ length: sz }, (_, r) => r * sz + c).every(i => done.has(i))) n++;
		}
		if (Array.from({ length: sz }, (_, i) => i * sz + i).every(i => done.has(i))) n++;
		if (Array.from({ length: sz }, (_, i) => i * sz + (sz - 1 - i)).every(i => done.has(i))) n++;
		return n;
	}

	function getWinBoxes(boxes: BingoBox[], sz: number, filter: (b: BingoBox) => boolean): Set<number> {
		const done = new Set(boxes.map((b, i) => (filter(b) ? i : -1)).filter(i => i >= 0));
		const win = new Set<number>();
		for (let r = 0; r < sz; r++) {
			const row = Array.from({ length: sz }, (_, c) => r * sz + c);
			if (row.every(i => done.has(i))) row.forEach(i => win.add(i));
		}
		for (let c = 0; c < sz; c++) {
			const col = Array.from({ length: sz }, (_, r) => r * sz + c);
			if (col.every(i => done.has(i))) col.forEach(i => win.add(i));
		}
		const d1 = Array.from({ length: sz }, (_, i) => i * sz + i);
		if (d1.every(i => done.has(i))) d1.forEach(i => win.add(i));
		const d2 = Array.from({ length: sz }, (_, i) => i * sz + (sz - 1 - i));
		if (d2.every(i => done.has(i))) d2.forEach(i => win.add(i));
		return win;
	}

	$: localWinBoxes = displayBingoBoard
		? getWinBoxes(displayBingoBoard.boxes, bingoSize, b => b.completedBy === 'local' || b.completedBy === 'both')
		: new Set<number>();
	$: oppWinBoxes = displayBingoBoard
		? getWinBoxes(displayBingoBoard.boxes, bingoSize, b => b.completedBy === 'opponent' || b.completedBy === 'both')
		: new Set<number>();

	$: bingoHasWon = (() => {
		if (!bingoBoard) return false;
		const wc = winCondition;
		const boxes = bingoBoard.boxes;
		if (wc === 'full') return boxes.every(b => b.completed);
		if (wc === 'lockout') {
			const total = boxes.length;
			const lc = boxes.filter(b => b.completedBy === 'local' || b.completedBy === 'both').length;
			const oc = boxes.filter(b => b.completedBy === 'opponent' || b.completedBy === 'both').length;
			return lc > total / 2 || oc > total / 2;
		}
		const n = wc as number;
		return countLines(boxes, bingoSize, b => b.completedBy === 'local' || b.completedBy === 'both') >= n ||
		       countLines(boxes, bingoSize, b => b.completedBy === 'opponent' || b.completedBy === 'both') >= n;
	})();

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

	function winConditionLabel(wc: BingoWinCondition): string {
		if (wc === 'lockout') return 'Lockout';
		if (wc === 'full') return 'Full board';
		return `${wc} line${(wc as number) > 1 ? 's' : ''} to win`;
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
		isLocalWinner = checkIsLocalWinner();
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
		exitTimers.push(setTimeout(() => { animPhase = 'winner-ad'; }, 3300));
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

	function checkIsLocalWinner(): boolean {
		if (!bingoBoard) return true;
		const boxes = bingoBoard.boxes;
		const ll = countLines(boxes, bingoSize, b => b.completedBy === 'local' || b.completedBy === 'both');
		const ol = countLines(boxes, bingoSize, b => b.completedBy === 'opponent' || b.completedBy === 'both');
		if (ll !== ol) return ll > ol;
		const lb = boxes.filter(b => b.completedBy === 'local' || b.completedBy === 'both').length;
		const ob = boxes.filter(b => b.completedBy === 'opponent' || b.completedBy === 'both').length;
		return lb >= ob;
	}

	$: bingoLocalLines = displayBingoBoard
		? countLines(displayBingoBoard.boxes, bingoSize, b => b.completedBy === 'local' || b.completedBy === 'both')
		: 0;
	$: bingoOppLines = displayBingoBoard
		? countLines(displayBingoBoard.boxes, bingoSize, b => b.completedBy === 'opponent' || b.completedBy === 'both')
		: 0;

	$: bingoProgressData = (() => {
		if (!displayBingoBoard) return null;
		const boxes = displayBingoBoard.boxes;
		const total = boxes.length;
		if (winCondition === 'lockout') {
			const target = Math.ceil(total / 2) + 1;
			const ls = boxes.filter(b => b.completedBy === 'local' || b.completedBy === 'both').length;
			const os = boxes.filter(b => b.completedBy === 'opponent' || b.completedBy === 'both').length;
			return { localScore: ls, oppScore: bingoRole === 'solo' ? (null as number | null) : os, target, unit: 'boxes', localWinner: ls >= target, oppWinner: os >= target };
		}
		if (winCondition === 'full') {
			const ls = boxes.filter(b => b.completedBy === 'local' || b.completedBy === 'both').length;
			const os = boxes.filter(b => b.completedBy === 'opponent' || b.completedBy === 'both').length;
			return { localScore: ls, oppScore: bingoRole === 'solo' ? (null as number | null) : os, target: total, unit: 'boxes', localWinner: ls >= total, oppWinner: os >= total };
		}
		const n = winCondition as number;
		return { localScore: bingoLocalLines, oppScore: bingoRole === 'solo' ? (null as number | null) : bingoOppLines, target: n, unit: 'lines', localWinner: bingoLocalLines >= n, oppWinner: bingoOppLines >= n };
	})();

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
		{#if animPhase === 'winner' || animPhase === 'winner-ad'}
			<div class="overlay-page" out:fade={{ duration: 220 }}>
				<div class="win-screen" class:win-screen--winner={isLocalWinner} in:scale={{ duration: 400, start: 0.75, easing: backOut }}>
					<div class="win-crown">{isLocalWinner ? '🏆' : '💀'}</div>
					<div class="win-title" class:win-title--loser={!isLocalWinner}>BINGO!</div>
					<div class="win-subtitle">{isLocalWinner ? `${localName} wins!` : 'Opponent wins'}</div>
					<div class="win-time">Completed in {formatTime(winElapsedSeconds)}</div>
				</div>
			</div>
		{:else}
			<div class="overlay-page" out:fade={{ duration: 220 }}>
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
					{#if timerSecondsLeft !== null && animPhase !== 'exit'}
						<div class="timer" class:timer--urgent={timerSecondsLeft <= 300}>
							{timerSecondsLeft === 0 ? "⏱ Time's up!" : `⏱ ${formatTime(timerSecondsLeft)}`}
						</div>
					{/if}
					<div style="flex:1; min-height:0; --bingo-font-size:2.8vmin; --bingo-char-size:4vmin; --bingo-sub-size:2.2vmin; --bingo-badge-size:2vmin; --bingo-desc-size:1.9vmin; --bingo-gap:3px; --bingo-radius:4px;">
						<BingoBoardGrid
							boxes={displayBingoBoard?.boxes ?? []}
							size={bingoSize}
							role={bingoRole}
							{localWinBoxes}
							{oppWinBoxes}
							{exitingBoxIndices}
							{isLocalWinner}
							animateEntry={true}
						/>
					</div>
					{#if animPhase !== 'exit' && bingoProgressData}
						<div class="pb-wrap">
							<div class="pb-row" class:pb-row--winner={bingoProgressData.localWinner}>
								<span class="pb-name">{$bingoSession?.localName || localName}</span>
								<div class="pb-track">
									<div class="pb-fill pb-fill--local" style="width:{Math.min(100, (bingoProgressData.localScore / bingoProgressData.target) * 100)}%"></div>
								</div>
								<span class="pb-score">{bingoProgressData.localScore}<span class="pb-of">/{bingoProgressData.target}</span></span>
							</div>
							{#if bingoProgressData.oppScore !== null}
								<div class="pb-row" class:pb-row--winner={bingoProgressData.oppWinner}>
									<span class="pb-name">{opponentName ?? 'Opponent'}</span>
									<div class="pb-track">
										<div class="pb-fill pb-fill--opp" style="width:{Math.min(100, (bingoProgressData.oppScore / bingoProgressData.target) * 100)}%"></div>
									</div>
									<span class="pb-score">{bingoProgressData.oppScore}<span class="pb-of">/{bingoProgressData.target}</span></span>
								</div>
							{/if}
							<span class="pb-unit">{bingoProgressData.unit}</span>
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
		height: min(100vw, 100vh);
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
		gap: 1vmin;
		padding: 1vmin 0 0.5vmin;
		flex-shrink: 0;
	}

	.pb-row {
		display: flex;
		align-items: center;
		gap: 1.5vmin;
	}

	.pb-name {
		font-size: 1.6vmin;
		font-weight: 700;
		color: rgba(255,255,255,0.55);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		width: 12vmin;
		flex-shrink: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-family: sans-serif;
	}

	.pb-track {
		flex: 1;
		height: 1.2vmin;
		border-radius: 999px;
		background: rgba(255,255,255,0.08);
		overflow: hidden;
	}

	.pb-fill {
		height: 100%;
		border-radius: 999px;
		transition: width 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
	}

	.pb-fill--local { background: rgba(96, 165, 250, 0.85); }
	.pb-fill--opp   { background: rgba(52, 211, 153, 0.85); }

	.pb-row--winner .pb-fill--local,
	.pb-row--winner .pb-fill--opp {
		background: rgba(74, 222, 128, 0.95);
	}

	.pb-score {
		font-size: 2vmin;
		font-weight: 700;
		font-family: sans-serif;
		color: rgba(255,255,255,0.9);
		width: 5vmin;
		text-align: right;
		flex-shrink: 0;
		line-height: 1;
	}

	.pb-row--winner .pb-score { color: #4ade80; }

	.pb-of {
		font-size: 1.4vmin;
		opacity: 0.4;
		font-weight: 400;
	}

	.pb-unit {
		font-size: 1.3vmin;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		opacity: 0.3;
		font-family: sans-serif;
		padding-left: calc(12vmin + 1.5vmin);
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
