<script lang="ts">
	import Modal from '$lib/components/modal/Modal.svelte';
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { LiveStatsScene } from '$lib/models/enum';
	import { Command, CommandType } from '$lib/models/types/commandTypes';
	import { electronEmitter } from '$lib/utils/store.svelte';
	import Select from '$lib/components/input/Select.svelte';
	import CommandSelect from '../ObsCommands/CommandSelect.svelte';
	import { startCase } from 'lodash';

	export let open: boolean;

	let selectedScene: LiveStatsScene = LiveStatsScene.WaitingForDolphin;
	let sceneCommand: Command = {
		type: CommandType.Obs,
		requestType: 'SaveReplayBuffer',
		payload: undefined,
	} as Command;

	const addSceneCommand = () => {
		$electronEmitter.emit('SceneSwitchCommandAdd', selectedScene, sceneCommand);
		notifications.success('Scene Command Added', 2000);
		open = false;
	};
</script>

<Modal bind:open on:close={() => (open = false)}>
	<div
		class="max-h-[80vh] max-w-[400px] w-screen h-full min-w-lg flex flex-col justify-between gap-8 bg-cover bg-center border-secondary background-primary-color p-8 overflow-y-auto"
	>
		<Select bind:selected={selectedScene} label="When switching scene to:">
			{#each Object.values(LiveStatsScene) as scene}
				<option value={scene} selected={scene === selectedScene}>
					{startCase(scene)}
				</option>
			{/each}
		</Select>
		<CommandSelect bind:command={sceneCommand} displayOverlayCommands={false} />
		<button
			class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-12 px-2 xl:text-xl border-secondary"
			on:click={addSceneCommand}
		>
			Add Command
		</button>
	</div>
</Modal>
