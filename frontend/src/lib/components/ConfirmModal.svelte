<script lang="ts">
	import Modal from '$lib/components/modal/Modal.svelte';
	import { electronEmitter } from '$lib/utils/store.svelte';

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function confirm() {
		dispatch('confirm');
		open = false;
	}

	function cancel() {
		open = false;
	}

	// TODO: Style

	export let open = false;
</script>

<Modal bind:open on:close={() => (open = false)} class="rounded-lg">
	<div
		class="w-72 min-w-72 min-w-lg py-4 grid gap-8 justify-center bg-cover bg-center rounded-md border-secondary background-primary-color"
	>
		<div class="w-full grid justify-center gap-8 py-4">
			<h1 class="text-center text-secondary-color text-xl font-bold">
				<slot />
			</h1>
			<button
				class="btn text-md whitespace-nowrap w-full h-10 px-2 xl:text-xl border-secondary rounded"
				on:click={cancel}
			>
				Cancel
			</button>

			<button
				class="btn text-md whitespace-nowrap w-full h-10 px-2 xl:text-xl border-secondary rounded"
				on:click={confirm}
			>
				Confirm
			</button>
		</div>
	</div>
</Modal>

<style>
	:root {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
			Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	}
</style>
