<script lang="ts">
	import AddControllerCommandModal from '$lib/components/dashboard/Modals/AddControllerCommandModal.svelte';
	import ButtonCommand from '$lib/components/dashboard/ObsCommands/ButtonCommand.svelte';
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { electronEmitter, controller } from '$lib/utils/store.svelte';

	let isAddModalOpen = false;

	const toggleController = () => {
		$electronEmitter.emit('ControllerCommandStateToggle');
		notifications.success(`Controller commands ${$controller.enabled ? 'disabled' : 'enabled'}`, 1500);
	};
</script>

<div class="controller-commands">
	<!-- Enable toggle -->
	<label class="toggle-row border-secondary">
		<span class="toggle-label text-secondary-color">Enable controller commands</span>
		<input
			type="checkbox"
			class="toggle-check"
			checked={$controller.enabled}
			on:change={toggleController}
		/>
	</label>

	<!-- Command list -->
	<div class="commands-list" class:commands-list--off={!$controller.enabled}>
		{#if $controller?.inputCommands?.length}
			{#each $controller.inputCommands as cmd}
				<ButtonCommand controllerCommand={cmd} />
			{/each}
		{:else}
			<p class="empty-hint">No commands yet. Add a button combo below.</p>
		{/if}

		<button class="add-btn btn border-secondary rounded text-xs h-8 px-4 w-full mt-1" on:click={() => (isAddModalOpen = true)}>
			+ Add Command
		</button>
	</div>
</div>

<AddControllerCommandModal bind:open={isAddModalOpen} />

<style>
	.controller-commands {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
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

	.commands-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		transition: opacity 0.2s;
	}

	.commands-list--off {
		opacity: 0.4;
		pointer-events: none;
	}

	.empty-hint {
		font-size: 0.75rem;
		opacity: 0.35;
		padding: 0.25rem 0;
	}

	.add-btn {
		margin-top: 0.25rem;
	}
</style>
