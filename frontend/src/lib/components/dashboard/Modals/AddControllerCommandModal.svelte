<script lang="ts">
	import Modal from '$lib/components/modal/Modal.svelte';
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { ControllerButtons } from '$lib/models/types/controller';
	import { Command, CommandType, ControllerCommand } from '$lib/models/types/commandTypes';
	import { getOverlappingCommands } from '$lib/utils/controllerCommandHelper';
	import { electronEmitter, controller } from '$lib/utils/store.svelte';
	import { fly } from 'svelte/transition';
	import ButtonCommand from '../ObsCommands/ButtonCommand.svelte';
	import { flip } from 'svelte/animate';
	import CommandSelect from '../ObsCommands/CommandSelect.svelte';

	export let open: boolean;

	$: overlappingCommands = getOverlappingCommands(
		$controller.inputCommands,
		controllerCommand.inputs,
	);

	const addCommand = async () => {
		if (!controllerCommand) return;
		if (!Object.values(controllerCommand.inputs).some((input) => input)) return;
		$electronEmitter.emit('ControllerCommandAdd', controllerCommand);
		notifications.success('Updated Commands', 1500);
		open = false;
	};

	let controllerCommand: ControllerCommand = {
		id: '',
		inputs: {
			isAPressed: false,
			isBPressed: false,
			isDPadLeftPressed: false,
			isDPadRightPressed: false,
			isDPadUpPressed: false,
			isDPadDownPressed: false,
			isLPressed: false,
			isRPressed: false,
			isStartPressed: false,
			isXPressed: false,
			isYPressed: false,
			isZPressed: false,
		},
		command: {
			id: '',
			requestType: 'SaveReplayBuffer',
			payload: undefined,
			type: CommandType.Obs,
		} as Command,
	};

	const filterKey = (key: string) => {
		const pattern = /is(.*?)Pressed/;
		const match = key.match(pattern);
		return match ? match[1] : key;
	};

	const getKeys = (): (keyof ControllerButtons)[] => {
		return Object.keys(controllerCommand.inputs) as (keyof ControllerButtons)[];
	};

	$: selectedKeys = Object.entries(controllerCommand.inputs)
		.filter(([_, value]) => value)
		.map(([key, _]) => key) as (keyof ControllerButtons)[];
</script>

<Modal bind:open on:close={() => (open = false)}>
	<div
		class="max-h-[80vh] max-w-[400px] w-screen h-full min-w-lg flex flex-col justify-between gap-4 bg-cover bg-center border-secondary background-primary-color p-8 overflow-y-auto"
	>
		<h1 class="flex text-2xl font-bold text-secondary-color">Button Combinations</h1>
		<div
			class="flex flex-col flex-1 overflow-y-auto gap-4 min-h-40 border-b border-t border-secondary-color py-2"
		>
			<div class="flex flex-col gap-2 pr-4">
				{#each getKeys() as key}
					<div class="flex justify-between items-center gap-2">
						<img
							class="aspect-square w-12 h-12"
							src={`/image/controller-buttons/${filterKey(key)}.svg`}
							alt={key}
						/>
						<input
							type="checkbox"
							class="w-12 h-12"
							bind:checked={controllerCommand.inputs[key]}
						/>
					</div>
				{/each}
			</div>
		</div>
		{#if Object.values(controllerCommand.inputs).some((input) => input)}
			<div class="flex flex-col gap-2" in:fly={{ x: 150, duration: 250 }}>
				<h1 class="text-2xl font-bold text-secondary-color">Selected Buttons</h1>
				<div class="flex gap-2 max-w-full overflow-auto">
					{#each selectedKeys as key (key)}
						<img
							animate:flip={{ duration: 250 }}
							class="aspect-square w-12 h-12"
							src={`/image/controller-buttons/${filterKey(key)}.svg`}
							alt={filterKey(key)}
						/>
					{/each}
				</div>
			</div>
			{#if overlappingCommands.length}
				<div class="flex flex-col gap-2">
					<h1 class="text-2xl font-bold text-secondary-color">Overlapping Commands</h1>
					<div class="max-w-full overflow-auto">
						{#each overlappingCommands as command}
							<ButtonCommand controllerCommand={command} />
						{/each}
					</div>
				</div>
			{/if}
		{/if}
		<CommandSelect bind:command={controllerCommand.command} />
		<button
			class="btn text-md whitespace-nowrap h-12 p-2 xl:text-xl border-secondary"
			on:click={addCommand}
		>
			Add Command
		</button>
	</div>
</Modal>
