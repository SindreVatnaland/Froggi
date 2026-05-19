<script lang="ts">
	import Modal from '$lib/components/modal/Modal.svelte';
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import type { ControllerButtons } from '$lib/models/types/controller';
	import { Command, CommandType, type ControllerCommand } from '$lib/models/types/commandTypes';
	import { getOverlappingCommands } from '$lib/utils/controllerCommandHelper';
	import { electronEmitter, controller } from '$lib/utils/store.svelte';
	import CommandSelect from '../ObsCommands/CommandSelect.svelte';

	export let open: boolean;

	let controllerCommand: ControllerCommand = makeEmpty();

	function makeEmpty(): ControllerCommand {
		return {
			id: '',
			inputs: {
				isAPressed: false, isBPressed: false,
				isDPadLeftPressed: false, isDPadRightPressed: false,
				isDPadUpPressed: false, isDPadDownPressed: false,
				isLPressed: false, isRPressed: false, isStartPressed: false,
				isXPressed: false, isYPressed: false, isZPressed: false,
			},
			command: { id: '', requestType: 'SaveReplayBuffer', payload: undefined, type: CommandType.Obs } as Command,
		};
	}

	$: if (open) controllerCommand = makeEmpty();

	$: overlapping = getOverlappingCommands($controller.inputCommands, controllerCommand.inputs);
	$: selectedKeys = (Object.entries(controllerCommand.inputs)
		.filter(([, v]) => v)
		.map(([k]) => k)) as (keyof ControllerButtons)[];
	$: hasSelection = selectedKeys.length > 0;

	const filterKey = (key: string) => {
		const match = key.match(/is(.*?)Pressed/);
		return match ? match[1] : key;
	};

	const getKeys = (): (keyof ControllerButtons)[] =>
		Object.keys(controllerCommand.inputs) as (keyof ControllerButtons)[];

	const addCommand = () => {
		if (!hasSelection) return;
		$electronEmitter.emit('ControllerCommandAdd', controllerCommand);
		notifications.success('Command added', 1500);
		open = false;
	};
</script>

<Modal bind:open on:close={() => (open = false)}>
	<div class="modal-box background-primary-color border-secondary text-secondary-color">
		<p class="modal-title">Add Controller Command</p>
		<p class="modal-desc">Select a button combination, then choose the OBS action to trigger.</p>

		<!-- Button grid -->
		<div class="btn-grid">
			{#each getKeys() as key}
				<label class="btn-item" class:btn-item--active={controllerCommand.inputs[key]}>
					<img
						class="btn-img"
						src={`/image/controller-buttons/${filterKey(key)}.svg`}
						alt={filterKey(key)}
					/>
					<input
						type="checkbox"
						class="sr-only"
						bind:checked={controllerCommand.inputs[key]}
					/>
				</label>
			{/each}
		</div>

		<!-- Selected preview -->
		{#if hasSelection}
			<div class="selected-row">
				<span class="selected-label">Combo:</span>
				<div class="selected-icons">
					{#each selectedKeys as key}
						<img
							class="btn-img"
							src={`/image/controller-buttons/${filterKey(key)}.svg`}
							alt={filterKey(key)}
						/>
					{/each}
				</div>
			</div>

			{#if overlapping.length > 0}
				<p class="overlap-warn">⚠ Overlaps with {overlapping.length} existing command{overlapping.length > 1 ? 's' : ''}</p>
			{/if}
		{/if}

		<!-- Command select -->
		<div class="command-select-wrap" class:faded={!hasSelection}>
			<CommandSelect bind:command={controllerCommand.command} />
		</div>

		<!-- Actions -->
		<div class="modal-actions">
			<button class="btn text-sm h-9 px-5 border-secondary rounded" on:click={() => (open = false)}>
				Cancel
			</button>
			<button
				class="btn text-sm h-9 px-5 border-secondary rounded confirm-ok"
				disabled={!hasSelection}
				on:click={addCommand}
			>
				Add Command
			</button>
		</div>
	</div>
</Modal>

<style>
	.modal-box {
		padding: 1.25rem 1.5rem;
		width: min(90vw, 380px);
		display: flex;
		flex-direction: column;
		gap: 1rem;
		border-radius: 0.25rem;
		max-height: 85vh;
		overflow-y: auto;
	}

	.modal-title {
		font-size: 0.95rem;
		font-weight: 600;
	}

	.modal-desc {
		font-size: 0.75rem;
		opacity: 0.45;
		line-height: 1.5;
		margin-top: -0.5rem;
	}

	.btn-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.4rem;
	}

	.btn-item {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.4rem;
		border-radius: 0.25rem;
		cursor: pointer;
		opacity: 0.3;
		border: 1px solid transparent;
		transition: opacity 0.15s, border-color 0.15s;
	}

	.btn-item:hover {
		opacity: 0.6;
	}

	.btn-item--active {
		opacity: 1;
		border-color: var(--secondary-color);
		background: rgba(128, 128, 128, 0.1);
	}

	.btn-img {
		width: 1.75rem;
		height: 1.75rem;
		object-fit: contain;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
	}

	.selected-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.selected-label {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: 0.4;
		flex-shrink: 0;
	}

	.selected-icons {
		display: flex;
		gap: 3px;
		flex-wrap: wrap;
	}

	.overlap-warn {
		font-size: 0.75rem;
		color: rgb(234, 179, 8);
		opacity: 0.85;
	}

	.command-select-wrap {
		transition: opacity 0.2s;
	}

	.faded {
		opacity: 0.4;
		pointer-events: none;
	}

	.modal-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.confirm-ok {
		background-color: var(--secondary-color);
		color: var(--primary-color);
	}

	.confirm-ok:disabled {
		opacity: 0.4;
	}
</style>
