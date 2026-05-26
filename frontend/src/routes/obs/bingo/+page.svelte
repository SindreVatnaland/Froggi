<script lang="ts">
	import { bingoSession, bingoLobby, electronEmitter, currentPlayer, urls, remoteAccess, ngrokStatus, bingoRevertMessage, bingoVoteState } from '$lib/utils/store.svelte';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { generateBoard } from '$lib/utils/bingoGenerator';
	import type { BingoSettings, BingoBox, BingoRole, BingoDifficulty, BingoWinCondition } from '$lib/models/types/bingo';
	import { tooltip } from 'svooltip';
	import BingoBoardGrid from '$lib/components/bingo/BingoBoardGrid.svelte';
	import ScoreProgressBar from '$lib/components/ScoreProgressBar.svelte';
	import OverlayRow from '$lib/components/OverlayRow.svelte';
	import NgrokShareRow from '$lib/components/NgrokShareRow.svelte';

	type Mode = 'solo' | 'host' | 'guest';

	const difficulties: BingoDifficulty[] = ['easy', 'medium', 'hard'];
	const boardSizes: (3 | 4 | 5)[] = [3, 4, 5];
	const modes: { value: Mode; label: string }[] = [{ value: 'solo', label: 'Solo' }, { value: 'host', label: 'Host' }];

	const winConditions: { value: BingoWinCondition; label: string; tip: string }[] = [
		{ value: 1, label: '1',         tip: 'First to complete 1 line (row, column, or diagonal)' },
		{ value: 2, label: '2',         tip: 'First to complete 2 lines' },
		{ value: 3, label: '3',         tip: 'First to complete 3 lines' },
		{ value: 4, label: '4',         tip: 'First to complete 4 lines' },
		{ value: 5, label: '5',         tip: 'First to complete 5 lines' },
		{ value: 'full',       label: 'Full Board',   tip: 'Complete every tile on the board to win' },
		{ value: 'lockout',    label: 'Lockout',      tip: 'Each tile can only be claimed by one player. First to the majority wins. Neither player can complete a tile the opponent has already taken.' },
		{ value: 'rowcontrol', label: 'Row Control',  tip: 'Control a row or column by holding the majority of its tiles (2 of 3, or 3 of 4–5). First to control 3 lines wins. Block opponents by contesting the same rows.' },
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
		twitchEnabled: false,
		twitchChannel: '',
	};

	$: vote = $bingoVoteState;
	$: voteActive = vote?.active ?? false;
	$: voteResult = !vote?.active && !!vote?.result;

	function voteTimeLeft(vote: typeof $bingoVoteState): number {
		if (!vote?.active) return 0;
		const elapsed = Date.now() - vote.startedAt;
		return Math.max(0, Math.ceil((vote.durationMs - elapsed) / 1000));
	}

	let voteTick = 0;
	$: if (voteActive) {
		const iv = setInterval(() => voteTick++, 1000);
		setTimeout(() => clearInterval(iv), (vote?.durationMs ?? 30000) + 1000);
	}
	$: voteSecondsLeft = vote ? voteTimeLeft(vote) : 0;
	$: if (voteTick) voteSecondsLeft = vote ? voteTimeLeft(vote) : 0;

	let showInfoModal = false;

	let previewBoard = generateBoard(settings);
	$: if (settings) previewBoard = generateBoard(settings);

	function enterLobby() {
		$electronEmitter.emit('BingoStartLobby');
	}

	function start() {
		const board = generateBoard(settings);
		const session = {
			board,
			settings,
			startedAt: Date.now(),
			localPlayerIndex: $currentPlayer?.playerIndex ?? null,
			role: 'host' as BingoRole,
			opponentConnected: $bingoLobby?.opponentConnected ?? false,
			localName: $currentPlayer?.displayName || 'Player 1',
			opponentName: $bingoLobby?.opponentName ?? null,
		};
		$electronEmitter.emit('StartBingo', session);
	}

	function startSolo() {
		const board = generateBoard(settings);
		const session = {
			board,
			settings: { ...settings, mode: 'solo' as const },
			startedAt: Date.now(),
			localPlayerIndex: $currentPlayer?.playerIndex ?? null,
			role: 'solo' as BingoRole,
			opponentConnected: false,
			localName: $currentPlayer?.displayName || 'Player 1',
			opponentName: null as string | null,
		};
		$electronEmitter.emit('StartBingo', session);
	}

	function joinAsGuest() {
		if (!guestUrl.trim()) return;
		connecting = true;
		$electronEmitter.emit('BingoPeerConnect', guestUrl.trim());
	}

	function stop() {
		connecting = false;
		$electronEmitter.emit('StopBingo');
	}

	// Stop the connecting spinner when lobby or session is established
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

	function winConditionLabel(wc: BingoWinCondition): string {
		if (wc === 'lockout') return 'Lockout';
		if (wc === 'full') return 'Full Board';
		if (wc === 'rowcontrol') return 'Row Control';
		return `${wc} line${wc > 1 ? 's' : ''}`;
	}

	// Timer
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

	// Shared game-preview overlay (covers both bingo + iron man)
	$: localOverlayUrl = $urls?.local ? `${$urls.local.replace(/\/$/, '')}/obs/game-preview` : '';
	// Peer share URL must be ngrok (unique + private per session)
	$: shareUrl = $remoteAccess?.ngrok ?? '';
	// QR code: Tailscale (own device, permanent) — never ngrok (temporary/shared)
	$: tailscaleBase = $remoteAccess?.tailscale ?? $urls?.external ?? '';
	$: qrOverlayUrl = tailscaleBase ? `${tailscaleBase.replace(/\/$/, '')}/obs/game-preview` : localOverlayUrl;



	onMount(() => {
		const s = $ngrokStatus;
		if (s?.installed && s?.authenticated && !s?.running) {
			$electronEmitter.emit('NgrokStart');
		}
	});



	// Win detection
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
					<h1 class="font-bold text-3xl">Bingo</h1>
					<button class="info-btn border-secondary" on:click={() => (showInfoModal = true)}>?</button>
				</div>
				{#if isActive}
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
				{:else}
					<p class="text-sm opacity-50 mt-1">Challenge yourself across a session</p>
				{/if}
			</div>

			{#if isActive}
				<button class="btn text-sm h-9 px-4 border-secondary rounded" on:click={stop}>End</button>
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
					{#if mode === 'host'}
						<button class="btn text-sm h-9 px-4 border-secondary rounded" on:click={enterLobby}>Host</button>
					{:else}
						<button class="btn text-sm h-9 px-4 border-secondary rounded" on:click={startSolo}>Start</button>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Mode selector + settings (idle only, not while in lobby) -->
		{#if !isActive && !inLobby && mode !== 'guest'}
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
					<span class="settings-label">Difficulty</span>
					<div class="pill-group">
						{#each difficulties as d}
							<button class="pill" class:pill--active={settings.difficulty === d}
								on:click={() => (settings = { ...settings, difficulty: d })}>{d}</button>
						{/each}
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
			</div>
		{/if}

		<!-- Lobby status -->
		{#if inLobby}
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

		<!-- Guest: join URL input -->
		{#if !isActive && mode === 'guest'}
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

		<!-- Host: share URL row -->
		{#if (isActive && role === 'host') || (!isActive && mode === 'host') || (inLobby && mode === 'host')}
			<NgrokShareRow {shareUrl} />
		{/if}

		<!-- OBS / device overlay row -->
		{#if localOverlayUrl}
			<OverlayRow url={localOverlayUrl} qrUrl={qrOverlayUrl} title="Game Preview" />
		{/if}

		<!-- Timer -->
		{#if isActive}
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

		<!-- Win banner -->
		{#if hasWon}
			<div class="win-banner border-secondary">
				<span>Bingo!</span>
				{#if role !== 'solo'}
					<span class="win-score">{localPlayerName} {localScore} – {oppScore} {opponentPlayerName}</span>
				{:else}
					<span class="win-score">{localScore}/{scoreTarget} {scoreUnit}</span>
				{/if}
			</div>
		{/if}

		<!-- Revert notification -->
		{#if $bingoRevertMessage}
			<div class="revert-banner" in:fly={{ y: -20, duration: 250 }} out:fly={{ y: -20, duration: 200 }}>
				⚠ {$bingoRevertMessage}
			</div>
		{/if}

		<!-- Twitch vote banner (only shown in overlay) -->
		{#if vote && (voteActive || voteResult)}
			<div class="vote-banner border-secondary" class:vote-banner--result={voteResult} in:fly={{ y: -24, duration: 320 }} out:fly={{ y: -20, duration: 220 }}>
				{#if voteActive}
					<div class="vote-header">
						<span class="vote-title">Chat Vote</span>
						<span class="vote-timer">{voteSecondsLeft}s</span>
					</div>
					<div class="vote-options">
						{#each vote.options as opt, i}
							{@const totalVotes = vote.options.reduce((s, o) => s + o.votes, 0)}
							{@const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0}
							<div class="vote-option">
								<span class="vote-key">{i + 1}</span>
								<span class="vote-label">{opt.label}</span>
								<div class="vote-bar-wrap">
									<div class="vote-bar" style="width:{pct}%"></div>
								</div>
								<span class="vote-pct">{opt.votes}</span>
							</div>
						{/each}
					</div>
				{:else if voteResult && vote.result}
					<div class="vote-result">
						<span class="vote-result-label">{vote.result.winner.replace(/_/g, ' ')}</span>
						<span class="vote-result-desc">{vote.result.description}</span>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Board (hidden during lobby — no peeking before both are ready) -->
		{#if !inLobby}
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
			<ScoreProgressBar
				{localScore}
				localName={localPlayerName}
				oppScore={role !== 'solo' ? oppScore : null}
				oppName={opponentPlayerName}
				target={scoreTarget}
				unit={scoreUnit}
				localWinner={hasWon && localScore >= scoreTarget}
				oppWinner={hasWon && oppScore >= scoreTarget}
			/>
		{/if}
		{/if}

	</div>
</main>

{#if showInfoModal}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<div class="modal-backdrop" on:click={() => (showInfoModal = false)}>
		<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
		<div class="info-modal background-primary-color border-secondary" on:click|stopPropagation>
			<div class="info-modal-header">
				<span class="font-semibold text-sm">How Bingo works</span>
				<button class="btn text-xs h-7 px-3 border-secondary rounded" on:click={() => (showInfoModal = false)}>✕</button>
			</div>
			<div class="info-modal-body">

				<div class="info-section">
					<p class="info-label">Win conditions</p>
					<ul class="info-list">
						<li><strong>1–5 lines</strong> — First player to complete that many lines (rows, columns, or diagonals) wins.</li>
						<li><strong>Full Board</strong> — Complete every tile on the board to win.</li>
						<li><strong>Lockout</strong> — Each tile can only be claimed by one player. First to the majority of tiles wins. You cannot complete a tile your opponent has already taken.</li>
						<li><strong>Row Control</strong> — Control a row or column by holding the majority of its tiles (2 of 3, or 3 of 4–5). First to control 3 lines wins. Block opponents by contesting the same rows.</li>
					</ul>
				</div>

				<div class="info-section">
					<p class="info-label">Quitting a game (LRAS)</p>
					<ul class="info-list">
						<li>If you quit a game intentionally using <strong>LRAS</strong> (L + R + A + Start), your progress for that game is <strong>reverted</strong> — any tiles you advanced or completed during that game are rolled back to where they were at the start of the game.</li>
						<li>This prevents gaming the system by rage-quitting to avoid completing a challenge for your opponent.</li>
						<li>Self-destructs and losing stocks normally do <strong>not</strong> trigger a revert — only an intentional LRAS quit does.</li>
					</ul>
				</div>

				<div class="info-section">
					<p class="info-label">Playing vs an opponent</p>
					<ul class="info-list">
						<li>Select <strong>Host</strong> and start the session. Share your <strong>ngrok URL</strong> with your opponent.</li>
						<li>Your opponent selects <strong>Join</strong> and enters the URL. Both boards sync automatically.</li>
						<li>The ngrok URL is temporary and private — do not share it publicly.</li>
					</ul>
					{#if !$remoteAccess?.ngrok}
						<p class="info-warning">⚠ No ngrok URL detected. Set up ngrok in Settings → Remote Access to play online.</p>
					{:else}
						<p class="info-ok">● ngrok active: {$remoteAccess.ngrok}</p>
					{/if}
				</div>

				<div class="info-section">
					<p class="info-label">Watching on phone / second screen</p>
					<ul class="info-list">
						<li>Use the <strong>QR code</strong> (requires Tailscale) or <strong>Popup</strong> button to open the overlay on another device.</li>
						<li>Add the OBS Browser Source URL to OBS to display it on stream.</li>
					</ul>
					{#if !$remoteAccess?.tailscale}
						<p class="info-warning">⚠ No Tailscale URL — set up Tailscale in Settings → Remote Access for stable mobile access.</p>
					{:else}
						<p class="info-ok">● Tailscale active</p>
					{/if}
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

	/* ── Vote banner ── */
	.vote-banner {
		border-radius: 0.375rem;
		padding: 0.65rem 0.9rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		animation: vote-slide-in 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	@keyframes vote-slide-in {
		from { opacity: 0; transform: translateY(-18px) scaleY(0.85); }
		to   { opacity: 1; transform: translateY(0) scaleY(1); }
	}
	.vote-banner--result {
		animation: vote-pulse 0.8s ease-in-out 2;
	}
	@keyframes vote-pulse {
		0%, 100% { opacity: 1; }
		50%       { opacity: 0.6; }
	}
	.vote-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.vote-title {
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		opacity: 0.6;
	}
	.vote-timer {
		font-size: 0.78rem;
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		opacity: 0.7;
	}
	.vote-options {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.vote-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.78rem;
	}
	.vote-key {
		font-weight: 700;
		font-size: 0.7rem;
		opacity: 0.55;
		width: 0.9rem;
		text-align: center;
	}
	.vote-label { flex: 0 0 5.5rem; }
	.vote-bar-wrap {
		flex: 1;
		height: 4px;
		background: rgba(255,255,255,0.1);
		border-radius: 2px;
		overflow: hidden;
	}
	.vote-bar {
		height: 100%;
		background: rgba(147, 210, 255, 0.75);
		border-radius: 2px;
		transition: width 0.35s ease;
	}
	.vote-pct {
		font-size: 0.7rem;
		opacity: 0.6;
		width: 1.5rem;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.vote-result {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		text-align: center;
	}
	.vote-result-label {
		font-size: 1rem;
		font-weight: 700;
		text-transform: capitalize;
		letter-spacing: 0.05em;
	}
	.vote-result-desc {
		font-size: 0.75rem;
		opacity: 0.65;
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

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.55; }
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

	.info-btn {
		font-size: 0.7rem;
		font-weight: 700;
		width: 1.4rem;
		height: 1.4rem;
		border-radius: 50%;
		background: transparent;
		color: var(--secondary-color);
		opacity: 0.5;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: opacity 0.1s;
	}
	.info-btn:hover { opacity: 1; }

	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.55);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.info-modal {
		width: 100%;
		max-width: 480px;
		border-radius: 0.5rem;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.info-modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--secondary-color);
		opacity: 0.8;
	}

	.info-modal-body {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-height: 70vh;
		overflow-y: auto;
	}

	.info-section {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.info-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.45;
	}

	.info-list {
		font-size: 0.8rem;
		opacity: 0.75;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding-left: 1rem;
		list-style: disc;
		line-height: 1.5;
	}

	.info-warning {
		font-size: 0.75rem;
		color: #f59e0b;
		margin-top: 0.25rem;
	}

	.info-ok {
		font-size: 0.75rem;
		color: #4ade80;
		margin-top: 0.25rem;
	}
</style>
