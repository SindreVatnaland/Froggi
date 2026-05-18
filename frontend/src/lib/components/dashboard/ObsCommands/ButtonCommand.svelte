<script lang="ts">
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { ControllerButtons } from '$lib/models/types/controller';
	import { ControllerCommand } from '$lib/models/types/commandTypes';
	import { getControllerIndex } from '$lib/utils/controllerCommandHelper';
	import { electronEmitter, memoryReadController } from '$lib/utils/store.svelte';

	export let controllerCommand: ControllerCommand;

	let selectedCommand: ControllerCommand | undefined;
	let isDeleteCommandModalOpen = false;
	const deleteCommand = async () => {
		if (!selectedCommand?.id) {
			notifications.danger('Could not delete command', 1500);
			return;
		}
		$electronEmitter.emit('ControllerCommandDelete', selectedCommand.id);
		notifications.success('Command Deleted', 1500);
	};

	const getSelectedInputs = (
		controllerButtons: ControllerButtons,
	): [key: keyof ControllerButtons, value: boolean][] => {
		return Object.entries(controllerButtons).filter(([_, value]) => value) as [
			key: keyof ControllerButtons,
			value: boolean,
		][];
	};

	const filterKey = (key: string) => {
		const pattern = /is(.*?)Pressed/;
		const match = key.match(pattern);
		return match ? match[1] : key;
	};
</script>

<div class="flex gap-4 justify-center items-center">
	<div class="flex flex-col flex-1 justify-center">
		<div class="flex gap-2">
			{#each getSelectedInputs(controllerCommand.inputs) as [key, value]}
				<img
					class="aspect-square w-12 h-12"
					style={`opacity: ${
						$memoryReadController?.[getControllerIndex($memoryReadController)]
							?.buttons?.[key]
							? 1
							: 0.5
					}`}
					src={`/image/controller-buttons/${filterKey(key)}.svg`}
					alt={key}
				/>
			{/each}
		</div>
		<h1 class="text-xl text-secondary-color">
			{controllerCommand.command.requestType}:
		</h1>
		{#each Object.entries(controllerCommand.command.payload ?? {}) as [key, value]}
			<h1 class="text-xl text-secondary-color">
				{key}: {value}
			</h1>
		{/each}
	</div>
	<button
		class="btn text-md whitespace-nowrap h-12 px-2 xl:text-xl border-secondary"
		on:click={() => {
			selectedCommand = controllerCommand;
			isDeleteCommandModalOpen = true;
		}}
	>
		Delete
	</button>
</div>

<ConfirmModal bind:open={isDeleteCommandModalOpen} on:confirm={deleteCommand}>
	Delete Command
</ConfirmModal>
