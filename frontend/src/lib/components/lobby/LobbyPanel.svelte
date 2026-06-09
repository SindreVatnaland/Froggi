<script lang="ts">
	import { lobbyState, electronEmitter, remoteAccess, froggiSettings } from '$lib/utils/store.svelte';
	import { encryptUrl, decryptUrl, isEncryptedHash } from '$lib/utils/urlCrypto';
	import NgrokShareRow from '$lib/components/NgrokShareRow.svelte';
	import type { MinigameType } from '$lib/models/types/lobby';

	$: lobby = $lobbyState;
	$: isHost = lobby?.isHost ?? false;
	$: players = lobby?.players ?? [];
	$: maxPlayers = lobby?.maxPlayers ?? 2;
	$: selectedGame = lobby?.selectedGame ?? null;
	$: isFull = players.length >= maxPlayers;

	let joinCode = '';

	$: version = $froggiSettings?.version ?? 'froggi';
	$: shareUrl = $remoteAccess?.ngrok ?? '';
	$: shareCode = shareUrl ? encryptUrl(shareUrl, version) : '';
	// Deep link a friend can click to join directly (private invite). Needs a remote tunnel.
	$: inviteLink = shareCode ? `froggi://join/${shareCode}` : '';
	$: isPublic = lobby?.isPublic ?? false;

	let copied = false;
	let copyTimer: ReturnType<typeof setTimeout> | null = null;
	function copyInvite() {
		if (!inviteLink) return;
		navigator.clipboard.writeText(inviteLink);
		copied = true;
		if (copyTimer) clearTimeout(copyTimer);
		copyTimer = setTimeout(() => (copied = false), 1500);
	}
	const setPublic = (next: boolean) => $electronEmitter.emit('SetLobbyPublic', next);

	const games: { value: MinigameType; label: string }[] = [
		{ value: 'bingo', label: 'Bingo' },
		{ value: 'ironman', label: 'Iron Man' },
	];

	const host = () => $electronEmitter.emit('StartLobby');
	const join = () => {
		const raw = joinCode.trim();
		if (!raw) return;
		const url = isEncryptedHash(raw) ? decryptUrl(raw, version) : raw;
		$electronEmitter.emit('PeerConnect', url);
	};
	const leave = () => $electronEmitter.emit('LeaveLobby');
	const kick = (id: string) => $electronEmitter.emit('KickPlayer', id);
	const pick = (game: MinigameType) => $electronEmitter.emit('SelectMinigame', game);
	const start = () => $electronEmitter.emit('StartMinigame');
</script>

