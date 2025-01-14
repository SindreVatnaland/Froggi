<script lang="ts">
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { SelectedAnimationTriggerCondition } from '$lib/models/types/animationOption';
	import { fly } from 'svelte/transition';
	import AnimationTriggerCategorySelect from './animationTriggerCategories/AnimationTriggerCategorySelect.svelte';
	import { createEventDispatcher } from 'svelte';

	export let selectedOption: SelectedAnimationTriggerCondition;
	let tempSelectedOptions = selectedOption;
	let open: boolean = false;

	const dispatch = createEventDispatcher();

	function handleUpdate() {
		dispatch('update', tempSelectedOptions);
		open = false;
	}

	$: tempActiveOption = Object.entries(tempSelectedOptions)
		.filter(([_, value]) => value)
		.map(([key]) => key);
</script>

<div class="grid grid-flow-col gap-2 items-center">
	<button
		class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap w-full h-10 px-2 xl:text-xl border-secondary"
		on:click={() => (open = true)}
	>
		Apply Animation Triggers
	</button>
</div>

<Modal bind:open on:close={() => (open = false)}>
	<div
		class="w-[80vw] h-[80vh] bg-cover bg-center p-4 overflow-auto flex flex-col gap-4 background-primary-color"
	>
		<div class="flex-1 overflow-auto">
			<AnimationTriggerCategorySelect bind:selectedOption={tempSelectedOptions} />
		</div>

		<h1 class="color-secondary text-sm font-bold">Triggers:</h1>
		{#if tempActiveOption.length}
			<div
				in:fly={{ duration: 250, x: 100, delay: 250 }}
				out:fly={{ duration: 250, x: 100 }}
				class="max-h-24 overflow-auto"
			>
				{#each tempActiveOption as activeOption, i}
					<span class="color-secondary text-sm"><b>{activeOption}</b></span>
					{#if tempActiveOption.length != i + 1}
						<span class="color-secondary text-sm">{'or '}</span>
					{/if}
				{/each}
			</div>
		{/if}

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
