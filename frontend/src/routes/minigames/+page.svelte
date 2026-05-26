<script lang="ts">
	import {
		bingoSession, bingoLobby, electronEmitter, currentPlayer,
		urls, remoteAccess, ngrokStatus, bingoRevertMessage, bingoLeaderboard
	} from '$lib/utils/store.svelte';
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { generateBoard } from '$lib/utils/bingoGenerator';
	import type { BingoSettings, BingoBox, BingoRole, BingoDifficulty, BingoWinCondition } from '$lib/models/types/bingo';
	import { tooltip } from 'svooltip';
	import BingoBoardGrid from '$lib/components/bingo/BingoBoardGrid.svelte';
	import ObsIntegration from '$lib/components/obs/ObsIntegration.svelte';
	// @ts-ignore
	import QrCode from 'svelte-qrcode';

	type Game = 'bingo';
	type Mode = 'solo' | 'host' | 'guest';

	let selectedGame: Game | null = null;
	let showSelector = true;

	function selectGame(game: Game) {
		selectedGame = game;
		showSelector = false;
	}

	// Bingo
	const difficulties: BingoDifficulty[] = ['easy', 'medium', 'hard'];
	const boardSizes: (3 | 4 | 5)[] = [3, 4, 5];
	const modes: { value: Mode; label: string }[] = [
		{ value: 'solo', label: 'Solo' },
		{ value: 'host', label: 'Host' },
	];
	const winConditions: { value: BingoWinCondition; label: string; tip: string }[] = [
		{ value: 1, label: '1', tip: 'First to complete 1 line (row, column, or diagonal)' },
		{ value: 2, label: '2', tip: 'First to complete 2 lines' },
		{ value: 3, label: '3', tip: 'First to complete 3 lines' },
		{ value: 4, label: '4', tip: 'First to complete 4 lines' },
		{ value: 5, label: '5', tip: 'First to complete 5 lines' },
		{ value: 'full',       label: 'Full Board',  tip: 'Complete every tile on the board to win' },
		{ value: 'lockout',    label: 'Lockout',     tip: 'Each tile can only be claimed by one player. First to the majority wins.' },
		{ value: 'rowcontrol', label: 'Row Control', tip: 'Control a row or column by holding the majority of its tiles (2 of 3, or 3 of 4–5). First to control 3 lines wins. Block opponents by contesting the same rows.' },
	];

	let mode: Mode = 'solo';
	let guestUrl = '';
	let connecting = false;

	let settings: BingoSettings = {
		mode: 'solo',
		boardSize: 5,
		difficulty: 'medium',
		winCondition: 3,
		lines: { rows: true, columns: true, diagonals: true },
		requireQueueAfterGame: false,
		timer: { enabled: false, durationMinutes: 60 },
	};

	let previewBoard = generateBoard(settings);
	$: if (settings) previewBoard = generateBoard(settings);

	function enterLobby() {
		$electronEmitter.emit('BingoStartLobby');
	}

	function start() {
		const board = generateBoard(settings);
		$electronEmitter.emit('StartBingo', {
			board,
			settings,
			startedAt: Date.now(),
			localPlayerIndex: $currentPlayer?.playerIndex ?? null,
			role: 'host' as BingoRole,
			opponentConnected: $bingoLobby?.opponentConnected ?? false,
			localName: $currentPlayer?.displayName || 'Player 1',
			opponentName: $bingoLobby?.opponentName ?? null,
		});
	}

	function startSolo() {
		const board = generateBoard(settings);
		$electronEmitter.emit('StartBingo', {
			board,
			settings: { ...settings, mode: 'solo' as const },
			startedAt: Date.now(),
			localPlayerIndex: $currentPlayer?.playerIndex ?? null,
			role: 'solo' as BingoRole,
			opponentConnected: false,
			localName: $currentPlayer?.displayName || 'Player 1',
			opponentName: null as string | null,
		});
	}

	function joinAsGuest() {
		if (!guestUrl.trim()) return;
		connecting = true;
		$electronEmitter.emit('BingoPeerConnect', guestUrl.trim());
	}

	function stop() {
		connecting = false;
		$electronEmitter.emit('StopBingo');
		selectedGame = null;
		showSelector = true;
	}

	$: if ($bingoLobby) connecting = false;
	$: if ($bingoSession?.role === 'guest') connecting = false;
	$: if (!$bingoSession && !$bingoLobby) connecting = false;

	$: inLobby = !!$bingoLobby && !$bingoSession;
	$: session = $bingoSession;
	$: board = session?.board ?? previewBoard;
	$: isActive = !!session;
	$: size = board.size;
	$: role = session?.role ?? 'solo';
	$: opponentConnected = session?.opponentConnected ?? false;
	$: completedCount = board.boxes.filter((b) => b.completed).length;
	$: activeWinCondition = session?.settings?.winCondition ?? settings.winCondition;

	// If session already active when page loads, jump into it
	$: if (isActive && !selectedGame) {
		selectedGame = 'bingo';
		showSelector = false;
	}

	function winConditionLabel(wc: BingoWinCondition): string {
		if (wc === 'lockout') return 'Lockout';
		if (wc === 'full') return 'Full Board';
		if (wc === 'rowcontrol') return 'Row Control';
		return `${wc} line${wc > 1 ? 's' : ''}`;
	}

	let now = Date.now();
	let timerInterval: ReturnType<typeof setInterval> | null = null;

	$: if (session?.startedAt) now = Date.now();
	$: if (isActive) {
		if (!timerInterval) timerInterval = setInterval(() => (now = Date.now()), 1000);
	} else {
		if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
	}

	$: timerSecondsElapsed = isActive ? Math.floor((now - (session?.startedAt ?? now)) / 1000) : 0;
	$: timerSecondsLeft = (() => {
		if (!session?.settings?.timer?.enabled) return null;
		const end = session!.startedAt + session!.settings.timer.durationMinutes * 60 * 1000;
		return Math.max(0, Math.floor((end - now) / 1000));
	})();

	function formatTimer(s: number): string {
		const h = Math.floor(s / 3600);
		const m = Math.floor((s % 3600) / 60);
		const sec = s % 60;
		if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
		return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
	}

	$: localOverlayUrl = $urls?.local ? `${$urls.local.replace(/\/$/, '')}/obs/bingo/overlay` : '';
	$: shareUrl = $remoteAccess?.ngrok ?? '';
	$: tailscaleBase = $remoteAccess?.tailscale ?? $urls?.external ?? '';
	$: qrOverlayUrl = tailscaleBase ? `${tailscaleBase.replace(/\/$/, '')}/obs/bingo/overlay` : localOverlayUrl;

	// Solo win recording
	let recordedWin = false;
	$: if (hasWon && !recordedWin && role === 'solo' && session) {
		recordedWin = true;
		$electronEmitter.emit('BingoSoloWin', {
			timeSeconds: timerSecondsElapsed,
			boardSize: session.board.size as 3 | 4 | 5,
			winCondition: session.settings.winCondition,
			difficulty: session.settings.difficulty,
		});
	}
	$: if (!isActive) recordedWin = false;

	// Leaderboard popup
	let showLeaderboard = false;

	function rulesetKey(boardSize: number, winCondition: unknown, difficulty: string): string {
		return `${boardSize}_${winCondition}_${difficulty}`;
	}

	function rulesetLabel(key: string): string {
		const parts = key.split('_');
		const size = parts[0];
		const diff = parts[parts.length - 1];
		const winParts = parts.slice(1, -1);
		const wc = winParts.join('_');
		const winLabel = wc === 'full' ? 'Full Board' : wc === 'lockout' ? 'Lockout' : wc === 'rowcontrol' ? 'Row Control' : `${wc} line${Number(wc) > 1 ? 's' : ''}`;
		return `${size}×${size} · ${winLabel} · ${diff}`;
	}

	function formatTime(s: number): string {
		const h = Math.floor(s / 3600);
		const m = Math.floor((s % 3600) / 60);
		const sec = s % 60;
		if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
		return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
	}

	function formatDate(ts: number): string {
		return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
	}

	$: currentKey = rulesetKey(settings.boardSize, settings.winCondition, settings.difficulty);

	$: sortedRulesets = (() => {
		const keys = Object.keys($bingoLeaderboard.records);
		return [
			...(keys.includes(currentKey) ? [currentKey] : []),
			...keys.filter(k => k !== currentKey),
		];
	})();

	onMount(() => {
		const s = $ngrokStatus;
		if (s?.installed && s?.authenticated && !s?.running) {
			$electronEmitter.emit('NgrokStart');
		}
		$electronEmitter.emit('GetBingoLeaderboard');
	});

	let showQr = false;
	let copiedShare = false;

	function getRowControlBoxes(boxes: BingoBox[], sz: number, player: 'local' | 'opponent'): Set<number> {
		const mine = (b: BingoBox) => player === 'local' ? (b.completedBy === 'local' || b.completedBy === 'both') : (b.completedBy === 'opponent' || b.completedBy === 'both');
		const required = Math.floor(sz / 2) + 1;
		const controlled = new Set<number>();
		const check = (line: number[]) => { if (line.filter(i => mine(boxes[i])).length >= required) line.forEach(i => controlled.add(i)); };
		for (let r = 0; r < sz; r++) check(Array.from({ length: sz }, (_, c) => r * sz + c));
		for (let c = 0; c < sz; c++) check(Array.from({ length: sz }, (_, r) => r * sz + c));
		return controlled;
	}

	function countControlledLines(boxes: BingoBox[], sz: number, player: 'local' | 'opponent'): number {
		const mine = (b: BingoBox) => player === 'local' ? (b.completedBy === 'local' || b.completedBy === 'both') : (b.completedBy === 'opponent' || b.completedBy === 'both');
		const required = Math.floor(sz / 2) + 1;
		let n = 0;
		for (let r = 0; r < sz; r++) { const line = Array.from({ length: sz }, (_, c) => r * sz + c); if (line.filter(i => mine(boxes[i])).length >= required) n++; }
		for (let c = 0; c < sz; c++) { const line = Array.from({ length: sz }, (_, r) => r * sz + c); if (line.filter(i => mine(boxes[i])).length >= required) n++; }
		return n;
	}

	function getWinBoxesFiltered(boxes: BingoBox[], sz: number, filter: (b: BingoBox) => boolean): Set<number> {
		const done = new Set(boxes.map((b, i) => (filter(b) ? i : -1)).filter((i) => i >= 0));
		const win = new Set<number>();
		for (let r = 0; r < sz; r++) {
			const row = Array.from({ length: sz }, (_, c) => r * sz + c);
			if (row.every((i) => done.has(i))) row.forEach((i) => win.add(i));
		}
		for (let c = 0; c < sz; c++) {
			const col = Array.from({ length: sz }, (_, r) => r * sz + c);
			if (col.every((i) => done.has(i))) col.forEach((i) => win.add(i));
		}
		const d1 = Array.from({ length: sz }, (_, i) => i * sz + i);
		if (d1.every((i) => done.has(i))) d1.forEach((i) => win.add(i));
		const d2 = Array.from({ length: sz }, (_, i) => i * sz + (sz - 1 - i));
		if (d2.every((i) => done.has(i))) d2.forEach((i) => win.add(i));
		return win;
	}

	$: localWinBoxes = activeWinCondition === 'rowcontrol'
		? getRowControlBoxes(board.boxes, size, 'local')
		: getWinBoxesFiltered(board.boxes, size, b => b.completedBy === 'local' || b.completedBy === 'both');
	$: oppWinBoxes = activeWinCondition === 'rowcontrol'
		? getRowControlBoxes(board.boxes, size, 'opponent')
		: getWinBoxesFiltered(board.boxes, size, b => b.completedBy === 'opponent' || b.completedBy === 'both');

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
		const wc = activeWinCondition;
		const boxes = board.boxes;
		if (wc === 'full') return boxes.every(b => b.completed);
		if (wc === 'lockout') {
			const total = boxes.length;
			const localCount = boxes.filter(b => b.completedBy === 'local' || b.completedBy === 'both').length;
			const oppCount = boxes.filter(b => b.completedBy === 'opponent' || b.completedBy === 'both').length;
			return localCount > total / 2 || oppCount > total / 2;
		}
		if (wc === 'rowcontrol') {
			return countControlledLines(boxes, size, 'local') >= 3 || countControlledLines(boxes, size, 'opponent') >= 3;
		}
		const n = wc as number;
		const localLines = countLines(boxes, size, b => b.completedBy === 'local' || b.completedBy === 'both');
		const oppLines = countLines(boxes, size, b => b.completedBy === 'opponent' || b.completedBy === 'both');
		return localLines >= n || oppLines >= n;
	})();

	$: localScore = (() => {
		const wc = activeWinCondition;
		const boxes = board.boxes;
		if (wc === 'rowcontrol') return countControlledLines(boxes, size, 'local');
		if (wc === 'lockout' || wc === 'full') return boxes.filter(b => b.completedBy === 'local' || b.completedBy === 'both').length;
		return countLines(boxes, size, b => b.completedBy === 'local' || b.completedBy === 'both');
	})();

	$: oppScore = (() => {
		const wc = activeWinCondition;
		const boxes = board.boxes;
		if (wc === 'rowcontrol') return countControlledLines(boxes, size, 'opponent');
		if (wc === 'lockout' || wc === 'full') return boxes.filter(b => b.completedBy === 'opponent' || b.completedBy === 'both').length;
		return countLines(boxes, size, b => b.completedBy === 'opponent' || b.completedBy === 'both');
	})();

	$: scoreTarget = (() => {
		const wc = activeWinCondition;
		if (wc === 'rowcontrol') return 3;
		if (wc === 'lockout') return Math.floor(board.boxes.length / 2) + 1;
		if (wc === 'full') return board.boxes.length;
		return wc as number;
	})();

	$: scoreUnit = activeWinCondition === 'lockout' || activeWinCondition === 'full' ? 'tiles' : 'lines';

	$: localPlayerName = session?.localName ?? 'You';
	$: opponentPlayerName = session?.opponentName ?? 'Opponent';