<div class="lobby-panel">
	{#if !lobby?.active}
		<!-- Idle: host or join -->
		<div class="settings-row border-secondary">
			<button class="btn h-9 px-5 border-secondary rounded" on:click={host}>Host lobby</button>
		</div>
		<div class="dash-card border-secondary flex flex-col gap-3">
			<span class="dash-label">Join a lobby</span>
			<div class="flex gap-2 flex-wrap">
				<input
					class="url-input border-secondary background-primary-color text-secondary-color flex-1"
					style="min-width: 10rem"
					placeholder="Paste share code…"
					bind:value={joinCode}
					on:keydown={(e) => e.key === 'Enter' && join()}
				/>
				<button class="btn h-9 px-5 border-secondary rounded shrink-0 disabled:opacity-40" disabled={!joinCode.trim()} on:click={join}>Join</button>
			</div>
		</div>
	{:else}
		<!-- Active lobby -->
		<div class="dash-card border-secondary flex flex-col gap-3">
			<div class="flex items-center justify-between">
				<span class="dash-label">Lobby · {players.length}/{maxPlayers}</span>
				<button class="btn text-xs h-7 px-3 border-secondary rounded opacity-70" on:click={leave}>Leave</button>
			</div>

			<!-- Player list -->
			<div class="flex flex-col gap-1">
				{#each players as p (p.id)}
					<div class="player-row border-secondary">
						<span class="dolphin-dot" class:dolphin-on={p.dolphinConnected}
							title={p.dolphinConnected ? 'Dolphin connected' : 'Dolphin not connected'}></span>
						<span class="player-name">{p.name}</span>
						{#if p.isHost}<span class="player-tag">Host</span>{/if}
						{#if p.isLocal}<span class="player-tag">You</span>{/if}
						<span class="dolphin-label">{p.dolphinConnected ? 'Active' : 'No Dolphin'}</span>
						{#if isHost && !p.isLocal}
							<button class="kick-btn" title="Remove player" on:click={() => kick(p.id)}>✕</button>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		{#if isHost}
			{#if inviteLink}
				<div class="invite-row border-secondary">
					<span class="settings-label">Invite link</span>
					<span class="invite-link" title={inviteLink}>{inviteLink}</span>
					<button class="btn text-xs h-7 px-3 border-secondary rounded shrink-0" on:click={copyInvite}>{copied ? 'Copied' : 'Copy'}</button>
				</div>
				<NgrokShareRow shareUrl={shareCode} label="Share Code" copyLabel="Copy Code" />

				<label class="toggle-row border-secondary">
					<span class="toggle-label">Public game (post invite to Discord)</span>
					<input type="checkbox" class="toggle-check" checked={isPublic} on:change={(e) => setPublic(e.currentTarget.checked)} />
				</label>
				{#if isPublic}
					<p class="hint">Posted to the Froggi Discord — anyone who clicks the link can join. Turn off to remove it.</p>
				{:else}
					<p class="hint">Send the invite link to a friend, or turn on Public to post it to Discord.</p>
				{/if}
			{:else}
				<p class="hint">Enable Remote Access in Settings to generate an invite link.</p>
			{/if}

			<div class="settings-row border-secondary">
				<div class="settings-group">
					<span class="settings-label">Minigame</span>
					<div class="pill-group">
						{#each games as g}
							<button class="pill" class:pill--active={selectedGame === g.value} on:click={() => pick(g.value)}>{g.label}</button>
						{/each}
					</div>
				</div>
				<button
					class="btn h-9 px-5 border-secondary rounded ml-auto disabled:opacity-40"
					disabled={!selectedGame || !isFull}
					on:click={start}
				>Start</button>
			</div>
			{#if !isFull}<p class="hint">Waiting for another player to join…</p>{/if}
		{:else}
			<div class="settings-row border-secondary">
				<span class="settings-label">Selected</span>
				<span class="text-sm">{selectedGame ? (selectedGame === 'bingo' ? 'Bingo' : 'Iron Man') : 'Host is choosing…'}</span>
			</div>
			<p class="hint">Waiting for the host to start…</p>
		{/if}
	{/if}
</div>

<style>
	.lobby-panel { display: flex; flex-direction: column; gap: 0.75rem; }
	.settings-row {
		display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;
		padding: 0.9rem 1.1rem; border-radius: 0.375rem;
	}
	.settings-group { display: flex; align-items: center; gap: 0.6rem; }
	.settings-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.45; white-space: nowrap; }
	.pill-group { display: flex; gap: 0.3rem; }
	.pill {
		padding: 0.2rem 0.65rem; border-radius: 1rem; font-size: 0.78rem;
		border: 1px solid var(--secondary-color); background: transparent;
		color: var(--secondary-color); opacity: 0.4; cursor: pointer; transition: opacity 0.12s;
	}
	.pill--active, .pill:hover { opacity: 1; background: color-mix(in srgb, var(--secondary-color) 12%, transparent); }

	.player-row {
		display: flex; align-items: center; gap: 0.5rem;
		padding: 0.45rem 0.7rem; border-radius: 0.375rem;
		background: rgba(255,255,255,0.02);
	}
	.player-name { font-size: 0.9rem; font-weight: 600; }
	.player-tag {
		font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.05em;
		opacity: 0.5; border: 1px solid var(--secondary-color); border-radius: 0.25rem;
		padding: 0.05rem 0.35rem;
	}
	.kick-btn {
		font-size: 0.8rem; line-height: 1;
		width: 1.4rem; height: 1.4rem; border-radius: 0.25rem;
		border: 1px solid var(--secondary-color); background: transparent;
		color: var(--secondary-color); opacity: 0.5; cursor: pointer; transition: opacity 0.12s, color 0.12s;
	}
	.dolphin-dot {
		width: 0.55rem; height: 0.55rem; border-radius: 50%; flex: 0 0 auto;
		background: #6b7280; box-shadow: 0 0 0 1px rgba(0,0,0,0.25) inset;
		transition: background 0.15s, box-shadow 0.15s;
	}
	.dolphin-dot.dolphin-on { background: #4ade80; box-shadow: 0 0 6px rgba(74,222,128,0.7); }
	.dolphin-label {
		margin-left: auto; font-size: 0.62rem; text-transform: uppercase;
		letter-spacing: 0.05em; opacity: 0.5; white-space: nowrap;
	}
	.kick-btn:hover { opacity: 1; color: #f87171; border-color: #f87171; }

	.url-input { padding: 0.5rem 0.75rem; border-radius: 0.375rem; font-size: 0.85rem; outline: none; }
	.hint { font-size: 0.78rem; opacity: 0.45; }

	.invite-row {
		display: flex; align-items: center; gap: 0.6rem;
		padding: 0.6rem 0.75rem; border-radius: 0.375rem;
	}
	.invite-link {
		flex: 1; min-width: 0; font-size: 0.82rem; font-family: monospace;
		overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: 0.85;
	}

	.toggle-row {
		display: flex; align-items: center; justify-content: space-between;
		padding: 0.6rem 0.75rem; border-radius: 0.25rem; cursor: pointer;
	}
	.toggle-label { font-size: 0.875rem; font-weight: 500; }
	.toggle-check { width: 1rem; height: 1rem; cursor: pointer; }
</style>
