<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { tooltip } from 'svooltip';
	import { ironManSession, ironManLobby, ironManCurrentChar, electronEmitter, currentPlayer, urls, remoteAccess, ngrokStatus } from '$lib/utils/store.svelte';
	import type { IronManSettings, IronManRoster } from '$lib/models/types/ironman';
	import { IRONMAN_CHARS, IRONMAN_CHAR_NAMES, IRONMAN_CHAR_FALLBACK } from '$lib/models/types/ironman';
	import IronManRosterGrid from '$lib/components/ironman/IronManRosterGrid.svelte';
	import SlippiAd from '$lib/components/SlippiAd.svelte';
	import OverlayRow from '$lib/components/OverlayRow.svelte';
	import NgrokShareRow from '$lib/components/NgrokShareRow.svelte';

	const CHAR_NAMES = IRONMAN_CHAR_NAMES;

	type Mode = 'solo' | 'host' | 'guest';

	let mode: Mode = 'solo';
	const modeOptions: { value: Mode; label: string }[] = [
		{ value: 'solo', label: 'Solo' },
		{ value: 'host', label: 'Host' },
		{ value: 'guest', label: 'Join' },
	];

	const defaultSettings: IronManSettings = {
		variant: 'standard',
		rosterSize: 7,
		hideOpponent: false,
		stocksPerChar: 4,
		charOrder: 'fixed',
		charSelection: 'pick',
		randomSync: 'shared',
	};
	let settings = { ...defaultSettings };

	const variantOptions: { value: IronManSettings['variant']; label: string; tip: string }[] = [
		{ value: 'standard', label: 'Standard', tip: 'Lose a game → that character is depleted.\nLast player with characters remaining wins.' },
		{ value: 'full_roster', label: 'Full Roster', tip: 'Win with each character to complete it.\nFirst to finish your entire roster wins.' },
		{ value: 'challenge', label: 'Challenge', tip: 'Solo: beat every character without a single loss.\nAny loss resets all progress. Fastest time recorded.' },
	];

	const orderOptions: { value: IronManSettings['charOrder']; label: string; tip: string }[] = [
		{ value: 'free', label: 'Free', tip: 'Play any remaining character each game.\nThe active character updates when a game starts.' },
		{ value: 'fixed', label: 'Fixed', tip: 'Play in the exact order you set.\nThe next character is shown before each game.' },
		{ value: 'random', label: 'Random', tip: 'Order is randomised when you start.\nThe next character is shown before each game.' },
	];

	const rosterSizes = [5, 7, 11, 15, 25, 26] as const;
	const charRows: [number, number][] = [[0, 9], [9, 19], [19, 26]];

	let selectedChars: number[] = [];
	let guestUrl = '';
	let connecting = false;

	// When size 26 selected, auto-fill all chars
	$: if (settings.rosterSize === 26 && selectedChars.length !== IRONMAN_CHARS.length) {
		selectedChars = [...IRONMAN_CHARS];
	}

	$: inLobby = !!$ironManLobby && !$ironManSession;
	$: session = $ironManSession;
	$: isActive = !!session;
	$: role = session?.role ?? 'solo';
	$: localRoster = session?.localRoster ?? null;
	$: opponentRoster = session?.opponentRoster ?? null;
	$: winner = session?.winner ?? null;
	$: localName = session?.localName ?? 'You';
	$: opponentName = session?.opponentName ?? 'Opponent';

	$: qrPeerUrl = (() => {
		const base = $remoteAccess?.url ?? $ngrokStatus?.url ?? $urls?.local ?? '';
		if (!base) return '';
		return base.replace(/\/$/, '') + '/obs/ironman?mode=guest';
	})();

	// Lobby settings sync
	$: if (inLobby && mode === 'host') $electronEmitter.emit('IronManUpdateLobbySettings', settings);
	$: if (mode === 'guest' && $ironManLobby?.settings) settings = $ironManLobby.settings;

	$: localOverlayUrl = $urls?.local ? $urls.local.replace(/\/$/, '') + '/obs/game-preview' : '';
	$: tailscaleBase = $remoteAccess?.tailscale ?? $urls?.external ?? '';
	$: qrOverlayUrl = tailscaleBase ? tailscaleBase.replace(/\/$/, '') + '/obs/game-preview' : localOverlayUrl;
	$: ngrokShareUrl = $remoteAccess?.ngrok ?? '';

	// Parse mode from URL (guest arrives via QR)
	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		const m = params.get('mode');
		if (m === 'guest') mode = 'guest';
		$electronEmitter.emit('GetIronManLeaderboard');
	});

	$: if ($ironManLobby) connecting = false;
	$: if ($ironManSession?.role === 'guest') connecting = false;
	$: if (!$ironManSession && !$ironManLobby) connecting = false;

	function buildRoster(charIds: number[]): IronManRoster {
		let slots = charIds.map(id => ({
			characterId: id,
			depleted: false,
			completed: false,
			stocksRemaining: settings.stocksPerChar,
		}));
		if (settings.charOrder === 'random') {
			for (let i = slots.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[slots[i], slots[j]] = [slots[j], slots[i]];
			}
		}
		return { slots, currentIndex: 0 };
	}

	function startSolo() {
		const chars = settings.rosterSize === 26 ? [...IRONMAN_CHARS] : selectedChars.slice(0, settings.rosterSize);
		if (chars.length < 1) return;
		const localRoster = buildRoster(chars);
		$electronEmitter.emit('StartIronMan', {
			settings,
			localRoster,
			opponentRoster: null,
			role: 'solo',
			localName: $currentPlayer?.displayName || 'Player',
			opponentName: null,
			localPlayerIndex: $currentPlayer?.playerIndex ?? null,
			opponentConnected: false,
			startedAt: Date.now(),
			winner: null,
			pendingCarryStocks: null,
		});
	}

	function startHost() {
		const chars = settings.rosterSize === 26 ? [...IRONMAN_CHARS] : selectedChars.slice(0, settings.rosterSize);
		if (chars.length < 1) return;
		const localRoster = buildRoster(chars);
		$electronEmitter.emit('StartIronMan', {
			settings,
			localRoster,
			opponentRoster: null,
			role: 'host',
			localName: $currentPlayer?.displayName || 'Player 1',
			opponentName: $ironManLobby?.opponentName ?? null,
			localPlayerIndex: $currentPlayer?.playerIndex ?? null,
			opponentConnected: $ironManLobby?.opponentConnected ?? false,
			startedAt: Date.now(),
			winner: null,
			pendingCarryStocks: null,
		});
	}

	function joinAsGuest() {
		if (!guestUrl.trim()) return;
		connecting = true;
		$electronEmitter.emit('IronManPeerConnect', guestUrl.trim());
	}

	function startGuest() {
		if (!$ironManLobby || !$currentPlayer) return;
		const chars = settings.rosterSize === 26 ? [...IRONMAN_CHARS] : selectedChars.slice(0, settings.rosterSize);
		if (chars.length < 1) return;
		const localRoster = buildRoster(chars);
		const pendingSettings = (window as any).__ironManPendingSettings ?? settings;
		$electronEmitter.emit('StartIronMan', {
			settings: pendingSettings,
			localRoster,
			opponentRoster: null,
			role: 'guest',
			localName: $currentPlayer?.displayName || 'Player 2',
			opponentName: $ironManLobby.opponentName,
			localPlayerIndex: $currentPlayer?.playerIndex ?? null,
			opponentConnected: true,
			startedAt: Date.now(),
			winner: null,
			pendingCarryStocks: null,
		});
	}

	function hostLobby() {
		connecting = false;
		$electronEmitter.emit('IronManStartLobby', settings);
	}

	function stop() {
		connecting = false;
		$electronEmitter.emit('StopIronMan');
	}

	function toggleChar(id: number) {
		if (settings.rosterSize === 26) return;
		if (selectedChars.includes(id)) {
			selectedChars = selectedChars.filter(c => c !== id);
		} else if (selectedChars.length < settings.rosterSize) {
			selectedChars = [...selectedChars, id];
		}
	}

	$: canStart = settings.rosterSize === 26 || selectedChars.length === settings.rosterSize;

	$: pendingCarry = session?.pendingCarryStocks;

	function formatTime(s: number): string {
		const m = Math.floor(s / 60);
		const sec = s % 60;
		return `${m}:${sec.toString().padStart(2, '0')}`;
	}

	let timerSeconds = 0;
	let timerInterval: ReturnType<typeof setInterval> | null = null;

	$: if (isActive && !timerInterval) {
		timerSeconds = 0;
		timerInterval = setInterval(() => timerSeconds++, 1000);
	}
	$: if (!isActive && timerInterval) {
		clearInterval(timerInterval);
		timerInterval = null;
		timerSeconds = 0;
	}

	// ── Drag-to-reorder selected chars ─────────────────────────────────────────
	let dragFromIdx: number | null = null;

	function onDragStart(i: number) { dragFromIdx = i; }
	function onDragOver(e: DragEvent) { e.preventDefault(); }
	function onDrop(i: number) {
		if (dragFromIdx === null || dragFromIdx === i) return;
		const arr = [...selectedChars];
		const [moved] = arr.splice(dragFromIdx, 1);
		arr.splice(i, 0, moved);
		selectedChars = arr;
		dragFromIdx = null;
	}
	function onDragEnd() { dragFromIdx = null; }

	// First char in fixed/random order (preview highlight)
	$: previewNextCharId = (settings.charOrder === 'fixed' || settings.charOrder === 'random') && selectedChars.length > 0
		? selectedChars[0]
		: null;
