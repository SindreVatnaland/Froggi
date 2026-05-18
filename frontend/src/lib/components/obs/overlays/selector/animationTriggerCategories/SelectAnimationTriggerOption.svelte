<script lang="ts">
	import type { CustomElement } from '$lib/models/constants/customElement';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function select(customElement: CustomElement) {
		dispatch('select', customElement);
	}

	export let value: any;
	export let description: string;
	export let selected: boolean = false;
</script>

<div class="flex flex-row items-center gap-2">
	<button
		class={`w-80 btn hover:scale-105 text-md whitespace-nowrap h-10 px-2 xl:text-xl ${
			selected ? 'border-success bg-opacity-50' : 'border-secondary'
		}`}
		style={`${selected ? 'border-width: 0.125em' : ''}`}
		on:click={() => {
			select(value);
		}}
	>
		<slot />
	</button>
	<h1 class="text-secondary-color text-md font-medium">
		{description}
	</h1>
</div>
