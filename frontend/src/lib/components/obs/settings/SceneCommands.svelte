<script lang="ts">
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import AddSceneCommandModal from '$lib/components/dashboard/Modals/AddSceneCommandModal.svelte';
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { LiveStatsScene } from '$lib/models/enum';
	import type { Command, SceneSwitchCommands } from '$lib/models/types/commandTypes';
	import { electronEmitter, sceneSwitch } from '$lib/utils/store.svelte';
	import { isNil, startCase } from 'lodash';

	let isAddModalOpen = false;
	let isDeleteModalOpen = false;
	let selectedScene: LiveStatsScene = LiveStatsScene.WaitingForDolphin;
	let selectedCommand: Command;
	let addForScene: LiveStatsScene = LiveStatsScene.WaitingForDolphin;

	const scenes: LiveStatsScene[] = Object.values(LiveStatsScene);

	const toggleSceneSwitch = () => {
		$electronEmitter.emit('SceneSwitchCommandStateToggle');
		notifications.success(`Auto scene switch ${$sceneSwitch?.enabled ? 'disabled' : 'enabled'}`, 1500);
	};

	const openAdd = (scene: LiveStatsScene) => {
		addForScene = scene;
		isAddModalOpen = true;
	};

	const confirmDelete = () => {
		if (isNil($sceneSwitch) || isNil(selectedCommand)) return;
		$electronEmitter.emit('SceneSwitchCommandDelete', selectedScene, selectedCommand.id);
		isDeleteModalOpen = false;
		notifications.success('Command deleted', 1500);
	};

	$: sceneCommands = $sceneSwitch as SceneSwitchCommands | undefined;
</script>

{#if !isNil(sceneCommands)}
	<div class="scene-commands">
		<!-- Enable toggle -->
		<label class="toggle-row border-secondary">
			<span class="toggle-label text-secondary-color">Enable scene switching</span>
			<input
				type="checkbox"
				class="toggle-check"
				checked={$sceneSwitch?.enabled}
				on:change={toggleSceneSwitch}
			/>
		</label>

		<!-- Scene list -->
		<div class="scenes-list" class:scenes-list--off={!$sceneSwitch?.enabled}>
			{#each scenes as scene}
				{@const commands = sceneCommands[scene] ?? []}
				<div class="scene-block">
					<div class="scene-header">
						<span class="scene-name">{startCase(scene)}</span>
						<button class="add-btn border-secondary" on:click={() => openAdd(scene)}>+ Add</button>
					</div>
					{#if commands.length === 0}
						<p class="empty-hint">No commands — OBS does nothing on this state.</p>
					{:else}
						{#each commands as command}
							<div class="command-row border-secondary">
								<div class="command-info">
									<span class="command-type">{startCase(String(command.requestType))}</span>
									{#each Object.entries(command.payload ?? {}) as [k, v]}
										<span class="command-payload">{startCase(k)}: {v}</span>
									{/each}
								</div>
								<button
									class="delete-btn"
									on:click={() => {
										selectedScene = scene;
										selectedCommand = command;
										isDeleteModalOpen = true;
									}}
								>×</button>
							</div>
						{/each}
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

<AddSceneCommandModal bind:open={isAddModalOpen} initialScene={addForScene} />
<ConfirmModal bind:open={isDeleteModalOpen} on:confirm={confirmDelete}>
	Delete this command?
</ConfirmModal>

<style>
	.scene-commands {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.6rem 0.75rem;
		border-radius: 0.25rem;
		cursor: pointer;
	}

	.toggle-label {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.toggle-check {
		width: 1rem;
		height: 1rem;
		cursor: pointer;
	}

	.scenes-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		transition: opacity 0.2s;
	}

	.scenes-list--off {
		opacity: 0.4;
		pointer-events: none;
	}

	.scene-block {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.scene-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.scene-name {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--secondary-color);
		opacity: 0.5;
	}

	.add-btn {
		font-size: 0.65rem;
		font-weight: 600;
		padding: 0.15rem 0.5rem;
		border-radius: 0.25rem;
		background: transparent;
		color: var(--secondary-color);
		cursor: pointer;
		opacity: 0.6;
		transition: opacity 0.15s;
	}

	.add-btn:hover {
		opacity: 1;
	}

	.empty-hint {
		font-size: 0.7rem;
		opacity: 0.3;
		padding: 0.25rem 0;
	}

	.command-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.4rem 0.6rem;
		border-radius: 0.25rem;
		gap: 0.5rem;
	}

	.command-info {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		flex: 1;
		min-width: 0;
	}

	.command-type {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--secondary-color);
	}

	.command-payload {
		font-size: 0.7rem;
		opacity: 0.5;
		color: var(--secondary-color);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.delete-btn {
		font-size: 1rem;
		line-height: 1;
		opacity: 0.4;
		color: var(--secondary-color);
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0 0.25rem;
		flex-shrink: 0;
		transition: opacity 0.15s;
	}

	.delete-btn:hover {
		opacity: 1;
	}
</style>
