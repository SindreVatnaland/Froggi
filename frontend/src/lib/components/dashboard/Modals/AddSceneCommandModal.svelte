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
	export let initialScene: LiveStatsScene = LiveStatsScene.WaitingForDolphin;

	let selectedScene: LiveStatsScene = initialScene;
	let sceneCommand: Command = {
		type: CommandType.Obs,
		requestType: 'SaveReplayBuffer',
		payload: undefined,
	} as Command;

	$: if (open) {
		selectedScene = initialScene;
		sceneCommand = { type: CommandType.Obs, requestType: 'SaveReplayBuffer', payload: undefined } as Command;
	}

	const addSceneCommand = () => {
		$electronEmitter.emit('SceneSwitchCommandAdd', selectedScene, sceneCommand);
		notifications.success('Command added', 1500);
		open = false;
	};
</script>

<Modal bind:open on:close={() => (open = false)}>
	<div class="modal-box background-primary-color border-secondary text-secondary-color">
		<p class="modal-title">Add Scene Command</p>
		<p class="modal-desc">
			Choose a Froggi state, then pick an OBS action to run when it activates.
		</p>
		<div class="modal-form">
			<Select bind:selected={selectedScene} label="When Froggi enters:">
				{#each Object.values(LiveStatsScene) as scene}
					<option value={scene} selected={scene === selectedScene}>
						{startCase(scene)}
					</option>
				{/each}
			</Select>
			<CommandSelect bind:command={sceneCommand} displayOverlayCommands={false} />
		</div>
		<div class="modal-actions">
			<button class="btn text-sm h-9 px-5 border-secondary rounded" on:click={() => (open = false)}>
				Cancel
			</button>
			<button class="btn text-sm h-9 px-5 border-secondary rounded confirm-ok" on:click={addSceneCommand}>
				Add Command
			</button>
		</div>
	</div>
</Modal>

<style>
	.modal-box {
		padding: 1.25rem 1.5rem;
		min-width: 280px;
		max-width: 400px;
		width: 90vw;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		border-radius: 0.25rem;
	}

	.modal-title {
		font-size: 0.95rem;
		font-weight: 600;
	}

	.modal-desc {
		font-size: 0.75rem;
		opacity: 0.5;
		line-height: 1.5;
		margin-top: -0.25rem;
	}

	.modal-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.modal-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		margin-top: 0.25rem;
	}

	.confirm-ok {
		background-color: var(--secondary-color);
		color: var(--primary-color);
	}
</style>
