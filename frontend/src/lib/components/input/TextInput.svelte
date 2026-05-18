<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let value: string = '';
	export let label: string | undefined = undefined;
	export let autofocus: number | undefined = undefined;
	export let autoFocusValue: number | undefined = undefined;
	export let placeholder: string | undefined = undefined;

	const dispatch = createEventDispatcher();

	function handleChange(value: string | null) {
		dispatch('change', value);
	}
</script>

<div class="w-full">
	{#if label}
		<h1 class="text-sm font-medium text-secondary-color">{label}</h1>
	{/if}
	<div class="h-10 flex items-center">
		<input
			on:focus={() => (autofocus = autoFocusValue)}
			{placeholder}
			type="text"
			class="w-full h-full pl-2 appearance-none border-secondary background-primary-color text-secondary-color rounded-md"
			bind:value
			on:change={(e) => {
				handleChange(value);
			}}
		/>
	</div>
</div>
