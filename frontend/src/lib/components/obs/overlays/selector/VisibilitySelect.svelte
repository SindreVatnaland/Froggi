<script lang="ts">
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { SelectedVisibilityCondition } from '$lib/models/types/animationOption';
	import VisibilityCategorySelect from './visibilityCategories/VisibilityCategorySelect.svelte';
	import { createEventDispatcher } from 'svelte';
	import { fly } from 'svelte/transition';

	export let selectedVisibilityOptions: SelectedVisibilityCondition[] = [];
	let tempSelectedOptions: SelectedVisibilityCondition[] = selectedVisibilityOptions;
	let open: boolean = false;

	const addNewCondition = () => {
		tempSelectedOptions = [...tempSelectedOptions, {} as SelectedVisibilityCondition];
		setTimeout(scrollDown);
	};

	const removeOption = (index: number) => {
		tempSelectedOptions = tempSelectedOptions.filter((_, i: number) => i !== index);
	};

	const dispatch = createEventDispatcher();

	function handleUpdate() {
		dispatch('update', tempSelectedOptions);
		open = false;
	}

	$: tempActiveConditions = Object.entries(tempSelectedOptions).map(([_, value]) => {
		return Object.entries(value)
			.filter(([_, value]) => value > 0)
			.map(([key, value]) => {
				return { title: key, value: value };
			});
	});

	const scrollDown = () => {
		visibilitySelect.scroll({ top: visibilitySelect.scrollHeight, behavior: 'smooth' });
	};

	let visibilitySelect: HTMLElement;
</script>

<div class="grid grid-flow-col gap-2 items-center">
	<button
		class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap w-full h-10 px-2 xl:text-xl border-secondary"
		on:click={() => (open = true)}
	>
		Apply Visibility Conditions
	</button>
</div>

<Modal bind:open on:close={() => (open = false)}>
	<div
		class="w-[80vw] h-[80vh] bg-cover bg-center p-4 gap-8 background-primary-color flex flex-col justify-between"
	>
		<h1 class="color-secondary font-bold text-lg">Visibility Conditions</h1>
		<div class="flex-1 flex-col max-h-full overflow-auto gap-2" bind:this={visibilitySelect}>
			{#each tempSelectedOptions as option, i (i)}
				<div
					transition:fly={{ duration: 250, x: 150 }}
					class="border-t border-b border-secondary-color flex-1 flex flex-col gap-4"
				>
					<div class="flex flex-col gap-2">
						<div>
							<VisibilityCategorySelect bind:selectedVisibilityOption={option} />
						</div>

						{#if tempActiveConditions[i].length}
							<div
								in:fly={{ duration: 250, x: 100, delay: 250 }}
								out:fly={{ duration: 250, x: 100 }}
							>
								<h1 class="color-secondary text-sm font-bold">Condition:</h1>
								{#each tempActiveConditions[i] as activeCondition, j}
									<h1 class="color-secondary text-sm">{activeCondition.title}</h1>
									{#if tempActiveConditions[i].length != j + 1}
										<h1 class="color-secondary text-sm">or</h1>
									{/if}
								{/each}
							</div>
						{/if}
					</div>

					{#if tempSelectedOptions.length}
						<div class="w-48 flex items-end">
							<button
								class="w-full transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-12 px-2 xl:text-xl border-secondary"
								on:click={() => removeOption(i)}
							>
								Delete
							</button>
						</div>
					{/if}
					<br />
				</div>
			{/each}
		</div>
		<div class="w-48 flex items-end">
			<button
				class="w-full transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-12 px-2 xl:text-xl border-secondary"
				on:click={addNewCondition}
			>
				New Condition
			</button>
		</div>

		<div>
			{#if tempActiveConditions.length}
				<h1 class="color-secondary font-bold">Combined conditions:</h1>
			{/if}
			<div class="max-h-28 overflow-auto">
				{#each tempActiveConditions as activeConditions, i}
					<h1 class="color-secondary text-sm">
						{#each activeConditions as activeCondition, j}
							<span>{activeCondition.value === 2 ? ' Not' : ''}</span>
							{activeCondition.title}
							{#if activeConditions.length != j + 1}
								<span class="color-secondary text-sm">or</span>
							{/if}
						{/each}
					</h1>
					{#if tempActiveConditions.length != i + 1 && tempActiveConditions?.[i + 1]?.length}
						<h1 class="color-secondary text-sm">and</h1>
					{/if}
				{/each}
			</div>
		</div>

		<div class="w-48 flex items-end">
			<button
				class="w-full transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-12 px-2 xl:text-xl border-secondary"
				on:click={handleUpdate}
			>
				Update
			</button>
		</div>
	</div>
</Modal>
