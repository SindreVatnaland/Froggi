<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let min = 0;
	export let max = 1;
	export let step = 0.01;
	export let value: number = 0;
	export let valueConcat: string = '';
	export let stringFormat: string = '{0}';
	export let label: string | undefined = undefined;

	const dispatch = createEventDispatcher();

	function handleChange(value: number) {
		dispatch('change', value);
	}

	const updateConcatValue = (value: number) => {
		valueConcat = String.format(stringFormat, value);
	};
	$: updateConcatValue(value);
</script>

<div class="w-full">
	{#if label}
		<h1 class="text-secondary-color text-sm font-medium">{label}</h1>
	{/if}
	<div class="h-10 flex items-center">
		<input
			type="range"
			class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer background-secondary-color"
			{step}
			{min}
			{max}
			bind:value
			on:change={() => handleChange(value)}
		/>
	</div>
</div>
