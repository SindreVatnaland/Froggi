<script lang="ts">
	import { bingoSession, bingoLobby, currentPlayer, bingoRevertMessage } from '$lib/utils/store.svelte';
	// @ts-ignore
	import QrCode from 'svelte-qrcode';
	import type { BingoWinCondition, BingoBox } from '$lib/models/types/bingo';
	import { scale, fly, fade } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import BingoBoardGrid from '$lib/components/bingo/BingoBoardGrid.svelte';

	$: session = $bingoSession;
	$: localName = $currentPlayer?.displayName || 'You';
	$: board = session?.board;

	// Keep last board so boxes stay visible during the fade-out when session ends
	let displayBoard = board;
	$: if (board) displayBoard = board;

	$: size = displayBoard?.size ?? 5;
	$: role = session?.role ?? 'solo';

	function getWinBoxesFiltered(boxes: BingoBox[], sz: number, filter: (b: BingoBox) => boolean): Set<number> {
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

	$: localWinBoxes = displayBoard
		? getWinBoxesFiltered(displayBoard.boxes, size, b => b.completedBy === 'local' || b.completedBy === 'both')
		: new Set<number>();

	$: oppWinBoxes = displayBoard
		? getWinBoxesFiltered(displayBoard.boxes, size, b => b.completedBy === 'opponent' || b.completedBy === 'both')
		: new Set<number>();

	$: winCondition = (session?.settings?.winCondition ?? 3) as BingoWinCondition;

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

	$: hasWon = (() => {
		if (!board) return false;
		const wc = winCondition;
		const boxes = board.boxes;
		if (wc === 'full') return boxes.every(b => b.completed);
		if (wc === 'lockout') {
			const total = boxes.length;
			const localCount = boxes.filter(b => b.completedBy === 'local' || b.completedBy === 'both').length;
			const oppCount  = boxes.filter(b => b.completedBy === 'opponent' || b.completedBy === 'both').length;
			return localCount > total / 2 || oppCount > total / 2;
		}
		const n = wc as number;
		const localLines = countLines(boxes, size, b => b.completedBy === 'local' || b.completedBy === 'both');
		const oppLines   = countLines(boxes, size, b => b.completedBy === 'opponent' || b.completedBy === 'both');
		return localLines >= n || oppLines >= n;
	})();

	// ── Timer ────────────────────────────────────────────────────────────────
	let now = Date.now();
	setInterval(() => (now = Date.now()), 1000);
	$: if (session?.startedAt) now = Date.now();

	$: timerEnabled = session?.settings?.timer?.enabled ?? false;
	$: timerSecondsLeft = (() => {
		if (!timerEnabled || !session) return null;
		const end = session.startedAt + session.settings.timer.durationMinutes * 60 * 1000;
		return Math.max(0, Math.floor((end - now) / 1000));
	})();

	$: elapsedSeconds = session ? Math.floor((now - session.startedAt) / 1000) : 0;

	function formatTime(s: number): string {
		const h = Math.floor(s / 3600);
		const m = Math.floor((s % 3600) / 60);
		const sec = s % 60;
		if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
		return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
	}

	// ── Animation state machine ───────────────────────────────────────────────
	// idle      → no board
	// playing   → board visible, game in progress
	// exit      → boxes animating out (win detected)
	// winner    → win screen (no ad yet)
	// winner-ad → win screen + froggi ad
	type AnimPhase = 'idle' | 'playing' | 'exit' | 'winner' | 'winner-ad';
	let animPhase: AnimPhase = 'idle';
	let isLocalWinner = false;
	let exitingBoxIndices = new Set<number>();
	let winElapsedSeconds = 0;
	let prevBoardId: string | null = null;
	let winTriggered = false;
	let exitTimers: ReturnType<typeof setTimeout>[] = [];
	let timerSuddenDeath = false;
	let suddenDeathBaseCount = 0;

	function clearExitTimers() {
		exitTimers.forEach(clearTimeout);
		exitTimers = [];
	}

	$: {
		const boardId = board?.id ?? null;
		if (boardId !== prevBoardId) {
			prevBoardId = boardId;
			clearExitTimers();
			winTriggered = false;
			exitingBoxIndices = new Set();
			animPhase = boardId ? 'playing' : 'idle';
			timerSuddenDeath = false;
			suddenDeathBaseCount = 0;
		}
	}

	// Unified win detection: normal win, timer expiry, and sudden death resolution in one block
	$: if (animPhase === 'playing' && board && !winTriggered) {
		const boxes = board.boxes;
		if (hasWon) {
			winTriggered = true;
			winElapsedSeconds = elapsedSeconds;
			isLocalWinner = checkIsLocalWinner();
			triggerWinExit(boxes.length);
		} else if (timerSecondsLeft === 0) {
			if (timerSuddenDeath) {
				// Sudden death: first new completion wins
				const completed = boxes.filter(b => b.completed).length;
				if (completed > suddenDeathBaseCount) {
					const localBoxes = boxes.filter(b => b.completedBy === 'local' || b.completedBy === 'both').length;
					const oppBoxes   = boxes.filter(b => b.completedBy === 'opponent' || b.completedBy === 'both').length;
					timerSuddenDeath = false;
					winTriggered = true;
					winElapsedSeconds = elapsedSeconds;
					isLocalWinner = localBoxes > oppBoxes;
					triggerWinExit(boxes.length);
				}
			} else {
				// Timer just expired: resolve by lines then boxes, or enter sudden death
				const localLines = countLines(boxes, size, b => b.completedBy === 'local' || b.completedBy === 'both');
				const oppLines   = countLines(boxes, size, b => b.completedBy === 'opponent' || b.completedBy === 'both');
				const localBoxes = boxes.filter(b => b.completedBy === 'local' || b.completedBy === 'both').length;
				const oppBoxes   = boxes.filter(b => b.completedBy === 'opponent' || b.completedBy === 'both').length;
				if (localLines !== oppLines || localBoxes !== oppBoxes) {
					winTriggered = true;
					winElapsedSeconds = elapsedSeconds;
					isLocalWinner = localLines !== oppLines ? localLines > oppLines : localBoxes > oppBoxes;
					triggerWinExit(boxes.length);
				} else {
					timerSuddenDeath = true;
					suddenDeathBaseCount = boxes.filter(b => b.completed).length;
				}
			}
		}
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

	function winConditionLabel(wc: BingoWinCondition): string {
		if (wc === 'lockout') return 'Lockout';
		if (wc === 'full') return 'Full board';
		return `${wc} line${(wc as number) > 1 ? 's' : ''} to win`;
	}

	$: opponentName = session?.opponentName ?? null;

	function checkIsLocalWinner(): boolean {
		if (!board) return true;
		const boxes = board.boxes;
		const localLines = countLines(boxes, size, b => b.completedBy === 'local' || b.completedBy === 'both');
		const oppLines   = countLines(boxes, size, b => b.completedBy === 'opponent' || b.completedBy === 'both');
		if (localLines !== oppLines) return localLines > oppLines;
		const localBoxes = boxes.filter(b => b.completedBy === 'local' || b.completedBy === 'both').length;
		const oppBoxes   = boxes.filter(b => b.completedBy === 'opponent' || b.completedBy === 'both').length;
		return localBoxes >= oppBoxes;
	}
</script>

<div class="overlay-root">
	{#if animPhase === 'idle'}
		<!-- Waiting screen -->
		<div class="overlay-page" in:fade={{ duration: 350, delay: 220 }} out:fade={{ duration: 220 }}>
			<div class="no-session">
				<div class="no-session-header">
					<img src="/icon.png" alt="Froggi" class="no-session-icon" />
					<span class="no-session-name">Froggi</span>
				</div>
				{#if $bingoLobby}
					{#if $bingoLobby.opponentConnected}
						<span class="no-session-text">Ready to start</span>
						<div class="lobby-names">
							<span class="lobby-player"><span class="lobby-dot lobby-dot--local"></span>{$bingoLobby.localName}</span>
							<span class="lobby-vs">vs</span>
							<span class="lobby-player"><span class="lobby-dot lobby-dot--opp"></span>{$bingoLobby.opponentName ?? 'Opponent'}</span>
						</div>
					{:else}
						<span class="no-session-text">Waiting for opponent to join…</span>
						<span class="lobby-host">{$bingoLobby.localName} is hosting</span>
					{/if}
				{:else}
					<span class="no-session-text">Waiting for bingo session…</span>
					<div class="no-session-qr">
						<QrCode value="https://sindrevatnaland.github.io/Froggi/" size="160" color="#ffffff" background="#111111" />
						<span class="no-session-url">sindrevatnaland.github.io/Froggi</span>
					</div>
				{/if}
			</div>
		</div>

	{:else if animPhase === 'winner' || animPhase === 'winner-ad'}
		<!-- Win screen -->
		<div class="overlay-page">
			<div class="win-screen" class:win-screen--winner={isLocalWinner} in:scale={{ duration: 400, start: 0.75, easing: backOut }}>
				<div class="win-crown">{isLocalWinner ? '🏆' : '💀'}</div>
				<div class="win-title" class:win-title--loser={!isLocalWinner}>BINGO!</div>
				<div class="win-subtitle">{isLocalWinner ? `${localName} wins!` : 'Opponent wins'}</div>
				<div class="win-time">Completed in {formatTime(winElapsedSeconds)}</div>
				{#if animPhase === 'winner-ad'}
					<div class="win-froggi" in:fly={{ y: 20, duration: 400, easing: backOut }}>
						<div class="win-froggi-header">
							<img src="/icon.png" alt="Froggi" class="win-froggi-icon" />
							<span class="win-froggi-name">Froggi</span>
						</div>
						<div class="win-froggi-qr">
							<QrCode value="https://sindrevatnaland.github.io/Froggi/" size="120" color="#ffffff" background="#111111" />
							<span class="win-froggi-url">sindrevatnaland.github.io/Froggi</span>
						</div>
					</div>
				{/if}
			</div>
		</div>

	{:else}
		<!-- Board (playing or exit animation) -->
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
			<!-- Winner name shown behind boxes during exit -->
			{#if animPhase === 'exit'}
				<div class="exit-backdrop" class:exit-backdrop--winner={isLocalWinner} in:fade={{ duration: 300 }}>
					BINGO!
				</div>
			{/if}

			{#if timerSuddenDeath && animPhase !== 'exit'}
				<div class="sudden-death">⚡ Sudden death — next box wins!</div>
			{:else if timerSecondsLeft !== null && animPhase !== 'exit'}
				<div class="timer" class:timer--urgent={timerSecondsLeft <= 300}>
					{timerSecondsLeft === 0 ? "⏱ Time's up!" : `⏱ ${formatTime(timerSecondsLeft)}`}
				</div>
			{/if}

			<div style="flex:1; min-height:0; --bingo-font-size:2.8vmin; --bingo-char-size:4vmin; --bingo-sub-size:2.2vmin; --bingo-badge-size:2vmin; --bingo-desc-size:1.9vmin; --bingo-gap:3px; --bingo-radius:4px;">
				<BingoBoardGrid
					boxes={displayBoard?.boxes ?? []}
					{size}
					{role}
					{localWinBoxes}
					{oppWinBoxes}
					{exitingBoxIndices}
					{isLocalWinner}
					animateEntry={true}
				/>
			</div>
			{#if animPhase !== 'exit'}
				<div class="condition-bar">
					{#if role !== 'solo'}
						<span class="player-name"><span class="color-dot color-dot--local"></span>{session?.localName || localName}</span>
						<span class="cond-label">{winConditionLabel(winCondition)}</span>
						{#if opponentName}
							<span class="player-name"><span class="color-dot color-dot--opp"></span>{opponentName}</span>
						{/if}
					{:else}
						<span class="cond-label">{winConditionLabel(winCondition)}</span>
					{/if}
				</div>
			{/if}
		</div>
		</div>
	{/if}
</div>

<style>
	.revert-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.52);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
		pointer-events: none;
	}

	.revert-popup {
		background: rgba(10, 10, 10, 0.97);
		border: 2px solid rgba(220, 115, 0, 0.6);
		border-radius: 14px;
		padding: 3vmin 5.5vmin;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.8vmin;
		box-shadow: 0 0 40px rgba(200, 90, 0, 0.18), 0 6px 30px rgba(0, 0, 0, 0.7);
		font-family: sans-serif;
		text-align: center;
	}

	.revert-icon {
		font-size: 5.5vmin;
		line-height: 1;
		margin-bottom: 0.4vmin;
	}

	.revert-title {
		font-size: 4vmin;
		font-weight: 800;
		color: rgba(255, 255, 255, 0.95);
		letter-spacing: 0.05em;
		margin: 0;
	}

	.revert-sub {
		font-size: 2.2vmin;
		font-weight: 500;
		color: rgba(255, 185, 80, 0.85);
		margin: 0;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	:global(html),
	:global(body) {
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

	/* ── Lobby ── */
	.lobby-names {
		display: flex;
		align-items: center;
		gap: 1.5vmin;
		margin-top: 0.5vmin;
	}

	.lobby-player {
		display: flex;
		align-items: center;
		gap: 0.6vmin;
		font-size: 2.8vmin;
		font-weight: 700;
		color: rgba(255,255,255,0.85);
		font-family: sans-serif;
	}

	.lobby-dot {
		width: 1.6vmin;
		height: 1.6vmin;
		border-radius: 2px;
		flex-shrink: 0;
	}
	.lobby-dot--local { background: #3b82f6; }
	.lobby-dot--opp   { background: #22c55e; }

	.lobby-vs {
		font-size: 2vmin;
		color: rgba(255,255,255,0.3);
		font-family: sans-serif;
	}

	.lobby-host {
		font-size: 2vmin;
		color: rgba(255,255,255,0.4);
		font-family: sans-serif;
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

	.no-session-text { font-size: 2.4vmin; font-weight: 600; color: rgba(255,255,255,0.6); letter-spacing: 0.02em; }

	.no-session-qr { display: flex; flex-direction: column; align-items: center; gap: 0.6vmin; margin-top: 2vmin; opacity: 0.45; }

	.no-session-url { font-size: 2vmin; color: rgba(255,255,255,0.8); font-family: sans-serif; }

	/* ── Win screen ── */
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

	.win-screen--winner {
		border-color: rgba(255,215,0,0.4);
		box-shadow: 0 0 40px rgba(255,215,0,0.15);
	}

	.win-crown { font-size: 6vmin; }

	.win-title {
		font-size: 10vmin;
		font-weight: 900;
		color: #fff;
		letter-spacing: 0.2em;
		text-shadow: 0 0 30px rgba(255,255,255,0.6), 0 0 60px rgba(255,255,255,0.3);
		animation: flash 1s ease-in-out infinite;
	}

	.win-title--loser {
		color: rgba(255,255,255,0.55);
		text-shadow: none;
		animation: none;
	}

	.win-subtitle {
		font-size: 2.8vmin;
		font-weight: 700;
		color: rgba(255,255,255,0.8);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.win-time {
		font-size: 2vmin;
		color: rgba(255,255,255,0.5);
	}

	.win-froggi {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1vmin;
		margin-top: 1.5vmin;
		opacity: 0.5;
	}

	.win-froggi-header { display: flex; align-items: center; gap: 1vmin; }

	.win-froggi-icon { width: 5vmin; height: 5vmin; object-fit: contain; image-rendering: pixelated; }

	.win-froggi-name { font-size: 3vmin; font-weight: 700; color: rgba(255,255,255,0.9); }

	.win-froggi-qr { display: flex; flex-direction: column; align-items: center; gap: 0.5vmin; }

	.win-froggi-url { font-size: 1.6vmin; color: rgba(255,255,255,0.7); }

	@keyframes flash {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	/* ── Board ── */
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

	.exit-backdrop--winner {
		color: rgba(255,215,0,0.25);
	}

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

	.sudden-death {
		width: 100%;
		text-align: center;
		font-size: 3.5vmin;
		font-weight: 800;
		font-family: sans-serif;
		color: #fbbf24;
		background: rgba(0,0,0,0.6);
		border-radius: 4px;
		padding: 1vmin 0;
		letter-spacing: 0.06em;
		flex-shrink: 0;
		z-index: 1;
		animation: flash 0.8s ease-in-out infinite;
	}

	.condition-bar {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.2vmin;
		font-family: sans-serif;
		flex-shrink: 0;
		padding: 1vmin 0 0.5vmin;
	}

	.player-name {
		display: flex;
		align-items: center;
		gap: 0.5vmin;
		font-size: 1.8vmin;
		font-weight: 600;
		color: rgba(255,255,255,0.6);
		letter-spacing: 0.02em;
	}

	.color-dot {
		width: 1.4vmin;
		height: 1.4vmin;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.color-dot--local { background: #3b82f6; }
	.color-dot--opp   { background: #22c55e; }

	.cond-label {
		font-size: 1.6vmin;
		color: rgba(255,255,255,0.28);
		letter-spacing: 0.04em;
	}
</style>
