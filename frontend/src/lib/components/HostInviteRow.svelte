<script lang="ts">
	/**
	 * Host invite affordance shown next to the connect code: a clickable
	 * froggi://join/<code> link (copy / share anywhere) plus a "Public" toggle
	 * that posts the lobby to the Froggi Discord channel (handled in lobbyService).
	 * Hosting itself is unchanged — this only adds invite surfaces.
	 */
	import { electronEmitter } from '$lib/utils/store.svelte';

	/** Encrypted connect code (same one shown in the Share Code row). */
	export let code = '';
	/** Bound by the host page so the toggle survives the game-pick remount. */
	export let isPublic = false;

	$: inviteUrl = code ? `froggi://join/${code}` : '';

	let copied = false;

	function copyUrl() {
		if (!inviteUrl) return;
		navigator.clipboard.writeText(inviteUrl);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	function togglePublic(e: Event) {
		isPublic = (e.currentTarget as HTMLInputElement).checked;
		$electronEmitter.emit('SetLobbyPublic', isPublic);
	}
</script>

{#if inviteUrl}
	<div class="invite-card border-secondary">
		<div class="invite-row">
			<span class="invite-label">Invite link</span>
			<span class="invite-url" title={inviteUrl}>{inviteUrl}</span>
			<button class="btn text-xs h-7 px-3 border-secondary rounded shrink-0" on:click={copyUrl}>
				{copied ? 'Copied' : 'Copy'}
			</button>
		</div>

		<label class="toggle-row">
			<span class="toggle-label">Public game</span>
			<input type="checkbox" class="toggle-check" checked={isPublic} on:change={togglePublic} />
		</label>

		<p class="hint">
			{#if isPublic}
				Posted to the Froggi Discord — anyone with the link can join. The post updates as
				players join and is removed when the game starts.
			{:else}
				Turn on to post this lobby to the Froggi Discord so anyone can join.
			{/if}
		</p>
	</div>
{/if}

<style>
	.invite-card {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 0.9rem 1.1rem;
		border-radius: 0.375rem;
	}
	.invite-row { display: flex; align-items: center; gap: 0.6rem; }
	.invite-label {
		font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;
		opacity: 0.45; white-space: nowrap;
	}
	.invite-url {
		flex: 1; min-width: 0; font-size: 0.82rem; font-family: monospace;
		overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: 0.85;
	}
	.toggle-row {
		display: flex; align-items: center; justify-content: space-between;
		cursor: pointer;
	}
	.toggle-label { font-size: 0.875rem; font-weight: 500; }
	.toggle-check { width: 1rem; height: 1rem; cursor: pointer; }
	.hint { font-size: 0.75rem; opacity: 0.45; line-height: 1.4; }
</style>
