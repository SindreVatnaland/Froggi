<script lang="ts">
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import type { ControllerButtons } from '$lib/models/types/controller';
	import type { ControllerCommand } from '$lib/models/types/commandTypes';
	import { getControllerIndex } from '$lib/utils/controllerCommandHelper';
	import { electronEmitter, memoryReadController } from '$lib/utils/store.svelte';
	import { startCase } from 'lodash';

	export let controllerCommand: ControllerCommand;

	let isDeleteModalOpen = false;

	const deleteCommand = async () => {
		$electronEmitter.emit('ControllerCommandDelete', controllerCommand.id);
		notifications.success('Command deleted', 1500);
	};

	const getSelectedInputs = (
		buttons: ControllerButtons,
	): (keyof ControllerButtons)[] =>
		(Object.entries(buttons).filter(([, v]) => v) as [keyof ControllerButtons, boolean][]).map(([k]) => k);

	const filterKey = (key: string) => {
		const match = key.match(/is(.*?)Pressed/);
		return match ? match[1] : key;
	};

	$: selectedInputs = getSelectedInputs(controllerCommand.inputs);
	$: activeButtons = ($memoryReadController?.[getControllerIndex($memoryReadController)]?.buttons ?? {}) as Record<keyof ControllerButtons, boolean>;
</script>

<div class="command-row border-secondary">
	<!-- Button icons -->
	<div class="btn-icons">
		{#each selectedInputs as key}
			<img
				class="btn-icon"
				class:btn-icon--active={activeButtons[key]}
				src={`/image/controller-buttons/${filterKey(key)}.svg`}
				alt={filterKey(key)}
				title={filterKey(key)}
			/>
		{/each}
	</div>

	<!-- Command info -->
	<div class="command-info">
		<span class="command-type">{startCase(String(controllerCommand.command.requestType))}</span>
		{#each Object.entries(controllerCommand.command.payload ?? {}) as [k, v]}
			<span class="command-payload">{startCase(k)}: {v}</span>
		{/each}
	</div>

	<!-- Delete -->
	<button class="delete-btn" on:click={() => (isDeleteModalOpen = true)}>×</button>
</div>

<ConfirmModal bind:open={isDeleteModalOpen} on:confirm={deleteCommand}>
	Delete this command?
</ConfirmModal>

<style>
	.command-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.45rem 0.6rem;
		border-radius: 0.25rem;
	}

	.btn-icons {
		display: flex;
		gap: 3px;
		align-items: center;
		flex-shrink: 0;
	}

	.btn-icon {
		width: 1.25rem;
		height: 1.25rem;
		object-fit: contain;
		opacity: 0.35;
		transition: opacity 0.1s;
	}

	.btn-icon--active {
		opacity: 1;
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
		opacity: 0.45;
		color: var(--secondary-color);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.delete-btn {
		font-size: 1rem;
		line-height: 1;
		opacity: 0.35;
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
