<script lang="ts">
	import TextInput from '$lib/components/input/TextInput.svelte';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { Player } from '$lib/models/types/slippiData';
	import { currentPlayers, electronEmitter } from '$lib/utils/store.svelte';

	export let open: boolean;

	let players: Player[] = $currentPlayers;

	const updateTag = () => {
		open = false;
		$electronEmitter.emit('PlayersUpdate', players);
	};
</script>

<Modal
	bind:open
	on:close={() => (open = false)}
	class="w-[95vw] max-w-[600px] min-w-72 flex justify-center"
>
	<div
		class="w-full h-full min-w-lg flex flex-col justify-between gap-8 bg-cover bg-center rounded-md border-secondary background-primary-color p-8"
	>
		<div class="flex gap-2 justify-center items-center">
			<h1 class="color-secondary text-3xl font-semibold">Tag</h1>
		</div>
		<div class="flex gap-2 justify-between">
			<div class="flex flex-col">
				<TextInput
					label={`Player1 - ${$currentPlayers[0].displayName}`}
					bind:value={players[0].displayName}
				/>
			</div>
			<div class="flex flex-col items-end">
				<TextInput
					label={`Player2 - ${$currentPlayers[1].displayName}`}
					bind:value={players[1].displayName}
				/>
			</div>
		</div>
		<button
			class={`transition background-color-primary bg-opacity-25 hover:bg-opacity-40  font-semibold text-secondary-color text-lg whitespace-nowrap h-10 px-2 xl:text-xl border-secondary`}
			on:click={updateTag}
		>
			Update
		</button>
	</div>
</Modal>
