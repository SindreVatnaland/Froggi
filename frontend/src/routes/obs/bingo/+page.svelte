<script lang="ts">
	import { bingoSession, bingoLobby, electronEmitter, currentPlayer, urls, remoteAccess, ngrokStatus, bingoRevertMessage, bingoVoteState, bingoVoteActionNotice, froggiSettings } from '$lib/utils/store.svelte';
	import { encryptUrl } from '$lib/utils/urlCrypto';
	import type { BingoVoteActionType } from '$lib/models/types/bingo';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { generateBoard } from '$lib/utils/bingoGenerator';
	import type { BingoSettings, BingoRole, BingoDifficulty, BingoWinCondition } from '$lib/models/types/bingo';
	import { tooltip } from 'svooltip';
	import BingoBoardGrid from '$lib/components/bingo/BingoBoardGrid.svelte';
	import ScoreProgressBar from '$lib/components/ScoreProgressBar.svelte';
	import OverlayRow from '$lib/components/OverlayRow.svelte';
	import NgrokShareRow from '$lib/components/NgrokShareRow.svelte';
	import SlippiAd from '$lib/components/SlippiAd.svelte';

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

	function voteActionLabel(action: BingoVoteActionType): string {
		if (action === 'freeze_tile') return 'freeze a tile ❄';
		if (action === 'swap_tiles') return 'swap two tiles ↔';
		return 'randomize a tile ✦';
	}

	// Dev role override: ?devRole=host or ?devRole=guest
	let devRole: BingoRole | null = null;

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

	function restart() {
		if (!$bingoSession) { stop(); return; }
		const board = generateBoard(settings);
		$electronEmitter.emit('BingoRestart', {
			board,
			settings,
			startedAt: Date.now(),
			localPlayerIndex: $currentPlayer?.playerIndex ?? null,
			role: $bingoSession.role,
			opponentConnected: $bingoSession.opponentConnected,
			localName: $currentPlayer?.displayName || 'Player 1',
			opponentName: $bingoSession.opponentName,
		});
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
	$: completedCount = board.tiles.filter((b) => b.completed).length;
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

	$: if (isActive && !hasWon) {
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
	$: shareCode = shareUrl ? encryptUrl(shareUrl, $froggiSettings?.version ?? 'froggi') : '';
	// QR code: Tailscale (own device, permanent) — never ngrok (temporary/shared)
	$: tailscaleBase = $remoteAccess?.tailscale ?? $urls?.external ?? '';
	$: qrOverlayUrl = tailscaleBase ? `${tailscaleBase.replace(/\/$/, '')}/obs/game-preview` : localOverlayUrl;



	onMount(async () => {
		const param = new URL(window.location.href).searchParams.get('devRole') as BingoRole | null;
		if (param === 'host' || param === 'guest' || param === 'solo') {
			devRole = param;
			// Popup windows don't receive IPC from main process — use WebSocket instead
			const { initWebSocket } = await import('$lib/utils/initEventListener.svelte');
			await initWebSocket();
		}
		const s = $ngrokStatus;
		if (s?.installed && s?.authenticated && !s?.running) {
			$electronEmitter.emit('NgrokStart');
		}
	});



	// Win state computed by backend, sent with every BingoState
	$: winState = session?.winState ?? null;
	$: localWinTiles = new Set<number>(winState?.localWinTileIndices ?? []);
	$: oppWinTiles = new Set<number>(winState?.oppWinTileIndices ?? []);
	$: hasWon = winState?.hasWon ?? false;
	$: localScore = winState?.localScore ?? 0;
	$: oppScore = winState?.oppScore ?? null;
	$: scoreTarget = winState?.scoreTarget ?? 1;
	$: scoreUnit = winState?.scoreUnit ?? 'lines';

	$: localPlayerName = session?.localName ?? 'You';
	$: opponentPlayerName = session?.opponentName ?? 'Opponent';

	// Dev popup perspective: when devRole=guest, flip everything to guest's POV
	$: effectiveRole = devRole ?? role;
	$: displayTiles = devRole === 'guest'
		? board.tiles.map(b => ({
			...b,
			completedBy: b.completedBy === 'local' ? 'opponent' as const
			           : b.completedBy === 'opponent' ? 'local' as const
			           : b.completedBy,
		  }))
		: board.tiles;
	$: localControlledLines = winState?.localControlledLines ?? [];
	$: oppControlledLines = winState?.oppControlledLines ?? [];

	$: displayLocalWinTiles = devRole === 'guest' ? oppWinTiles : localWinTiles;
	$: displayOppWinTiles = devRole === 'guest' ? localWinTiles : oppWinTiles;
	$: displayLocalControlledLines = devRole === 'guest' ? oppControlledLines : localControlledLines;
	$: displayOppControlledLines = devRole === 'guest' ? localControlledLines : oppControlledLines;
	$: displayLocalScore = devRole === 'guest' ? (oppScore ?? 0) : localScore;
	$: displayOppScore = devRole === 'guest' ? (role !== 'solo' ? localScore : null) : oppScore;
	$: displayLocalName = devRole === 'guest' ? opponentPlayerName : localPlayerName;
	$: displayOppName = devRole === 'guest' ? localPlayerName : opponentPlayerName;

	// Vote: show full options only when it's this player's turn
	$: voteIsForMe = !vote || vote.forRole === 'all' || vote.forRole === effectiveRole;

	// Win ad
	let showWinAd = false;
	let winAdTimer: ReturnType<typeof setTimeout> | null = null;
	$: if (hasWon && isActive && !showWinAd && !winAdTimer) {
		winAdTimer = setTimeout(() => { showWinAd = true; winAdTimer = null; }, 10000);
	} else if (!hasWon || !isActive) {
		if (winAdTimer) { clearTimeout(winAdTimer); winAdTimer = null; }
		showWinAd = false;
	}

</script>

<main class="background-primary-color text-secondary-color flex justify-center">
	<div class="w-full max-w-2xl flex flex-col gap-5" class:overlay-mode={!!devRole}>

		{#if !devRole}
		<!-- Header -->
		<div class="flex items-start justify-between gap-4 flex-wrap">
			<div>
				<div class="flex items-center gap-2">
					<h1 class="font-bold text-3xl">Bingo</h1>
					<button class="info-btn border-secondary" on:click={() => (showInfoModal = true)}>?</button>
				</div>
				{#if isActive}
					<p class="text-sm opacity-50 mt-1">
						{completedCount}/{board.tiles.length} · {board.difficulty} · {winConditionLabel(activeWinCondition)}
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
				<div class="flex gap-2">
					<button class="btn text-sm h-9 px-4 border-secondary rounded opacity-60" on:click={restart}>New Game</button>
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
				<p class="text-sm opacity-60">Enter your opponent's share code to join their bingo session.</p>
				<input
					class="url-input border-secondary background-primary-color text-secondary-color"
					placeholder="Paste share code or URL…"
					bind:value={guestUrl}
				/>
				{#if connecting}
					<p class="text-sm opacity-50">Connecting…</p>
				{/if}
			</div>
		{/if}

		<!-- Host: share code row -->
		{#if (isActive && role === 'host') || (!isActive && mode === 'host') || (inLobby && mode === 'host')}
			<NgrokShareRow shareUrl={shareCode} label="Share Code" copyLabel="Copy Code" />
		{/if}

		<!-- OBS / device overlay row -->
		{#if localOverlayUrl}
			<OverlayRow url={localOverlayUrl} qrUrl={qrOverlayUrl} title="Game Preview" obsWidth={800} obsHeight={1100} popupWidth={800} popupHeight={1100} />
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
		{/if}

		<!-- Board (hidden during lobby — no peeking before both are ready) -->
		{#if !inLobby}
		<div style="aspect-ratio:1/1; width:100%;">
			<BingoBoardGrid
				tiles={displayTiles}
				{size}
				role={effectiveRole}
				localWinTiles={displayLocalWinTiles}
				oppWinTiles={displayOppWinTiles}
				localControlledLines={displayLocalControlledLines}
				oppControlledLines={displayOppControlledLines}
				devMode={isActive}
				on:devsimulate={(e) => $electronEmitter.emit('BingoDevSimulate', e.detail.instanceId, e.detail.player)}
			/>
		</div>
		{#if isActive}
			<ScoreProgressBar
				localScore={displayLocalScore}
				localName={displayLocalName}
				oppScore={displayOppScore}
				oppName={displayOppName}
				target={scoreTarget}
				unit={scoreUnit}
				localWinner={devRole === 'guest' ? (winState?.oppWinner ?? false) : (winState?.localWinner ?? false)}
				oppWinner={devRole === 'guest' ? (winState?.localWinner ?? false) : (winState?.oppWinner ?? false)}
			/>
		{/if}
		{/if}

		<!-- ── Banners below board — no layout jump on board ── -->

		<!-- Dev controls (only when ?devRole= param is set) -->
		{#if devRole}
			<div class="dev-vote-controls border-secondary">
				<span class="settings-label">DEV · {devRole}</span>
				<button class="pill" on:click={() => $electronEmitter.emit('BingoDevStartVote')}>Start Vote</button>
				<button class="pill" on:click={() => $electronEmitter.emit('BingoDevResolveVote', 'randomize_opponent_tile')}>Randomize</button>
				<button class="pill" on:click={() => $electronEmitter.emit('BingoDevResolveVote', 'freeze_tile')}>Freeze</button>
				<button class="pill" on:click={() => $electronEmitter.emit('BingoDevResolveVote', 'swap_tiles')}>Swap</button>
			</div>
		{/if}

		<!-- Twitch vote banner -->
		{#if vote && voteActive}
			{#if voteIsForMe}
				<div class="vote-banner border-secondary" class:vote-banner--special={vote.special} in:fly={{ y: 16, duration: 320 }} out:fly={{ y: 16, duration: 220 }}>
					<div class="vote-header">
						<span class="vote-title">{vote.question ?? (vote.forRole === 'all' ? 'Chat Vote' : (vote.forRole === 'host' ? 'Host chat' : 'Guest chat'))}</span>
						<span class="vote-timer">{voteSecondsLeft}s</span>
					</div>
					<div class="vote-options">
						{#each vote.options as opt, i}
							{@const total = vote.options.reduce((s, o) => s + o.votes, 0)}
							{@const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0}
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
				</div>
			{:else}
				<div class="vote-thinking border-secondary" in:fly={{ y: 16, duration: 320 }} out:fly={{ y: 16, duration: 220 }}>
					<span class="vote-thinking-label">{vote.forRole === 'host' ? 'Host' : 'Opponent'} chat is deciding</span>
					<div class="thinking-dots">
						<span class="dot"></span><span class="dot"></span><span class="dot"></span>
					</div>
				</div>
			{/if}
		{/if}
		{#if vote && voteResult && vote.result}
			<div class="vote-banner vote-banner--result border-secondary" class:vote-banner--special={vote.special} in:fly={{ y: 16, duration: 320 }} out:fly={{ y: 16, duration: 220 }}>
				<div class="vote-result">
					<span class="vote-result-label">{vote.result.winner.replace(/_/g, ' ')}</span>
					<span class="vote-result-desc">{vote.result.description}</span>
				</div>
			</div>
		{/if}

		<!-- Vote action notification -->
		{#if $bingoVoteActionNotice}
			<div
				class="vote-action-banner vote-action-banner--{$bingoVoteActionNotice.action}"
				in:fly={{ y: 16, duration: 250 }}
				out:fly={{ y: 16, duration: 200 }}
			>
				{$bingoVoteActionNotice.channel} chat voted to {voteActionLabel($bingoVoteActionNotice.action)}
			</div>
		{/if}

		<!-- Revert notification -->
		{#if $bingoRevertMessage}
			<div class="revert-banner" in:fly={{ y: 16, duration: 250 }} out:fly={{ y: 16, duration: 200 }}>
				⚠ {$bingoRevertMessage}
			</div>
		{/if}

		<!-- Win banner -->
		{#if hasWon}
			<div class="win-banner border-secondary">
				<span>Bingo!</span>
				{#if effectiveRole !== 'solo'}
					<span class="win-score">{displayLocalName} {displayLocalScore} – {displayOppScore} {displayOppName}</span>
				{:else}
					<span class="win-score">{displayLocalScore}/{scoreTarget} {scoreUnit}</span>
				{/if}
			</div>
			{#if showWinAd}
				<div class="dash-card border-secondary" in:fly={{ y: 16, duration: 400 }}>
					<SlippiAd compact />
				</div>
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

	/* ── Overlay mode (dev popups) ── */
	.overlay-mode {
		padding-top: 0.75rem;
	}

	/* ── Vote thinking (opponent's turn) ── */
	.vote-thinking {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.55rem 0.9rem;
		border-radius: 0.375rem;
	}
	.vote-thinking-label {
		font-size: 0.78rem;
		opacity: 0.65;
	}
	.thinking-dots {
		display: flex;
		gap: 0.25rem;
		align-items: center;
	}
	.dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--secondary-color);
		opacity: 0.5;
		animation: dot-pulse 1.2s ease-in-out infinite;
	}
	.dot:nth-child(2) { animation-delay: 0.2s; }
	.dot:nth-child(3) { animation-delay: 0.4s; }
	@keyframes dot-pulse {
		0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
		40%            { opacity: 0.85; transform: scale(1.15); }
	}

	.vote-teaser {
		border-radius: 0.375rem;
		padding: 0.55rem 0.9rem;
		font-size: 0.85rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.2em;
	}
	.vote-teaser-channel { opacity: 1; }
	.vote-teaser-text {
		opacity: 0.6;
		font-weight: 400;
	}
	.vote-teaser-word {
		font-style: italic;
		opacity: 0.9;
		font-weight: 600;
	}
	.vote-teaser-cursor {
		opacity: 0.7;
		animation: blink-cursor 0.9s step-end infinite;
		font-weight: 300;
	}
	@keyframes blink-cursor {
		0%, 100% { opacity: 0.7; }
		50%       { opacity: 0; }
	}

	.vote-banner--special {
		border-color: var(--secondary-color) !important;
		box-shadow: 0 0 8px 1px color-mix(in srgb, var(--secondary-color) 30%, transparent);
	}
	.vote-banner--special .vote-title {
		color: var(--secondary-color);
		opacity: 0.85;
	}

	.dev-vote-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		padding: 0.5rem 0.8rem;
		border-radius: 0.375rem;
		background: rgba(255, 200, 0, 0.06);
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

	.vote-action-banner {
		color: #fff;
		font-weight: 700;
		font-size: 0.9rem;
		padding: 0.6rem 1rem;
		border-radius: 0.375rem;
		text-align: center;
	}
	.vote-action-banner--freeze_tile {
		background: rgba(56, 150, 220, 0.92);
		animation: vote-action-freeze 0.6s ease-out both;
	}
	.vote-action-banner--swap_tiles {
		background: rgba(120, 70, 200, 0.92);
		animation: vote-action-swap 0.7s ease-in-out both;
	}
	.vote-action-banner--randomize_opponent_tile {
		background: rgba(200, 130, 20, 0.92);
		animation: vote-action-randomize 0.5s ease-out both;
	}

	@keyframes vote-action-freeze {
		0%   { opacity: 0; transform: translateY(-10px) scaleX(0.92); filter: brightness(1.6); }
		60%  { filter: brightness(1); }
		100% { opacity: 1; transform: translateY(0) scaleX(1); filter: brightness(1); }
	}
	@keyframes vote-action-swap {
		0%   { opacity: 0; transform: translateX(-8px); }
		35%  { transform: translateX(8px); }
		65%  { transform: translateX(-4px); }
		100% { opacity: 1; transform: translateX(0); }
	}
	@keyframes vote-action-randomize {
		0%   { opacity: 0; transform: scale(0.9); }
		60%  { transform: scale(1.04); }
		100% { opacity: 1; transform: scale(1); }
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
