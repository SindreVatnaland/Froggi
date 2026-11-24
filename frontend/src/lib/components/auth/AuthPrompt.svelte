<script lang="ts">
	import Modal from '$lib/components/modal/Modal.svelte';
	import { authPromptOpen, authorizationKey, authorizeReplyAt, electronEmitter, isAuthorized } from '$lib/utils/store.svelte';
	import { get } from 'svelte/store';

	// Asks a remote device for the host password when one of its commands was blocked (initEventListener),
	// and checks it on submit: the host answers every message with Authorize true / false.
	let key = '';
	let state: 'idle' | 'checking' | 'ok' | 'wrong' | 'noAnswer' = 'idle';
	let unsubscribe: (() => void) | undefined;

	function close() {
		unsubscribe?.();
		unsubscribe = undefined;
		authPromptOpen.set(false);
		state = 'idle';
	}

	function submit() {
		if (!key.trim() || state === 'checking') return;
		const sentAt = Date.now();
		state = 'checking';
		localStorage.setItem('AuthorizationKey', key.trim());
		authorizationKey.set(key.trim());
		const timeout = setTimeout(() => finish('noAnswer'), 5000);
		unsubscribe?.();
		unsubscribe = authorizeReplyAt.subscribe((at) => {
			if (at < sentAt) return;
			clearTimeout(timeout);
			finish(get(isAuthorized) ? 'ok' : 'wrong');
		});
		$electronEmitter.emit('Ping');
	}

	function finish(result: 'ok' | 'wrong' | 'noAnswer') {
		unsubscribe?.();
		unsubscribe = undefined;
		state = result;
		if (result === 'ok') setTimeout(close, 1500);
	}
</script>

<Modal open={$authPromptOpen} on:close={close}>
	<form class="confirm-box background-primary-color border-secondary text-secondary-color" on:submit|preventDefault={submit}>
		<p class="confirm-title">Host password needed</p>
		<p class="body">
			To control Froggi from this device, enter the host password. You'll find it on the host PC in
			<strong>Froggi → Settings → Authorization</strong>. Without it you can still watch, but not control.
		</p>
		<!-- svelte-ignore a11y-autofocus -->
		<input
			class="key-input border-secondary"
			type="password"
			autocomplete="current-password"
			placeholder="Host password"
			autofocus
			bind:value={key}
			on:input={() => state === 'wrong' || state === 'noAnswer' ? (state = 'idle') : null}
		/>
		{#if state === 'checking'}
			<p class="status">Checking…</p>
		{:else if state === 'ok'}
			<p class="status ok">Connected — you can control Froggi now. Try that again.</p>
		{:else if state === 'wrong'}
			<p class="status bad">Wrong password. Check it on the host PC: Settings → Authorization.</p>
		{:else if state === 'noAnswer'}
			<p class="status bad">No answer from Froggi — check that the host is running and this device is connected.</p>
		{/if}
		<div class="confirm-actions">
			<button type="button" class="btn text-sm h-9 px-5 border-secondary rounded" on:click={close}>Cancel</button>
			<button type="submit" class="btn text-sm h-9 px-5 border-secondary rounded confirm-ok" disabled={!key.trim() || state === 'checking'}>
				Connect
			</button>
		</div>
	</form>
</Modal>

<style>
	.confirm-box {
		padding: 1.25rem 1.5rem;
		width: min(90vw, 400px);
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		border-radius: 0.25rem;
	}
	.confirm-title {
		font-weight: 600;
	}
	.body {
		font-size: 0.85rem;
		line-height: 1.5;
		opacity: 0.8;
	}
	.key-input {
		height: 2.25rem;
		padding: 0 0.75rem;
		background: transparent;
		color: inherit;
		font-size: 0.9rem;
	}
	.status {
		font-size: 0.8rem;
	}
	.ok {
		color: #4ade80;
	}
	.bad {
		color: #f87171;
	}
	.confirm-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}
	.confirm-ok {
		background-color: var(--secondary-color);
		color: var(--primary-color);
	}
	button:disabled {
		opacity: 0.4;
	}
</style>
