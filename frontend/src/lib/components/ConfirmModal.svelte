<script lang="ts">
	import Modal from '$lib/components/modal/Modal.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	export let open = false;

	function confirm() {
		dispatch('confirm');
		open = false;
	}
</script>

<Modal bind:open on:close={() => (open = false)}>
	<div class="confirm-box background-primary-color border-secondary text-secondary-color">
		<p class="confirm-text"><slot /></p>
		<div class="confirm-actions">
			<button class="btn text-sm h-9 px-5 border-secondary rounded" on:click={() => (open = false)}>
				Cancel
			</button>
			<button class="btn text-sm h-9 px-5 border-secondary rounded confirm-ok" on:click={confirm}>
				Confirm
			</button>
		</div>
	</div>
</Modal>

<style>
	.confirm-box {
		padding: 1.25rem 1.5rem;
		min-width: 260px;
		max-width: 380px;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		border-radius: 0.25rem;
	}

	.confirm-text {
		font-size: 0.875rem;
		font-weight: 500;
		line-height: 1.5;
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
</style>