</script>

<main class="background-primary-color text-secondary-color flex justify-center">
	<div class="w-full max-w-2xl flex flex-col gap-5">

		<!-- Header -->
		<div class="flex items-start justify-between gap-4 flex-wrap">
			<div>
				<div class="flex items-center gap-2">
					{#if selectedGame && !isActive}
						<button class="back-btn" on:click={() => { selectedGame = null; showSelector = true; }}>←</button>
					{/if}
					<h1 class="font-bold text-3xl">
						{#if selectedGame === 'bingo'}Bingo{:else}Minigames{/if}
					</h1>
				</div>
				{#if selectedGame === 'bingo' && isActive}
					<p class="text-sm opacity-50 mt-1">
						{completedCount}/{board.boxes.length} · {board.difficulty} · {winConditionLabel(activeWinCondition)}
						{#if role !== 'solo'}
							· {role === 'host' ? 'Hosting' : 'Guest'}
							{#if opponentConnected}
								<span class="text-green-400">● Connected</span>
							{:else}
								<span class="opacity-40">○ Waiting</span>
							{/if}
						{/if}
					</p>
				{:else if selectedGame === 'bingo'}
					<p class="text-sm opacity-50 mt-1">Challenge yourself across a session</p>
				{:else}
					<p class="text-sm opacity-50 mt-1">Choose a minigame to play</p>
				{/if}
			</div>

			{#if selectedGame === 'bingo'}
				{#if isActive}
					<div class="flex gap-2">
						<button class="btn text-sm h-9 px-4 border-secondary rounded opacity-60" on:click={() => (showLeaderboard = true)}>Best Times</button>
						<button class="btn text-sm h-9 px-4 border-secondary rounded" on:click={stop}>End</button>
					</div>
				{:else if inLobby && mode === 'host'}
					<div class="flex gap-2">
						<button class="btn text-sm h-9 px-4 border-secondary rounded opacity-50" on:click={stop}>Cancel</button>
						<button class="btn text-sm h-9 px-4 border-secondary rounded disabled:opacity-40" on:click={start} disabled={!$bingoLobby?.opponentConnected}>Start</button>
					</div>
				{:else if inLobby && mode === 'guest'}
					<button class="btn text-sm h-9 px-4 border-secondary rounded opacity-50" on:click={stop}>Leave</button>
				{:else if mode === 'guest'}
					<div class="flex gap-2">
						<button class="btn text-sm h-9 px-4 border-secondary rounded opacity-50" on:click={() => (mode = 'solo')}>← Back</button>
						{#if !connecting}
							<button class="btn text-sm h-9 px-4 border-secondary rounded disabled:opacity-40" on:click={joinAsGuest} disabled={!guestUrl.trim()}>Join</button>
						{/if}
					</div>
				{:else}
					<div class="flex gap-2">
						<button class="btn text-sm h-9 px-4 border-secondary rounded opacity-60" on:click={() => (showLeaderboard = true)}>Best Times</button>
						{#if mode === 'host'}
							<button class="btn text-sm h-9 px-4 border-secondary rounded" on:click={enterLobby}>Host</button>
						{:else}
							<button class="btn text-sm h-9 px-4 border-secondary rounded" on:click={startSolo}>Start</button>
						{/if}
					</div>
				{/if}
			{/if}
		</div>

		<!-- Bingo: settings (idle only) -->
		{#if selectedGame === 'bingo' && !isActive && !inLobby && mode !== 'guest'}
			<div class="settings-row border-secondary">
				<div class="settings-group">
					<span class="settings-label">Mode</span>
					<div class="pill-group">
						{#each modes as { value: m, label }}
							<button class="pill" class:pill--active={mode === m} on:click={() => (mode = m)}>{label}</button>
						{/each}
						<button class="pill" on:click={() => (mode = 'guest')}>Join</button>
					</div>
				</div>
				<div class="settings-group">
					<span class="settings-label">Size</span>
					<div class="pill-group">
						{#each boardSizes as s}
							<button class="pill" class:pill--active={settings.boardSize === s}
								on:click={() => (settings = { ...settings, boardSize: s })}>{s}×{s}</button>
						{/each}
					</div>
				</div>
				<div class="settings-group">
					<span class="settings-label">Win</span>
					<div class="pill-group">
						{#each winConditions as wc}
							<button
								class="pill"
								class:pill--active={settings.winCondition === wc.value}
								on:click={() => (settings = { ...settings, winCondition: wc.value })}
								use:tooltip={{ content: wc.tip, placement: 'top', delay: [400, 0] }}
							>{wc.label}</button>
						{/each}
					</div>
				</div>
				<div class="settings-group">
					<span class="settings-label">Difficulty</span>
					<div class="pill-group">
						{#each difficulties as d}
							<button class="pill" class:pill--active={settings.difficulty === d}
								on:click={() => (settings = { ...settings, difficulty: d })}>{d}</button>
						{/each}
					</div>
				</div>
				<div class="settings-group">
					<span class="settings-label">Timer</span>
					<div class="pill-group">
						<button class="pill" class:pill--active={!settings.timer.enabled}
							on:click={() => (settings = { ...settings, timer: { ...settings.timer, enabled: false } })}>Off</button>
						<button class="pill" class:pill--active={settings.timer.enabled}
							on:click={() => (settings = { ...settings, timer: { ...settings.timer, enabled: true } })}>On</button>
					</div>
					{#if settings.timer.enabled}
						<div class="flex items-center gap-1">
							<input
								class="timer-input border-secondary background-primary-color text-secondary-color"
								type="number" min="1" max="480"
								bind:value={settings.timer.durationMinutes}
							/>
							<span class="settings-label">min</span>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Bingo: lobby status -->
		{#if selectedGame === 'bingo' && inLobby}
			<div class="settings-row border-secondary items-center gap-3">
				{#if $bingoLobby?.opponentConnected}
					<span class="text-green-400 text-sm font-semibold">● {$bingoLobby.opponentName ?? 'Opponent'} connected</span>
					{#if mode === 'host'}
						<span class="text-sm opacity-50">— ready to start</span>
					{:else}
						<span class="text-sm opacity-50">— waiting for host to start…</span>
					{/if}
				{:else}
					<span class="text-sm opacity-50">○ Waiting for opponent to join…</span>
				{/if}
			</div>
		{/if}

		<!-- Bingo: guest join input -->
		{#if selectedGame === 'bingo' && !isActive && mode === 'guest'}
			<div class="settings-row border-secondary flex-col gap-3">
				<p class="text-sm opacity-60">Enter your opponent's share URL to join their bingo session.</p>
				<input
					class="url-input border-secondary background-primary-color text-secondary-color"
					placeholder="https://abc123.ngrok-free.app"
					bind:value={guestUrl}
				/>
				{#if connecting}
					<p class="text-sm opacity-50">Connecting…</p>
				{/if}
			</div>
		{/if}

		<!-- Bingo: host share URL -->
		{#if selectedGame === 'bingo' && ((isActive && role === 'host') || (!isActive && mode === 'host') || (inLobby && mode === 'host'))}
			<div class="settings-row border-secondary items-center justify-between gap-3">
				<div class="flex flex-col gap-0.5 min-w-0">
					<span class="settings-label">Share with opponent</span>
					{#if shareUrl}
						<span class="text-xs opacity-60 truncate">{shareUrl}</span>
					{:else}
						<span class="text-xs opacity-40">No ngrok URL — start ngrok in Settings → Remote Access</span>
					{/if}
				</div>
				<div class="flex gap-2 shrink-0">
					<button class="btn text-sm h-9 px-4 border-secondary rounded" on:click={() => $electronEmitter.emit('NgrokRestart')}>↻</button>
					{#if shareUrl}
						<button class="btn text-sm h-9 px-4 border-secondary rounded" on:click={async () => { await navigator.clipboard.writeText(shareUrl); copiedShare = true; setTimeout(() => (copiedShare = false), 1500); }}>
							{copiedShare ? 'Copied!' : 'Copy URL'}
						</button>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Bingo: OBS overlay row -->
		{#if selectedGame === 'bingo' && localOverlayUrl}
			<div class="settings-row border-secondary items-center justify-between gap-3">
				<div class="flex flex-col gap-0.5 min-w-0">
					<span class="settings-label">Display on device / OBS</span>
					<span class="text-xs opacity-60 truncate">{localOverlayUrl}</span>
				</div>
				<div class="flex gap-2 shrink-0">
					<button class="btn text-sm h-9 px-4 border-secondary rounded" on:click={() => window.open(localOverlayUrl, '_blank', 'width=600,height=600')}>
						Popup
					</button>
					<ObsIntegration url={localOverlayUrl} title="Bingo" width={500} height={500} />
					<button class="btn text-sm h-9 px-4 border-secondary rounded" on:click={() => (showQr = !showQr)}>
						{showQr ? 'Hide QR' : 'QR'}
					</button>
				</div>
			</div>
			{#if showQr}
				<div class="qr-row border-secondary">
					<QrCode value={qrOverlayUrl} size="180" color="#ffffff" background="#1a1a1a" />
					<div class="flex flex-col gap-1">
						<p class="text-sm opacity-60">Scan to open on your phone or second screen</p>
						<p class="text-xs opacity-40 break-all">{qrOverlayUrl}</p>
						<p class="text-xs opacity-40 mt-1">⚠ Do not share this URL — use the ngrok link for opponents</p>
					</div>
				</div>
			{/if}
		{/if}

		<!-- Bingo: timer -->
		{#if selectedGame === 'bingo' && isActive}
			<div class="timer-bar border-secondary" class:timer-bar--urgent={timerSecondsLeft !== null && timerSecondsLeft <= 300}>
				{#if timerSecondsLeft === 0}
					<span>⏱ Time's up!</span>
				{:else if timerSecondsLeft !== null}
					<span>⏱ {formatTimer(timerSecondsLeft)}</span>
				{:else}
					<span>⏱ {formatTimer(timerSecondsElapsed)}</span>
				{/if}
			</div>
		{/if}

		<!-- Bingo: win banner -->
		{#if selectedGame === 'bingo' && hasWon}
			<div class="win-banner border-secondary">
				<span>Bingo!</span>
				{#if role !== 'solo'}
					<span class="win-score">{localPlayerName} {localScore} – {oppScore} {opponentPlayerName}</span>
				{:else}
					<span class="win-score">{localScore}/{scoreTarget} {scoreUnit}</span>
				{/if}
			</div>
		{/if}

		<!-- Bingo: revert notification -->
		{#if selectedGame === 'bingo' && $bingoRevertMessage}
			<div class="revert-banner" in:fly={{ y: -20, duration: 250 }} out:fly={{ y: -20, duration: 200 }}>
				⚠ {$bingoRevertMessage}
			</div>
		{/if}

		<!-- Bingo: board -->
		{#if selectedGame === 'bingo' && !inLobby}
			<div style="aspect-ratio:1/1; width:100%;">
				<BingoBoardGrid
					boxes={board.boxes}
					{size}
					{role}
					{localWinBoxes}
					{oppWinBoxes}
					devMode={isActive}
					on:devsimulate={(e) => $electronEmitter.emit('BingoDevSimulate', e.detail.instanceId, e.detail.player)}
				/>
			</div>
			{#if isActive}
				<div class="score-row">
					{#if role !== 'solo'}
						<div class="score-player" class:score-player--winner={hasWon && localScore >= scoreTarget}>
							<span class="score-name">{localPlayerName}</span>
							<span class="score-val">{localScore}<span class="score-target">/{scoreTarget}</span></span>
							<span class="score-unit">{scoreUnit}</span>
						</div>
						<div class="score-divider">–</div>
						<div class="score-player score-player--right" class:score-player--winner={hasWon && oppScore >= scoreTarget}>
							<span class="score-unit">{scoreUnit}</span>
							<span class="score-val">{oppScore}<span class="score-target">/{scoreTarget}</span></span>
							<span class="score-name">{opponentPlayerName}</span>
						</div>
					{:else}
						<div class="score-solo">
							<span class="score-val">{localScore}<span class="score-target">/{scoreTarget}</span></span>
							<span class="score-unit">{scoreUnit}</span>
						</div>
					{/if}
				</div>
			{/if}
		{/if}

	</div>
</main>

<!-- Leaderboard popup -->
{#if showLeaderboard}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<div class="selector-backdrop" on:click={() => (showLeaderboard = false)}>
		<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
		<div class="leaderboard-modal background-primary-color border-secondary" on:click|stopPropagation in:fly={{ y: 20, duration: 180 }}>
			<div class="leaderboard-header">
				<p class="selector-title">Best Times — Solo Bingo</p>
				<button class="btn text-xs h-7 px-3 border-secondary rounded" on:click={() => (showLeaderboard = false)}>✕</button>
			</div>
			{#if sortedRulesets.length === 0}
				<p class="text-sm opacity-40 text-center py-6">No records yet. Complete a solo game to set a time.</p>
			{:else}
				<div class="leaderboard-body">
					{#each sortedRulesets as key}
						{@const entries = $bingoLeaderboard.records[key] ?? []}
						{@const isCurrent = key === currentKey}
						<div class="lb-section" class:lb-section--current={isCurrent}>
							<p class="lb-ruleset">{rulesetLabel(key)}{#if isCurrent} <span class="lb-current-badge">current</span>{/if}</p>
							<table class="lb-table">
								<thead>
									<tr>
										<th>#</th>
										<th>Time</th>
										<th>Date</th>
										<th>Ver</th>
									</tr>
								</thead>
								<tbody>
									{#each entries as entry, i}
										{@const isOldVersion = entry.version !== $bingoLeaderboard.currentVersion}
										<tr class:lb-row--old={isOldVersion}>
											<td class="lb-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}</td>
											<td class="lb-time">{formatTime(entry.timeSeconds)}</td>
											<td class="lb-date">{formatDate(entry.completedAt)}</td>
											<td class="lb-ver" title={isOldVersion ? `Set on v${entry.version}` : ''}>{entry.version}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Game selector popup -->
{#if showSelector}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<div class="selector-backdrop">
		<div class="selector-modal background-primary-color border-secondary" in:fly={{ y: 20, duration: 180 }}>
			<p class="selector-title">Choose a Minigame</p>
			<div class="game-grid">
				<button class="game-card border-secondary" on:click={() => selectGame('bingo')}>
					<span class="game-card-title">Bingo</span>
					<span class="game-card-desc">Complete challenges in unranked play and race to be the first to get a bingo.</span>
				</button>
				<div class="game-card game-card--soon border-secondary">
					<span class="game-card-title">Races</span>
					<span class="game-card-badge">Coming soon</span>
				</div>
				<div class="game-card game-card--soon border-secondary">
					<span class="game-card-title">Iron Man</span>
					<span class="game-card-badge">Coming soon</span>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	main {
		min-height: 100vh;
		padding: 2rem 1.5rem;
	}

	.back-btn {
		background: transparent;
		border: none;
		color: var(--secondary-color);
		opacity: 0.5;
		cursor: pointer;
		font-size: 1rem;
		padding: 0;
		transition: opacity 0.1s;
		line-height: 1;
	}
	.back-btn:hover { opacity: 1; }

	.selector-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.leaderboard-modal {
		width: 100%;
		max-width: 560px;
		border-radius: 0.6rem;
		display: flex;
		flex-direction: column;
		max-height: 80vh;
		overflow: hidden;
	}

	.leaderboard-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.9rem 1.1rem 0.7rem;
		border-bottom: 1px solid var(--secondary-color);
		flex-shrink: 0;
	}

	.leaderboard-body {
		overflow-y: auto;
		padding: 0.8rem 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
	}

	.lb-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.lb-section--current .lb-ruleset {
		opacity: 1;
	}

	.lb-ruleset {
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		opacity: 0.5;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.4em;
	}

	.lb-current-badge {
		font-size: 0.6rem;
		background: color-mix(in srgb, var(--secondary-color) 15%, transparent);
		border: 1px solid var(--secondary-color);
		border-radius: 0.25rem;
		padding: 0 0.35em;
		text-transform: lowercase;
		opacity: 0.8;
		letter-spacing: 0;
	}

	.lb-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8rem;
	}

	.lb-table th {
		font-size: 0.62rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.35;
		font-weight: 600;
		text-align: left;
		padding: 0 0.5rem 0.3rem 0;
	}

	.lb-table td {
		padding: 0.25rem 0.5rem 0.25rem 0;
		border-top: 1px solid rgba(128, 128, 128, 0.1);
	}

	.lb-rank { width: 2rem; }
	.lb-time { font-variant-numeric: tabular-nums; font-weight: 600; }
	.lb-date { opacity: 0.5; }
	.lb-ver { opacity: 0.4; font-size: 0.72em; }

	.lb-row--old td {
		opacity: 0.45;
	}

	.selector-modal {
		width: 100%;
		max-width: 520px;
		border-radius: 0.6rem;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
	}

	.selector-title {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.45;
	}

	.game-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	.game-card {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 1rem 0.9rem;
		border-radius: 0.4rem;
		cursor: pointer;
		background: transparent;
		color: var(--secondary-color);
		text-align: left;
		transition: background 0.12s;
	}

	.game-card:not(.game-card--soon):hover {
		background: color-mix(in srgb, var(--secondary-color) 8%, transparent);
	}

	.game-card--soon {
		cursor: default;
		opacity: 0.35;
	}

	.game-card-title {
		font-size: 0.95rem;
		font-weight: 700;
	}

	.game-card-desc {
		font-size: 0.75rem;
		opacity: 0.6;
		line-height: 1.4;
	}

	.game-card-badge {
		font-size: 0.62rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		opacity: 0.7;
	}

	.revert-banner {
		background: rgba(220, 120, 0, 0.92);
		color: #fff;
		font-weight: 700;
		font-size: 0.9rem;
		padding: 0.6rem 1rem;
		border-radius: 0.375rem;
		text-align: center;
	}

	.settings-row {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
		padding: 0.9rem 1.1rem;
		border-radius: 0.375rem;
		align-items: center;
	}

	.settings-group {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.settings-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.45;
		white-space: nowrap;
	}

	.pill-group {
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
	}

	.pill {
		padding: 0.2rem 0.65rem;
		border-radius: 1rem;
		font-size: 0.78rem;
		border: 1px solid var(--secondary-color);
		background: transparent;
		color: var(--secondary-color);
		opacity: 0.4;
		cursor: pointer;
		transition: opacity 0.12s;
	}

	.pill--active,
	.pill:hover {
		opacity: 1;
		background: color-mix(in srgb, var(--secondary-color) 12%, transparent);
	}

	.url-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.85rem;
		outline: none;
	}

	.timer-input {
		width: 4rem;
		padding: 0.2rem 0.4rem;
		border-radius: 0.25rem;
		font-size: 0.82rem;
		text-align: center;
		outline: none;
	}

	.timer-bar {
		text-align: center;
		font-size: 1.4rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		padding: 0.4rem;
		border-radius: 0.375rem;
		letter-spacing: 0.05em;
	}

	.timer-bar--urgent {
		color: #f87171;
		animation: pulse 1.2s ease-in-out infinite;
	}

	.win-banner {
		text-align: center;
		font-size: 1.6rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		padding: 0.6rem;
		border-radius: 0.375rem;
		animation: pulse 1.2s ease-in-out infinite;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
	}

	.win-score {
		font-size: 0.85rem;
		font-weight: 500;
		letter-spacing: 0.04em;
		opacity: 0.75;
	}

	.score-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.2rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		margin-top: 0.25rem;
	}

	.score-player {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.05rem;
		min-width: 6rem;
	}

	.score-player--right {
		align-items: flex-end;
	}

	.score-player--winner .score-val {
		color: #4ade80;
	}

	.score-name {
		font-size: 0.7rem;
		opacity: 0.5;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 9rem;
	}

	.score-val {
		font-size: 1.3rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}

	.score-target {
		font-size: 0.75rem;
		opacity: 0.4;
		font-weight: 400;
	}

	.score-unit {
		font-size: 0.65rem;
		opacity: 0.4;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.score-divider {
		font-size: 1.1rem;
		opacity: 0.3;
		font-weight: 300;
	}

	.score-solo {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.55; }
	}

	.qr-row {
		display: flex;
		gap: 1.5rem;
		align-items: center;
		padding: 1rem 1.1rem;
		border-radius: 0.375rem;
	}
</style>