</script>

<main class="background-primary-color text-secondary-color flex justify-center">
	<div class="w-full max-w-2xl flex flex-col gap-5">

		<!-- Header -->
		<div class="flex items-start justify-between gap-4 flex-wrap">
			<div>
				<h1 class="font-bold text-3xl">Iron Man</h1>
				{#if isActive}
					<p class="text-sm opacity-50 mt-1">
						{session?.settings.variant === 'standard' ? 'Standard' : session?.settings.variant === 'full_roster' ? 'Full Roster' : 'Challenge'}
						· {localRoster?.slots.length ?? 0} chars · ⏱ {formatTime(timerSeconds)}
					</p>
				{/if}
			</div>
			<div class="flex items-center gap-2 flex-wrap">
				{#if isActive}
					<button class="btn border-secondary text-sm h-9 px-3 rounded" on:click={stop}>Stop</button>
				{:else if inLobby}
					{#if $ironManLobby?.opponentConnected && mode !== 'guest'}
						<button class="btn border-secondary text-sm h-9 px-4 rounded" disabled={!canStart} on:click={startHost}>Start Iron Man</button>
					{:else if mode === 'guest'}
						<button class="btn border-secondary text-sm h-9 px-4 rounded" disabled={!canStart} on:click={startGuest}>Start Guest</button>
					{/if}
					<button class="btn text-sm h-9 px-3 border-secondary rounded opacity-60" on:click={stop}>Cancel</button>
				{:else if mode === 'solo'}
					<button class="btn border-secondary text-sm h-9 px-4 rounded" disabled={!canStart} on:click={startSolo}>Start Solo</button>
				{:else if mode === 'host'}
					<button class="btn border-secondary text-sm h-9 px-4 rounded" on:click={hostLobby}>Open Lobby</button>
				{/if}
			</div>
		</div>

		<!-- Settings strip (always visible when not active) -->
		{#if !isActive}
			<div class="settings-row border-secondary" class:settings-row--readonly={mode === 'guest' && inLobby}>
				<div class="settings-group">
					<span class="settings-label">Mode</span>
					<div class="pill-group">
						{#each modeOptions as m}
							<button class="pill" class:pill--active={mode === m.value} on:click={() => mode = m.value}>{m.label}</button>
						{/each}
					</div>
				</div>
				{#if mode !== 'guest' || inLobby}
					<div class="settings-group">
						<span class="settings-label">Variant</span>
						<div class="pill-group">
							{#each variantOptions as { value, label, tip }}
								<button
									class="pill"
									class:pill--active={settings.variant === value}
									on:click={() => settings = { ...settings, variant: value }}
									use:tooltip={{ content: tip, placement: 'bottom', delay: [400, 0], allowHTML: false }}
								>{label}</button>
							{/each}
						</div>
					</div>
					<div class="settings-group">
						<span class="settings-label">Size</span>
						<div class="pill-group">
							{#each rosterSizes as size}
								<button
									class="pill"
									class:pill--active={settings.rosterSize === size}
									on:click={() => {
										settings = { ...settings, rosterSize: size };
										if (size < 26) selectedChars = selectedChars.slice(0, size);
									}}
								>{size === 26 ? 'All' : size}</button>
							{/each}
						</div>
					</div>
					<div class="settings-group">
						<span class="settings-label">Order</span>
						<div class="pill-group">
							{#each orderOptions as { value, label, tip }}
								<button
									class="pill"
									class:pill--active={settings.charOrder === value}
									on:click={() => settings = { ...settings, charOrder: value }}
									use:tooltip={{ content: tip, placement: 'bottom', delay: [400, 0], allowHTML: false }}
								>{label}</button>
							{/each}
						</div>
					</div>
					{#if mode !== 'solo'}
						<div class="settings-group">
							<span class="settings-label">Hide characters</span>
							<div class="pill-group">
								<button class="pill" class:pill--active={!settings.hideOpponent}
									on:click={() => settings = { ...settings, hideOpponent: false }}
									use:tooltip={{ content: "Opponent's characters are always visible", placement: 'bottom', delay: [400, 0] }}>Off</button>
								<button class="pill" class:pill--active={settings.hideOpponent}
									on:click={() => settings = { ...settings, hideOpponent: true }}
									use:tooltip={{ content: "Opponent's characters are hidden until a game starts", placement: 'bottom', delay: [400, 0] }}>On</button>
							</div>
						</div>
					{/if}
				{/if}
			</div>
		{/if}

		<!-- Host URL (before char picker) -->
		{#if mode === 'host' && !isActive}
			<NgrokShareRow shareUrl={ngrokShareUrl} />
		{/if}

		<!-- OBS / device overlay — under rules -->
		{#if localOverlayUrl}
			<OverlayRow url={localOverlayUrl} qrUrl={qrOverlayUrl} title="Game Preview" obsWidth={800} obsHeight={1100} popupWidth={800} popupHeight={1100} />
		{/if}

		<!-- Main content -->
		{#if isActive && localRoster}
			<!-- Active game -->
			{#if pendingCarry && pendingCarry > 0}
				<div class="carry-banner border-secondary" in:fly={{ y: -8, duration: 200 }}>
					⚡ Carry stocks: opponent must SD {pendingCarry} time{pendingCarry > 1 ? 's' : ''} before game starts
				</div>
			{/if}

			{#if winner}
				<div class="win-banner border-secondary" in:fly={{ y: -16, duration: 300 }}>
					{winner === 'local' ? '🏆 You win!' : `${opponentName} wins!`}
				</div>
			{/if}

			<div class="rosters-row">
				<div class="roster-col">
					<IronManRosterGrid
						roster={localRoster}
						{settings}
						isLocal={true}
						label={localName}
						variant={settings.variant}
						activeGameCharId={$ironManCurrentChar.localCharId}
					/>
				</div>
				{#if opponentRoster && role !== 'solo'}
					<div class="roster-divider">VS</div>
					<div class="roster-col">
						<IronManRosterGrid
							roster={opponentRoster}
							{settings}
							isLocal={false}
							label={opponentName}
							obscured={settings.hideOpponent}
							variant={settings.variant}
							activeGameCharId={$ironManCurrentChar.oppCharId}
						/>
					</div>
				{/if}
			</div>

			{#if (settings.variant === 'full_roster' || settings.variant === 'challenge') && settings.charOrder !== 'free' && localRoster.currentIndex < localRoster.slots.length}
				{@const activeSlot = localRoster.slots[localRoster.currentIndex]}
				<div class="active-char border-secondary" in:fly={{ y: 8, duration: 200 }}>
					<img
						src="/image/characters/css/{IRONMAN_CHAR_FALLBACK[activeSlot.characterId] ?? activeSlot.characterId}.png"
						alt={CHAR_NAMES[activeSlot.characterId]}
						class="active-char-icon"
					/>
					<div>
						<p class="active-char-label">Current character</p>
						<p class="active-char-name">{CHAR_NAMES[activeSlot.characterId]}</p>
						<p class="active-char-progress">{localRoster.currentIndex + 1}/{localRoster.slots.length}</p>
					</div>
				</div>
			{/if}

		{:else if !isActive && mode === 'guest' && !$ironManLobby}
			<!-- Guest: join URL input replaces char picker until connected -->
			<div class="dash-card border-secondary flex flex-col gap-4">
				<p class="dash-label">Join Iron Man</p>
				<input type="text" class="url-input border-secondary" placeholder="Host URL (e.g. https://…)" bind:value={guestUrl} />
				<div class="flex gap-2">
					<button class="btn border-secondary rounded px-4 h-9 text-sm" disabled={connecting || !guestUrl.trim()} on:click={joinAsGuest}>{connecting ? 'Connecting…' : 'Join'}</button>
				</div>
			</div>

		{:else if !isActive && !inLobby}
			<!-- Solo/Host: char picker setup -->
			<div class="dash-card border-secondary flex flex-col gap-4">
				{#if settings.rosterSize < 26}
					<p class="dash-label">Select {settings.rosterSize} characters ({selectedChars.length}/{settings.rosterSize})</p>
				{:else}
					<p class="dash-label">All 26 characters — full roster</p>
				{/if}
				<div class="char-picker">
					{#each charRows as [start, end]}
						<div class="char-row">
							{#each IRONMAN_CHARS.slice(start, end) as charId}
								<button
									class="char-btn"
									class:char-btn--selected={selectedChars.includes(charId)}
									class:char-btn--full={settings.rosterSize < 26 && !selectedChars.includes(charId) && selectedChars.length >= settings.rosterSize}
									class:char-btn--next={previewNextCharId === charId}
									on:click={() => toggleChar(charId)}
									title={CHAR_NAMES[charId]}
								>
									<img
										src="/image/characters/css/{IRONMAN_CHAR_FALLBACK[charId] ?? charId}.png"
										alt={CHAR_NAMES[charId]}
										class="char-btn-img"
									/>
								</button>
							{/each}
						</div>
					{/each}
				</div>

				{#if selectedChars.length > 0 && settings.charOrder !== 'free' && settings.rosterSize < 26}
					<div class="order-strip-wrap">
						<span class="order-strip-label">Play order — drag to rearrange</span>
						<div class="order-strip">
							{#each selectedChars as charId, i}
								<!-- svelte-ignore a11y-no-static-element-interactions -->
								<div
									class="order-slot"
									class:order-slot--first={i === 0}
									draggable="true"
									on:dragstart={() => onDragStart(i)}
									on:dragover={onDragOver}
									on:drop={() => onDrop(i)}
									on:dragend={onDragEnd}
									title={CHAR_NAMES[charId]}
								>
									<img
										src="/image/characters/css/{IRONMAN_CHAR_FALLBACK[charId] ?? charId}.png"
										alt={CHAR_NAMES[charId]}
										class="order-icon"
									/>
									{#if i === 0}
										<span class="order-badge">1st</span>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

		{:else if inLobby}
			<!-- Lobby: waiting or char picker after opponent connects -->
			<div class="dash-card border-secondary flex flex-col gap-4">
				{#if $ironManLobby?.opponentConnected}
					<div in:fly={{ y: -10, duration: 200 }}>
						<span class="text-green-400 text-sm font-semibold">● {$ironManLobby.opponentName ?? 'Guest'} connected</span>
						<p class="text-xs opacity-50 mt-1">Select your characters and start</p>
					</div>
					{#if settings.rosterSize < 26}
						<div class="char-picker">
							{#each charRows as [start, end]}
								<div class="char-row">
									{#each IRONMAN_CHARS.slice(start, end) as charId}
										<button
											class="char-btn"
											class:char-btn--selected={selectedChars.includes(charId)}
											class:char-btn--full={!selectedChars.includes(charId) && selectedChars.length >= settings.rosterSize}
											on:click={() => toggleChar(charId)}
											title={CHAR_NAMES[charId]}
										>
											<img src="/image/characters/css/{IRONMAN_CHAR_FALLBACK[charId] ?? charId}.png" alt={CHAR_NAMES[charId]} class="char-btn-img" />
										</button>
									{/each}
								</div>
							{/each}
						</div>
					{/if}
				{:else}
					<p class="text-sm opacity-50">Waiting for guest to connect…</p>
					<SlippiAd compact />
				{/if}

				{#if qrPeerUrl}
					<div class="peer-url-row border-secondary">
						<p class="text-xs opacity-50">Share with opponent</p>
						<p class="text-xs opacity-40 break-all">{qrPeerUrl}</p>
					</div>
				{/if}
			</div>
		{:else}
			<SlippiAd />
		{/if}


	</div>
</main>

<style>
	main {
		min-height: 100vh;
		padding: 1.5rem 1rem;
	}

	.dash-card {
		padding: 1.25rem 1.5rem;
		border-radius: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.dash-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.4;
		margin-bottom: 0.1rem;
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
		padding: 3px;
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

	.char-btn-img {
		width: 40px;
		height: 40px;
		object-fit: contain;
		display: block;
	}

	/* ── Order strip ── */
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

	.url-input {
		background: transparent;
		padding: 0.4rem 0.6rem;
		border-radius: 0.375rem;
		font-size: 0.85rem;
		width: 100%;
		outline: none;
	}

	.peer-url-row {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.75rem 1rem;
		border-radius: 0.375rem;
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

	.win-banner {
		text-align: center;
		font-size: 1.6rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		padding: 0.6rem;
		border-radius: 0.375rem;
		animation: pulse 1.2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.55; }
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

	.active-char-progress {
		font-size: 0.75rem;
		opacity: 0.5;
	}
</style>
