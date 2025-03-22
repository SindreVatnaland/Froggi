<script lang="ts">
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import AddSceneCommandModal from '$lib/components/dashboard/Modals/AddSceneCommandModal.svelte';
	import ToggleSceneSwitchCommand from '$lib/components/dashboard/ObsCommands/ToggleSceneSwitchCommand.svelte';
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { LiveStatsScene } from '$lib/models/enum';
	import { Command, SceneSwitchCommands } from '$lib/models/types/commandTypes';
	import { electronEmitter, sceneSwitch } from '$lib/utils/store.svelte';
	import { isNil, startCase } from 'lodash';

	let sceneCommands: SceneSwitchCommands | undefined = $sceneSwitch;
	let isSceneCommandModalOpen = false;
	let isDeleteCommandModalOpen = false;

	let selectedScene: LiveStatsScene = LiveStatsScene.WaitingForDolphin;
	let selectedCommand: Command;

	const deleteSceneCommand = () => {
		if (isNil(sceneCommands) || isNil(selectedCommand)) return;
		$electronEmitter.emit('SceneSwitchCommandDelete', selectedScene, selectedCommand?.id);
		isDeleteCommandModalOpen = false;
		notifications.success('Scene Command Deleted', 2000);
	};

	const scenes: LiveStatsScene[] = Object.values(LiveStatsScene);

	$: sceneCommands = $sceneSwitch;
</script>

{#if !isNil(sceneCommands)}
	<div class="flex flex-col gap-2 font-bold">
		<h1 class="text-3xl font-bold color-secondary text-center">Scene Switching</h1>
		<ToggleSceneSwitchCommand />
		<div
			class="flex flex-col justify-between gap-8 items-center"
			style={`opacity: ${$sceneSwitch?.enabled ? 1 : 0.5}`}
		>
			{#each scenes as scene}
				<div class="w-full flex flex-col gap-4">
					<h1 class="color-secondary text-2xl">{startCase(scene)}:</h1>
					{#each sceneCommands[scene] ?? [] as command}
						<div class="flex flex-col w-full">
							<h1 class="color-secondary text-lg">
								{startCase(String(command.requestType))}:
							</h1>
							{#each Object.keys(command?.payload ?? {}) as key}
								<div class="flex gap-2 justify-between">
									<h1 class="color-secondary text-md">
										{startCase(key)}:
									</h1>
									<h1 class="color-secondary text-md">
										{command?.payload?.[key]}
									</h1>
								</div>
							{/each}
							<button
								class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-12 px-2 text-xl border-secondary"
								on:click={() => {
									selectedScene = scene;
									selectedCommand = command;
									isDeleteCommandModalOpen = true;
								}}
							>
								Delete
							</button>
						</div>
					{/each}
				</div>
			{/each}
			<button
				class="transition w-full background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-12 px-2 text-2xl border-secondary"
				on:click={() => {
					isSceneCommandModalOpen = true;
				}}
			>
				Add New Command
			</button>
		</div>
	</div>
{/if}

<AddSceneCommandModal bind:open={isSceneCommandModalOpen} />
<ConfirmModal bind:open={isDeleteCommandModalOpen} on:confirm={deleteSceneCommand}>
	Delete Command
</ConfirmModal>
