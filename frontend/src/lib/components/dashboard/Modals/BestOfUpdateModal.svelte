<script lang="ts">
	import Modal from '$lib/components/modal/Modal.svelte';
	import { BestOf } from '$lib/models/enum';
	import { electronEmitter, gameSettings } from '$lib/utils/store.svelte';

	export let open: boolean;

	$: currentBestOf = $gameSettings?.matchInfo?.bestOf;

	const handleUpdate = (bestOf: BestOf) => {
		$electronEmitter.emit('BestOfUpdate', bestOf);
		open = false;
	};
</script>

<Modal bind:open on:close={() => (open = false)} class="flex justify-center">
	<div
		class="w-[70vw] max-w-[600px] max-h-[80vh] min-w-72 flex flex-col justify-between gap-8 bg-cover bg-center border-secondary background-primary-color p-8"
	>
		<div class="flex gap-4 justify-center items-center">
			<h1 class="text-secondary-color text-3xl font-semibold">Games</h1>
		</div>

		{#each Object.values(BestOf).filter((bestOf) => typeof bestOf === 'number') as bestOf}
			<button
				class={`btn text-lg whitespace-nowrap h-10 px-2 xl:text-xl border-secondary ${
					currentBestOf === bestOf ? 'bg-opacity-50' : 'bg-opacity-25'
				}`}
				on:click={() => handleUpdate(bestOf)}
			>
				Best Of {bestOf}
			</button>
		{/each}
	</div>
</Modal>
