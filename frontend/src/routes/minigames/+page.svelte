<script lang="ts">
	import {
		bingoSession, bingoLobby, electronEmitter, currentPlayer,
		urls, remoteAccess, ngrokStatus, bingoRevertMessage, bingoLeaderboard,
		ironManSession, ironManLobby, ironManLeaderboard, ironManCurrentChar,
		froggiSettings, twitchUsername, bingoVoteState,
	} from '$lib/utils/store.svelte';
	import { encryptUrl, decryptUrl, isEncryptedHash } from '$lib/utils/urlCrypto';
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { generateBoard } from '$lib/utils/bingoGenerator';
	import { countLines, countControlledLines, hasWon as bingoHasWon, scoreTarget as bingoScoreTarget } from '$lib/utils/bingoWinCondition';
	import type { BingoSettings, BingoBox, BingoRole, BingoDifficulty, BingoWinCondition } from '$lib/models/types/bingo';
	import type { IronManSettings, IronManRoster, IronManCharSelection, IronManRandomSync } from '$lib/models/types/ironman';
	import { IRONMAN_CHARS, IRONMAN_CHAR_NAMES, IRONMAN_CHAR_FALLBACK } from '$lib/models/types/ironman';
	import { tooltip } from 'svooltip';
	import BingoBoardGrid from '$lib/components/bingo/BingoBoardGrid.svelte';
	import IronManRosterGrid from '$lib/components/ironman/IronManRosterGrid.svelte';
	import ScoreProgressBar from '$lib/components/ScoreProgressBar.svelte';
	import SlippiAd from '$lib/components/SlippiAd.svelte';
	import OverlayRow from '$lib/components/OverlayRow.svelte';
	import NgrokShareRow from '$lib/components/NgrokShareRow.svelte';

	type Game = 'bingo' | 'ironman';
	type Mode = 'solo' | 'host' | 'guest';

	let selectedGame: Game | null = null;

	function selectGame(game: Game) {
		selectedGame = game;
	}

	// Unified join flow
	let joinHash = '';
	let joinConnecting = false;
	let joinError = '';

	async function joinGame() {
		if (!joinHash.trim()) return;
		joinConnecting = true;
		joinError = '';
		const raw = joinHash.trim();
		const version = $froggiSettings?.version ?? 'froggi';
		let baseUrl: string;
		try {
			baseUrl = isEncryptedHash(raw) ? decryptUrl(raw, version) : raw;
			baseUrl = baseUrl.replace(/\/$/, '');
			console.log('[Froggi] Join decrypt — input:', raw, '→ url:', baseUrl);
			const res = await fetch(baseUrl + '/lobby-info', {
				headers: { 'ngrok-skip-browser-warning': 'true' },
			});
			if (!res.ok) throw new Error(`lobby-info ${res.status}`);
			const { game } = await res.json() as { game: 'bingo' | 'ironman' | null };
			console.log('[Froggi] Join lobby-info response:', { game });
			if (game === 'bingo') {
				selectGame('bingo');
				mode = 'guest';
				guestUrl = baseUrl;
				joinAsGuest();
			} else if (game === 'ironman') {
				selectGame('ironman');
				imMode = 'guest';
				imGuestUrl = baseUrl;
				imJoinGuest();
			} else {
				joinError = 'No active lobby found. Make sure the host has opened a lobby.';
			}
		} catch (err) {
			console.warn('[Froggi] Join failed:', err, '— decoded url:', baseUrl!);
			joinError = 'Could not connect — check the share code. If the host is on a different Froggi version, both players may need to update.';
		}
		joinConnecting = false;
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
		twitchEnabled: false,
		twitchChannel: '',
	};

	let previewBoard = generateBoard(settings);
	let _boardHash = `${settings.boardSize}|${settings.difficulty}|${settings.winCondition}|${JSON.stringify(settings.lines)}`;
	$: {
		const h = `${settings.boardSize}|${settings.difficulty}|${settings.winCondition}|${JSON.stringify(settings.lines)}`;
		if (h !== _boardHash) { _boardHash = h; previewBoard = generateBoard(settings); }
	}

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

	$: localOverlayUrl = $urls?.local ? `${$urls.local.replace(/\/$/, '')}/obs/game-preview` : '';
	$: shareUrl = $remoteAccess?.ngrok ?? '';
	$: tailscaleBase = $remoteAccess?.tailscale ?? $urls?.external ?? '';
	$: qrOverlayUrl = tailscaleBase ? `${tailscaleBase.replace(/\/$/, '')}/obs/game-preview` : localOverlayUrl;

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
	let showImLeaderboard = false;

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
		$electronEmitter.emit('GetIronManLeaderboard');
		$electronEmitter.emit('GetTwitchUsername');
	});

	// Keep settings in sync with saved Twitch username (only pre-fill, don't re-verify here)
	$: if ($twitchUsername && !settings.twitchChannel) {
		settings = { ...settings, twitchChannel: $twitchUsername };
		twitchChannelStatus = 'idle';
	}

	function saveTwitchChannel(channel: string) {
		$electronEmitter.emit('SaveTwitchUsername', channel);
	}

	let twitchChannelStatus: 'idle' | 'checking' | 'valid' | 'invalid' = 'idle';
	let _twitchVerifyTimer: ReturnType<typeof setTimeout> | null = null;

	function onTwitchChannelInput() {
		twitchChannelStatus = 'idle';
		if (_twitchVerifyTimer) clearTimeout(_twitchVerifyTimer);
		const val = settings.twitchChannel.trim();
		if (!val) return;
		_twitchVerifyTimer = setTimeout(() => verifyTwitchChannel(val), 600);
	}

	async function verifyTwitchChannel(channel: string) {
		if (!channel) { twitchChannelStatus = 'idle'; return; }
		twitchChannelStatus = 'checking';
		try {
			const res = await fetch('https://gql.twitch.tv/gql', {
				method: 'POST',
				headers: { 'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko', 'Content-Type': 'application/json' },
				body: JSON.stringify([{ query: `{ user(login: "${channel}") { id } }` }]),
			});
			const data = await res.json();
			const exists = data?.[0]?.data?.user != null;
			twitchChannelStatus = exists ? 'valid' : 'invalid';
			if (exists) saveTwitchChannel(channel);
		} catch {
			twitchChannelStatus = 'idle';
		}
	}


	function getRowControlBoxes(boxes: BingoBox[], sz: number, player: 'local' | 'opponent'): Set<number> {
		const mine = (b: BingoBox) => player === 'local' ? (b.completedBy === 'local' || b.completedBy === 'both') : (b.completedBy === 'opponent' || b.completedBy === 'both');
		const required = Math.floor(sz / 2) + 1;
		const controlled = new Set<number>();
		const check = (line: number[]) => { if (line.filter(i => mine(boxes[i])).length >= required) line.forEach(i => controlled.add(i)); };
		for (let r = 0; r < sz; r++) check(Array.from({ length: sz }, (_, c) => r * sz + c));
		for (let c = 0; c < sz; c++) check(Array.from({ length: sz }, (_, r) => r * sz + c));
		check(Array.from({ length: sz }, (_, i) => i * sz + i));
		check(Array.from({ length: sz }, (_, i) => i * sz + (sz - 1 - i)));
		return controlled;
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

	$: hasWon = bingoHasWon(board.boxes, size, activeWinCondition);

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

	$: scoreTarget = bingoScoreTarget(board.boxes, size, activeWinCondition);

	$: scoreUnit = activeWinCondition === 'lockout' || activeWinCondition === 'full' ? 'tiles' : 'lines';

	$: localPlayerName = session?.localName ?? 'You';
	$: opponentPlayerName = session?.opponentName ?? 'Opponent';

	// ── Iron Man ──────────────────────────────────────────────────────────────

	const defaultIronManSettings: IronManSettings = {
		variant: 'standard',
		rosterSize: 7,
		hideOpponent: false,
		stocksPerChar: 4,
		charOrder: 'fixed',
		charSelection: 'pick',
		randomSync: 'shared',
	};
	let imSettings = { ...defaultIronManSettings };
	const imVariants: { value: IronManSettings['variant']; label: string; tip: string }[] = [
		{ value: 'standard', label: 'Standard', tip: 'Lose a game → that character is depleted.\nLast player with characters remaining wins.' },
		{ value: 'full_roster', label: 'Full Roster', tip: 'Win with each character to complete it.\nFirst to finish your entire roster wins.' },
		{ value: 'challenge', label: 'Challenge', tip: 'Solo: beat every character without a single loss.\nAny loss resets all progress. Fastest time recorded.' },
	];
	const imOrderOptions: { value: IronManSettings['charOrder']; label: string; tip: string }[] = [
		{ value: 'free', label: 'Free', tip: 'Play any remaining character each game.\nThe active character updates when a game starts.' },
		{ value: 'fixed', label: 'Fixed', tip: 'Play in the exact order you set.\nThe next character is shown before each game.' },
		{ value: 'random', label: 'Random', tip: 'Order is randomised when you start.\nThe next character is shown before each game.' },
	];
	const imCharSelections: { value: IronManCharSelection; label: string; tip: string }[] = [
		{ value: 'pick', label: 'Pick', tip: 'Choose your characters manually before starting' },
		{ value: 'random', label: 'Random', tip: 'Characters are selected randomly when the game starts' },
	];
	const imRandomSyncOptions: { value: IronManRandomSync; label: string; tip: string }[] = [
		{ value: 'shared', label: 'Shared', tip: 'Both players receive the same randomly-selected roster' },
		{ value: 'independent', label: 'Independent', tip: 'Each player gets their own random roster' },
	];
	const imRosterSizes = [5, 7, 11, 15, 25, 26] as const;
	// Melee CSS rows: row1=9, row2=10, row3=7
	const imCharRows: [number, number][] = [[0, 9], [9, 19], [19, 26]];
	let imMode: Mode = 'solo';
	const imModes: { value: Mode; label: string }[] = [
		{ value: 'solo', label: 'Solo' },
		{ value: 'host', label: 'Host' },
	];
	let imSelectedChars: number[] = [];
	let imGuestUrl = '';
	let imConnecting = false;

	// Auto-select all when size 26
	$: if (imSettings.rosterSize === 26 && imSelectedChars.length !== IRONMAN_CHARS.length) {
		imSelectedChars = [...IRONMAN_CHARS];
	}

	// Drag-to-reorder
	let imDragFrom: number | null = null;
	function imDragStart(i: number) { imDragFrom = i; }
	function imDragOver(e: DragEvent) { e.preventDefault(); }
	function imDrop(i: number) {
		if (imDragFrom === null || imDragFrom === i) return;
		const arr = [...imSelectedChars];
		const [moved] = arr.splice(imDragFrom, 1);
		arr.splice(i, 0, moved);
		imSelectedChars = arr;
		imDragFrom = null;
	}
	function imDragEnd() { imDragFrom = null; }

	$: imPreviewNextCharId = (imSettings.charOrder === 'fixed' || imSettings.charOrder === 'random') && imSelectedChars.length > 0
		? imSelectedChars[0]
		: null;

	$: imSession = $ironManSession;
	$: imIsActive = !!imSession;
	$: imInLobby = !!$ironManLobby && !imSession;
	$: imLocalRoster = imSession?.localRoster ?? null;
	$: imOpponentRoster = imSession?.opponentRoster ?? null;
	$: imWinner = imSession?.winner ?? null;
	$: imRole = imSession?.role ?? 'solo';
	$: imLocalName = imSession?.localName ?? 'You';
	$: imOpponentName = imSession?.opponentName ?? 'Opponent';
	$: imPendingCarry = imSession?.pendingCarryStocks ?? null;
	$: imCanStart = imSettings.charSelection === 'random' || imSettings.rosterSize === 26 || imSelectedChars.length === imSettings.rosterSize;
	$: imIsSharedRandom = imSettings.charSelection === 'random' && imSettings.randomSync === 'shared';

	$: imLocalProgress = (() => {
		if (!imLocalRoster) return { score: 0, target: 0 };
		const slots = imLocalRoster.slots;
		if (imSettings.variant === 'standard') {
			return { score: slots.filter(s => !s.depleted).length, target: slots.length };
		}
		return { score: slots.filter(s => s.completed).length, target: slots.length };
	})();

	$: imOppProgress = (() => {
		if (!imOpponentRoster || imRole === 'solo') return null;
		const slots = imOpponentRoster.slots;
		if (imSettings.variant === 'standard') {
			return { score: slots.filter(s => !s.depleted).length, target: slots.length };
		}
		return { score: slots.filter(s => s.completed).length, target: slots.length };
	})();

	$: imProgressUnit = imSettings.variant === 'standard' ? 'alive' : 'completed';

	$: if ($ironManLobby) imConnecting = false;
	$: if ($ironManSession?.role === 'guest') imConnecting = false;
	$: if (!$ironManSession && !$ironManLobby) imConnecting = false;

	$: if (imIsActive && !selectedGame) { selectedGame = 'ironman'; }
	$: if (imInLobby && !selectedGame) { selectedGame = 'ironman'; }

	let imTimerSeconds = 0;
	let imTimerInterval: ReturnType<typeof setInterval> | null = null;
	$: if (imIsActive && !imTimerInterval) {
		imTimerSeconds = 0;
		imTimerInterval = setInterval(() => imTimerSeconds++, 1000);
	}
	$: if (!imIsActive && imTimerInterval) {
		clearInterval(imTimerInterval);
		imTimerInterval = null;
		imTimerSeconds = 0;
	}

	function imBuildRoster(charIds: number[]): IronManRoster {
		let slots = charIds.map(id => ({
			characterId: id,
			depleted: false,
			completed: false,
			stocksRemaining: imSettings.stocksPerChar,
		}));
		if (imSettings.charOrder === 'random') {
			for (let i = slots.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[slots[i], slots[j]] = [slots[j], slots[i]];
			}
		}
		return { slots, currentIndex: 0 };
	}

	function imToggleChar(id: number) {
		if (imSettings.rosterSize === 26) return;
		if (imSelectedChars.includes(id)) {
			imSelectedChars = imSelectedChars.filter(c => c !== id);
		} else if (imSelectedChars.length < imSettings.rosterSize) {
			imSelectedChars = [...imSelectedChars, id];
		}
	}

	function imStart(role: 'solo' | 'host' | 'guest') {
		let chars: number[];
		if (imSettings.rosterSize === 26) {
			chars = [...IRONMAN_CHARS];
		} else if (imSettings.charSelection === 'random') {
			const all = [...IRONMAN_CHARS] as number[];
			for (let i = all.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[all[i], all[j]] = [all[j], all[i]];
			}
			chars = all.slice(0, imSettings.rosterSize);
		} else {
			chars = imSelectedChars.slice(0, imSettings.rosterSize);
		}
		if (chars.length < 1) return;
		const localRoster = imBuildRoster(chars);
		$electronEmitter.emit('StartIronMan', {
			settings: imSettings,
			localRoster,
			opponentRoster: null,
			role,
			localName: $currentPlayer?.displayName || 'Player',
			opponentName: role === 'host' ? ($ironManLobby?.opponentName ?? null) : ($ironManLobby?.opponentName ?? null),
			localPlayerIndex: $currentPlayer?.playerIndex ?? null,
			opponentConnected: role === 'host' ? ($ironManLobby?.opponentConnected ?? false) : (role === 'guest'),
			startedAt: Date.now(),
			winner: null,
			pendingCarryStocks: null,
		});
	}

	function imHostLobby() {
		$electronEmitter.emit('IronManStartLobby', imSettings);
	}

	function imJoinGuest() {
		if (!imGuestUrl.trim()) return;
		imConnecting = true;
		$electronEmitter.emit('IronManPeerConnect', imGuestUrl.trim());
	}

	function imStop() {
		imConnecting = false;
		$electronEmitter.emit('StopIronMan');
		selectedGame = null;
		
	}

	function imVariantLabel(v: IronManSettings['variant']): string {
		if (v === 'standard') return 'Standard';
		if (v === 'full_roster') return 'Full Roster';
		return 'Challenge';
	}

	// Bingo lobby: host syncs settings to guest; guest mirrors host's settings
	$: if (inLobby && mode === 'host') $electronEmitter.emit('BingoUpdateLobbySettings', settings);
	$: if (mode === 'guest' && $bingoLobby?.settings) settings = $bingoLobby.settings;

	// Iron Man lobby: host syncs settings to guest; guest mirrors host's settings
	$: if (imInLobby && imMode === 'host') $electronEmitter.emit('IronManUpdateLobbySettings', imSettings);
	$: if (imMode === 'guest' && $ironManLobby?.settings) imSettings = $ironManLobby.settings;

	$: imLocalOverlayUrl = $urls?.local
		? $urls.local.replace(/\/$/, '') + '/obs/game-preview'
		: '';
	$: imQrOverlayUrl = tailscaleBase
		? tailscaleBase.replace(/\/$/, '') + '/obs/game-preview'
		: imLocalOverlayUrl;
	$: shareCode = (() => {
		if (!shareUrl) return '';
		const version = $froggiSettings?.version ?? 'froggi';
		return encryptUrl(shareUrl, version);
	})();
	$: localUrlForCopy = $urls?.local?.replace(/\/$/, '') ?? '';
</script>

<main class="background-primary-color text-secondary-color flex justify-center">
	<div class="w-full max-w-2xl flex flex-col gap-5">

		<!-- Header -->
		<div class="flex items-start justify-between gap-4 flex-wrap">
			<div>
				<div class="flex items-center gap-2">
					{#if selectedGame && !isActive && !imIsActive}
						<button class="back-btn" on:click={() => { selectedGame = null;  }}>Change Game</button>
					{/if}
					<h1 class="font-bold text-3xl">
						{#if selectedGame === 'bingo'}Bingo{:else if selectedGame === 'ironman'}Iron Man{:else}Minigames{/if}
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
			{:else if selectedGame === 'ironman'}
				<div class="flex gap-2">
					{#if imIsActive}
						<button class="btn text-sm h-9 px-4 border-secondary rounded" on:click={imStop}>End</button>
					{:else if imInLobby}
						{#if $ironManLobby?.opponentConnected && imMode !== 'guest'}
							<button class="btn text-sm h-9 px-4 border-secondary rounded disabled:opacity-40" disabled={!imCanStart} on:click={() => imStart('host')}>Start Iron Man</button>
						{:else if imMode === 'guest' && !imIsSharedRandom}
							<button class="btn text-sm h-9 px-4 border-secondary rounded disabled:opacity-40" disabled={!imCanStart} on:click={() => imStart('guest')}>Start Guest</button>
						{/if}
						<button class="btn text-sm h-9 px-4 border-secondary rounded opacity-50" on:click={imStop}>Cancel</button>
					{:else if imMode === 'solo'}
						<button class="btn text-sm h-9 px-4 border-secondary rounded disabled:opacity-40" disabled={!imCanStart} on:click={() => imStart('solo')}>Start Solo</button>
					{:else if imMode === 'host'}
						<button class="btn text-sm h-9 px-4 border-secondary rounded" on:click={imHostLobby}>Open Lobby</button>
					{/if}
					{#if imMode === 'solo'}
						<button class="btn text-sm h-9 px-4 border-secondary rounded opacity-60" on:click={() => (showImLeaderboard = true)}>Best Times</button>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Game selector (inline, no modal) -->
		{#if !selectedGame}
			<div class="game-grid">
				<button class="game-card border-secondary" on:click={() => selectGame('bingo')}>
					<span class="game-card-title">Bingo</span>
					<span class="game-card-desc">Complete challenges in unranked play and race to be the first to get a bingo.</span>
				</button>
				<div class="game-card game-card--soon border-secondary">
					<span class="game-card-title">Races</span>
					<span class="game-card-badge">Coming soon</span>
				</div>
				<button class="game-card border-secondary" on:click={() => selectGame('ironman')}>
					<span class="game-card-title">Iron Man</span>
					<span class="game-card-desc">Play through a roster of characters — standard crew battle or race to complete all.</span>
				</button>
			</div>
			<div class="join-section border-secondary">
				<p class="selector-subtitle">Join a game</p>
				<div class="join-row">
					<input
						class="url-input border-secondary background-primary-color text-secondary-color join-input"
						placeholder="Paste share code or URL…"
						bind:value={joinHash}
						on:keydown={(e) => e.key === 'Enter' && joinGame()}
					/>
					<button class="btn text-sm h-9 px-4 border-secondary rounded" disabled={joinConnecting || !joinHash.trim()} on:click={joinGame}>
						{joinConnecting ? 'Joining…' : 'Join'}
					</button>
				</div>
				{#if joinError}
					<p class="join-error">{joinError}</p>
				{/if}
			</div>
		{/if}

		<!-- Bingo: settings (idle + lobby for both host and guest) -->
		{#if selectedGame === 'bingo' && !isActive && (mode !== 'guest' || inLobby)}
			<div class="settings-row border-secondary" class:settings-row--readonly={mode === 'guest' && inLobby}>
				{#if !(mode === 'guest' && inLobby)}
				<div class="settings-group">
					<span class="settings-label">Mode</span>
					<div class="pill-group">
						{#each modes as { value: m, label }}
							<button class="pill" class:pill--active={mode === m} on:click={() => (mode = m)}>{label}</button>
						{/each}
					</div>
				</div>
				{/if}
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
								use:tooltip={{ content: wc.tip, placement: 'bottom', delay: [400, 0] }}
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
				{#if !(mode === 'guest' && inLobby)}
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
				{/if}
				{#if mode === 'host' && !(mode === 'guest' && inLobby)}
				<div class="settings-group twitch-group">
					<span class="settings-label">Twitch</span>
					<div class="pill-group">
						<button class="pill" class:pill--active={!settings.twitchEnabled}
							on:click={() => { settings = { ...settings, twitchEnabled: false }; twitchChannelStatus = 'idle'; }}>Off</button>
						<button class="pill" class:pill--active={settings.twitchEnabled}
							on:click={() => { settings = { ...settings, twitchEnabled: true }; if (settings.twitchChannel) verifyTwitchChannel(settings.twitchChannel); }}>On</button>
					</div>
					{#if settings.twitchEnabled}
						<input
							class="twitch-input border-secondary background-primary-color text-secondary-color"
							class:twitch-input--valid={twitchChannelStatus === 'valid'}
							class:twitch-input--invalid={twitchChannelStatus === 'invalid'}
							placeholder="channel name"
							bind:value={settings.twitchChannel}
							on:input={onTwitchChannelInput}
						/>
						{#if twitchChannelStatus === 'checking'}
							<span class="twitch-verify-icon twitch-verify--spin">⟳</span>
						{:else if twitchChannelStatus === 'valid'}
							<span class="twitch-verify-icon twitch-verify--ok">✓</span>
						{:else if twitchChannelStatus === 'invalid'}
							<span class="twitch-verify-icon twitch-verify--err">✗</span>
						{/if}
					{/if}
				</div>
				{/if}
			</div>
		{/if}

		<!-- Bingo: lobby status -->
		{#if selectedGame === 'bingo' && inLobby}
			<div class="settings-row border-secondary flex-col gap-2">
				<div class="flex items-center gap-3">
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
				{#if settings.twitchEnabled && $bingoLobby?.opponentConnected}
					<div class="twitch-status-row">
						<span class="settings-label">Twitch</span>
						<span class="twitch-status-pill" class:twitch-status-pill--ok={!!$bingoLobby.localTwitchUsername}>
							{mode === 'host' ? 'You' : 'Guest'}: {$bingoLobby.localTwitchUsername ? `@${$bingoLobby.localTwitchUsername}` : '—'}
						</span>
						<span class="twitch-status-pill" class:twitch-status-pill--ok={!!$bingoLobby.opponentTwitchUsername}>
							{mode === 'host' ? 'Guest' : 'Host'}: {$bingoLobby.opponentTwitchUsername ? `@${$bingoLobby.opponentTwitchUsername}` : '—'}
						</span>
						{#if !$bingoLobby.localTwitchUsername || !$bingoLobby.opponentTwitchUsername}
							<span class="text-xs" style="opacity:0.45">Polls require both players to set a username</span>
						{:else}
							<span class="text-xs" style="color:#4ade80;opacity:0.8">✓ Twitch polls ready</span>
						{/if}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Bingo: host share code -->
		{#if selectedGame === 'bingo' && ((isActive && role === 'host') || (!isActive && mode === 'host') || (inLobby && mode === 'host'))}
			<NgrokShareRow shareUrl={shareCode} label="Share Code" copyLabel="Copy Code" />
		{/if}

		<!-- Bingo: OBS / device overlay row -->
		{#if selectedGame === 'bingo' && localOverlayUrl}
			<OverlayRow url={localOverlayUrl} qrUrl={qrOverlayUrl} title="Game Preview" />
		{/if}

		<!-- Bingo: guest waiting — OBS options + localhost URL -->
		{#if selectedGame === 'bingo' && inLobby && mode === 'guest' && localOverlayUrl}
			<OverlayRow url={localOverlayUrl} qrUrl={qrOverlayUrl} title="Game Preview" />
			{#if localUrlForCopy}
				<div class="local-url-row border-secondary">
					<span class="settings-label">Localhost URL</span>
					<span class="local-url-text">{localUrlForCopy}</span>
					<button class="btn text-xs h-7 px-3 border-secondary rounded" on:click={() => navigator.clipboard.writeText(localUrlForCopy)}>Copy</button>
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

		<!-- ── Iron Man sections ──────────────────────────────────────────── -->

		<!-- Iron Man: header extras -->
		{#if selectedGame === 'ironman' && imIsActive}
			<p class="text-sm opacity-50 -mt-4">
				{imVariantLabel(imSettings.variant)} · {imLocalRoster?.slots.length ?? 0} chars · ⏱ {formatTimer(imTimerSeconds)}
			</p>
		{/if}

		<!-- Iron Man: settings strip (always visible when not active) -->
		{#if selectedGame === 'ironman' && !imIsActive}
			<div class="settings-row border-secondary" class:settings-row--readonly={imMode === 'guest' && imInLobby}>
				<div class="settings-group">
					<span class="settings-label">Mode</span>
					<div class="pill-group">
						{#each imModes as m}
							<button class="pill" class:pill--active={imMode === m.value} on:click={() => imMode = m.value}>{m.label}</button>
						{/each}
					</div>
				</div>
				{#if imMode !== 'guest' || imInLobby}
					<div class="settings-group">
						<span class="settings-label">Variant</span>
						<div class="pill-group">
							{#each imVariants as { value, label, tip }}
								<button
									class="pill"
									class:pill--active={imSettings.variant === value}
									on:click={() => imSettings = { ...imSettings, variant: value }}
									use:tooltip={{ content: tip, placement: 'bottom', delay: [400, 0], allowHTML: false }}
								>{label}</button>
							{/each}
						</div>
					</div>
					<div class="settings-group">
						<span class="settings-label">Size</span>
						<div class="pill-group">
							{#each imRosterSizes as size}
								<button
									class="pill"
									class:pill--active={imSettings.rosterSize === size}
									on:click={() => {
										imSettings = { ...imSettings, rosterSize: size };
										if (size < 26) imSelectedChars = imSelectedChars.slice(0, size);
									}}
								>{size === 26 ? 'All' : size}</button>
							{/each}
						</div>
					</div>
					<div class="settings-group">
						<span class="settings-label">Order</span>
						<div class="pill-group">
							{#each imOrderOptions as { value, label, tip }}
								<button
									class="pill"
									class:pill--active={imSettings.charOrder === value}
									on:click={() => imSettings = { ...imSettings, charOrder: value }}
									use:tooltip={{ content: tip, placement: 'bottom', delay: [400, 0], allowHTML: false }}
								>{label}</button>
							{/each}
						</div>
					</div>
					<div class="settings-group">
						<span class="settings-label">Characters</span>
						<div class="pill-group">
							{#each imCharSelections as { value, label, tip }}
								<button
									class="pill"
									class:pill--active={imSettings.charSelection === value}
									on:click={() => imSettings = { ...imSettings, charSelection: value }}
									use:tooltip={{ content: tip, placement: 'bottom', delay: [400, 0] }}
								>{label}</button>
							{/each}
						</div>
					</div>
					{#if imSettings.charSelection === 'random' && imMode !== 'solo'}
						<div class="settings-group">
							<span class="settings-label">Sync</span>
							<div class="pill-group">
								{#each imRandomSyncOptions as { value, label, tip }}
									<button
										class="pill"
										class:pill--active={imSettings.randomSync === value}
										on:click={() => imSettings = { ...imSettings, randomSync: value }}
										use:tooltip={{ content: tip, placement: 'bottom', delay: [400, 0] }}
									>{label}</button>
								{/each}
							</div>
						</div>
					{/if}
					{#if imMode !== 'solo'}
						<div class="settings-group">
							<span class="settings-label">Hide characters</span>
							<div class="pill-group">
								<button class="pill" class:pill--active={!imSettings.hideOpponent}
									on:click={() => imSettings = { ...imSettings, hideOpponent: false }}
									use:tooltip={{ content: "Opponent's characters are always visible", placement: 'bottom', delay: [400, 0] }}>Off</button>
								<button class="pill" class:pill--active={imSettings.hideOpponent}
									on:click={() => imSettings = { ...imSettings, hideOpponent: true }}
									use:tooltip={{ content: "Opponent's characters are hidden until a game starts", placement: 'bottom', delay: [400, 0] }}>On</button>
							</div>
						</div>
					{/if}
				{/if}
			</div>
		{/if}

		<!-- Iron Man: host share code (before char picker) -->
		{#if selectedGame === 'ironman' && (imMode === 'host' || imInLobby) && !imIsActive}
			<NgrokShareRow shareUrl={shareCode} label="Share Code" copyLabel="Copy Code" />
		{/if}

		<!-- Iron Man: OBS / device overlay — under rules -->
		{#if selectedGame === 'ironman' && imLocalOverlayUrl && imMode !== 'guest'}
			<OverlayRow url={imLocalOverlayUrl} qrUrl={imQrOverlayUrl} title="Game Preview" />
		{/if}

		<!-- Iron Man: guest waiting — OBS options + localhost URL -->
		{#if selectedGame === 'ironman' && imInLobby && imMode === 'guest' && imLocalOverlayUrl}
			<OverlayRow url={imLocalOverlayUrl} qrUrl={imQrOverlayUrl} title="Game Preview" />
			{#if localUrlForCopy}
				<div class="local-url-row border-secondary">
					<span class="settings-label">Localhost URL</span>
					<span class="local-url-text">{localUrlForCopy}</span>
					<button class="btn text-xs h-7 px-3 border-secondary rounded" on:click={() => navigator.clipboard.writeText(localUrlForCopy)}>Copy</button>
				</div>
			{/if}
		{/if}

		<!-- Iron Man: main content -->
		{#if selectedGame === 'ironman' && !imIsActive && !imInLobby && imMode !== 'guest'}
			<!-- Solo/Host: char picker setup -->
			<div class="dash-card border-secondary flex flex-col gap-4">
				{#if imSettings.charSelection === 'random'}
					<p class="dash-label">Characters selected randomly at start — {imSettings.rosterSize === 26 ? 'all 26' : imSettings.rosterSize + ' random'}</p>
				{:else if imSettings.rosterSize < 26}
					<p class="dash-label">Select {imSettings.rosterSize} characters ({imSelectedChars.length}/{imSettings.rosterSize})</p>
				{:else}
					<p class="dash-label">All 26 characters — full roster</p>
				{/if}
				{#if imSettings.charSelection !== 'random'}
				<div class="char-picker">
					{#each imCharRows as [start, end]}
						<div class="char-row">
							{#each IRONMAN_CHARS.slice(start, end) as charId}
								<button
									class="char-btn"
									class:char-btn--selected={imSelectedChars.includes(charId)}
									class:char-btn--full={imSettings.rosterSize < 26 && !imSelectedChars.includes(charId) && imSelectedChars.length >= imSettings.rosterSize}
									class:char-btn--next={imPreviewNextCharId === charId}
									on:click={() => imToggleChar(charId)}
									title={IRONMAN_CHAR_NAMES[charId]}
								>
									<img src="/image/characters/css/{IRONMAN_CHAR_FALLBACK[charId] ?? charId}.png" alt={IRONMAN_CHAR_NAMES[charId]} class="char-btn-img" />
								</button>
							{/each}
						</div>
					{/each}
				</div>
				{/if}
				{#if imSettings.charSelection !== 'random' && imSelectedChars.length > 0 && imSettings.charOrder !== 'free' && imSettings.rosterSize < 26}
					<div class="order-strip-wrap">
						<span class="order-strip-label">Play order — drag to rearrange</span>
						<div class="order-strip">
							{#each imSelectedChars as charId, i}
								<!-- svelte-ignore a11y-no-static-element-interactions -->
								<div
									class="order-slot"
									class:order-slot--first={i === 0}
									draggable="true"
									on:dragstart={() => imDragStart(i)}
									on:dragover={imDragOver}
									on:drop={() => imDrop(i)}
									on:dragend={imDragEnd}
									title={IRONMAN_CHAR_NAMES[charId]}
								>
									<img src="/image/characters/css/{IRONMAN_CHAR_FALLBACK[charId] ?? charId}.png" alt={IRONMAN_CHAR_NAMES[charId]} class="order-icon" />
									{#if i === 0}<span class="order-badge">1st</span>{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

		{:else if selectedGame === 'ironman' && imInLobby}
			<!-- Lobby: waiting or char picker after opponent connects -->
			<div class="dash-card border-secondary flex flex-col gap-4">
				{#if imMode === 'guest' && imIsSharedRandom}
					<p class="text-sm opacity-50">Waiting for host to start — your roster will be selected automatically…</p>
					<SlippiAd compact />
				{:else if $ironManLobby?.opponentConnected}
					<span class="text-green-400 text-sm font-semibold" in:fly={{ y: -8, duration: 150 }}>● {$ironManLobby.opponentName ?? 'Guest'} connected</span>
					{#if imSettings.charSelection !== 'random' && imSettings.rosterSize < 26}
						<p class="dash-label">Select your {imSettings.rosterSize} characters ({imSelectedChars.length}/{imSettings.rosterSize})</p>
						<div class="char-picker">
							{#each imCharRows as [start, end]}
								<div class="char-row">
									{#each IRONMAN_CHARS.slice(start, end) as charId}
										<button class="char-btn"
											class:char-btn--selected={imSelectedChars.includes(charId)}
											class:char-btn--full={!imSelectedChars.includes(charId) && imSelectedChars.length >= imSettings.rosterSize}
											on:click={() => imToggleChar(charId)} title={IRONMAN_CHAR_NAMES[charId]}>
											<img src="/image/characters/css/{IRONMAN_CHAR_FALLBACK[charId] ?? charId}.png" alt={IRONMAN_CHAR_NAMES[charId]} class="char-btn-img" />
										</button>
									{/each}
								</div>
							{/each}
						</div>
					{:else if imSettings.charSelection === 'random'}
						<p class="text-sm opacity-50">Characters will be selected randomly at start{imIsSharedRandom ? ' — same roster for both players' : ' — each player gets their own'}</p>
					{/if}
				{:else}
					<p class="text-sm opacity-50">Waiting for opponent to connect…</p>
					<SlippiAd compact />
				{/if}
			</div>
		{/if}

		<!-- Iron Man: active game -->
		{#if selectedGame === 'ironman' && imIsActive && imLocalRoster}
			{#if imPendingCarry && imPendingCarry > 0}
				<div class="carry-banner border-secondary" in:fly={{ y: -8, duration: 200 }}>
					⚡ Carry: opponent must SD {imPendingCarry} time{imPendingCarry > 1 ? 's' : ''} before next game starts
				</div>
			{/if}

			{#if imWinner}
				<div class="win-banner border-secondary" in:fly={{ y: -16, duration: 300 }}>
					{imWinner === 'local' ? '🏆 You win!' : `${imOpponentName} wins!`}
				</div>
			{/if}

			<div class="rosters-row">
				<div class="roster-col">
					<IronManRosterGrid
						roster={imLocalRoster}
						settings={imSettings}
						isLocal={true}
						label={imLocalName}
						variant={imSettings.variant}
						activeGameCharId={$ironManCurrentChar.localCharId}
					/>
				</div>
				{#if imOpponentRoster && imRole !== 'solo'}
					<div class="roster-divider">VS</div>
					<div class="roster-col">
						<IronManRosterGrid
							roster={imOpponentRoster}
							settings={imSettings}
							isLocal={false}
							label={imOpponentName}
							obscured={imSettings.hideOpponent}
							variant={imSettings.variant}
							activeGameCharId={$ironManCurrentChar.oppCharId}
						/>
					</div>
				{/if}
			</div>

			{#if (imSettings.variant === 'full_roster' || imSettings.variant === 'challenge') && imSettings.charOrder !== 'free' && imLocalRoster.currentIndex < imLocalRoster.slots.length}
				{@const activeSlot = imLocalRoster.slots[imLocalRoster.currentIndex]}
				<div class="active-char border-secondary" in:fly={{ y: 8, duration: 200 }}>
					<img
						src="/image/characters/css/{IRONMAN_CHAR_FALLBACK[activeSlot.characterId] ?? activeSlot.characterId}.png"
						alt={IRONMAN_CHAR_NAMES[activeSlot.characterId]}
						class="active-char-icon"
					/>
					<div>
						<p class="active-char-label">Play next</p>
						<p class="active-char-name">{IRONMAN_CHAR_NAMES[activeSlot.characterId]}</p>
					</div>
				</div>
			{/if}

			<ScoreProgressBar
				localScore={imLocalProgress.score}
				localName={imLocalName}
				oppScore={imOppProgress ? imOppProgress.score : null}
				oppName={imOpponentName}
				target={imLocalProgress.target}
				unit={imProgressUnit}
				localWinner={imWinner === 'local'}
				oppWinner={imWinner === 'opponent'}
			/>
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

<!-- Iron Man leaderboard popup -->
{#if showImLeaderboard}
	{@const imLbVariant = imSettings.variant}
	{@const imLbRecords = imLbVariant === 'full_roster' ? $ironManLeaderboard.fullRosterRecords : imLbVariant === 'standard' ? $ironManLeaderboard.standardRecords : $ironManLeaderboard.records}
	{@const imLbTitle = imLbVariant === 'full_roster' ? 'Best Times — Full Roster' : imLbVariant === 'standard' ? 'Best Runs — Standard' : 'Best Times — Challenge'}
	{@const imLbEmpty = imLbVariant === 'full_roster' ? 'No records yet. Complete a Full Roster solo run.' : imLbVariant === 'standard' ? 'No records yet. Play through all characters in Standard solo.' : 'No records yet. Complete a Challenge run to set a time.'}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<div class="selector-backdrop" on:click={() => (showImLeaderboard = false)}>
		<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
		<div class="leaderboard-modal background-primary-color border-secondary" on:click|stopPropagation in:fly={{ y: 20, duration: 180 }}>
			<div class="leaderboard-header">
				<p class="selector-title">{imLbTitle}</p>
				<button class="btn text-xs h-7 px-3 border-secondary rounded" on:click={() => (showImLeaderboard = false)}>✕</button>
			</div>
			{#if imLbRecords.length === 0}
				<p class="text-sm opacity-40 text-center py-6">{imLbEmpty}</p>
			{:else}
				<div class="leaderboard-body">
					<table class="lb-table" style="width:100%">
						<thead>
							{#if imLbVariant === 'standard'}
								<tr><th>#</th><th>Wins</th><th>Time</th><th>Chars</th><th>Date</th><th>Ver</th></tr>
							{:else}
								<tr><th>#</th><th>Time</th><th>Chars</th><th>Date</th><th>Ver</th></tr>
							{/if}
						</thead>
						<tbody>
							{#each imLbRecords as entry, i}
								{@const isOld = entry.version !== $ironManLeaderboard.currentVersion}
								<tr class:lb-row--old={isOld}>
									<td class="lb-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}</td>
									{#if imLbVariant === 'standard'}
										<td class="lb-time">{entry.wins ?? 0}/{entry.rosterSize}</td>
									{/if}
									<td class="lb-time">{formatTime(entry.timeSeconds)}</td>
									<td class="lb-date">{entry.rosterSize}</td>
									<td class="lb-date">{formatDate(entry.completedAt)}</td>
									<td class="lb-ver" title={isOld ? `Set on v${entry.version}` : ''}>{entry.version}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
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
		border: 1px solid var(--secondary-color);
		border-radius: 0.375rem;
		color: var(--secondary-color);
		opacity: 0.45;
		cursor: pointer;
		font-size: 0.78rem;
		padding: 0.2rem 0.7rem;
		transition: opacity 0.1s;
		line-height: 1.5;
	}
	.back-btn:hover { opacity: 0.85; }

	.selector-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 1rem;
	}

	.twitch-input {
		padding: 0.2rem 0.55rem;
		border-radius: 0.375rem;
		font-size: 0.78rem;
		outline: none;
		width: 9rem;
		transition: border-color 0.15s;
	}
	.twitch-input--valid { border-color: rgba(74, 222, 128, 0.7) !important; }
	.twitch-input--invalid { border-color: rgba(248, 113, 113, 0.7) !important; }

	.twitch-verify-icon {
		font-size: 0.85rem;
		line-height: 1;
	}
	.twitch-verify--spin { opacity: 0.5; animation: spin 1s linear infinite; }
	.twitch-verify--ok { color: #4ade80; }
	.twitch-verify--err { color: #f87171; }
	@keyframes spin { from { display: inline-block; transform: rotate(0deg); } to { transform: rotate(360deg); } }

	.twitch-group { flex-wrap: wrap; }

	.twitch-status-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
	}
	.twitch-status-pill {
		font-size: 0.75rem;
		padding: 0.15rem 0.5rem;
		border-radius: 1rem;
		border: 1px solid var(--secondary-color);
		opacity: 0.4;
	}
	.twitch-status-pill--ok { opacity: 0.85; }

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

	.join-section {
		padding: 0.9rem 1.1rem;
		border-radius: 0.375rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.selector-subtitle {
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		opacity: 0.45;
		font-weight: 600;
		margin: 0;
	}

	.join-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.join-input {
		flex: 1;
		min-width: 0;
	}

	.join-error {
		font-size: 0.75rem;
		opacity: 0.7;
		color: #f87171;
		margin: 0;
	}

	.local-url-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0.9rem;
		border-radius: 0.375rem;
		flex-wrap: wrap;
	}

	.local-url-text {
		flex: 1;
		font-size: 0.72rem;
		opacity: 0.55;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
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

	.settings-row--readonly {
		pointer-events: none;
		opacity: 0.6;
	}

	.dash-card {
		padding: 1.25rem 1.5rem;
		border-radius: 0.5rem;
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

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.55; }
	}

	/* Iron Man */
	.char-picker {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 1rem 0.75rem;
	}

	.char-row {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		justify-content: center;
	}

	.char-btn {
		border-radius: 6px;
		padding: 2px;
		opacity: 0.4;
		transition: opacity 0.15s, box-shadow 0.15s, background 0.15s;
		background: transparent;
		border: none;
	}

	.char-btn:hover:not(.char-btn--full) {
		opacity: 0.75;
	}

	.char-btn--selected {
		opacity: 1;
		box-shadow: 0 0 0 2px var(--secondary-color);
		background: color-mix(in srgb, var(--secondary-color) 10%, transparent);
	}

	.char-btn--full {
		opacity: 0.15;
		cursor: not-allowed;
	}

	.char-btn--next {
		box-shadow: 0 0 0 2px #fbbf24, 0 0 8px 2px rgba(251,191,36,0.3);
	}

	/* ── Iron Man order strip ── */
	.order-strip-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.order-strip-label {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.4;
	}

	.order-strip {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		padding: 0.4rem 0.25rem;
		border-radius: 0.375rem;
		background: color-mix(in srgb, var(--secondary-color) 4%, transparent);
		border: 1px solid color-mix(in srgb, var(--secondary-color) 15%, transparent);
	}

	.order-slot {
		position: relative;
		border-radius: 6px;
		padding: 3px;
		cursor: grab;
		transition: opacity 0.12s, box-shadow 0.12s;
		user-select: none;
	}

	.order-slot:hover {
		background: color-mix(in srgb, var(--secondary-color) 10%, transparent);
	}

	.order-slot--first {
		box-shadow: 0 0 0 2px #fbbf24;
	}

	.order-icon {
		width: 32px;
		height: 32px;
		object-fit: contain;
		display: block;
	}

	.order-badge {
		position: absolute;
		bottom: 1px;
		right: 2px;
		font-size: 0.5rem;
		font-weight: 700;
		color: #fbbf24;
		text-shadow: 0 0 3px #000;
		line-height: 1;
	}

	.char-btn-img {
		width: 40px;
		height: 40px;
		object-fit: contain;
		display: block;
	}

	.rosters-row {
		display: flex;
		gap: 1.5rem;
		align-items: flex-start;
		justify-content: center;
		flex-wrap: wrap;
	}

	.roster-col {
		flex: 1;
		min-width: 0;
	}

	.roster-divider {
		font-size: 0.8rem;
		opacity: 0.3;
		padding-top: 1.5rem;
		font-weight: 600;
	}

	.carry-banner {
		text-align: center;
		font-size: 0.88rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		animation: pulse 1.4s ease-in-out infinite;
	}

	.active-char {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		border-radius: 0.375rem;
	}

	.active-char-icon {
		width: 56px;
		height: 56px;
		object-fit: contain;
	}

	.active-char-label {
		font-size: 0.65rem;
		opacity: 0.4;
		text-transform: uppercase;
		letter-spacing: 0.07em;
	}

	.active-char-name {
		font-size: 1.1rem;
		font-weight: 600;
	}

</style>
