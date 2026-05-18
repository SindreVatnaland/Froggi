<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let selected: any = undefined;
	export let label: string | undefined = undefined;

	const dispatch = createEventDispatcher();

	function change() {
		dispatch('change', selected);
	}
</script>

<div class="w-full">
	{#if label}
		<h1 class="text-sm font-medium text-secondary-color">{label}</h1>
	{/if}
	<div class="w-full flex justify-center items-center">
		<select
			id="dropdown"
			class="w-full rounded-md background-primary-color border-secondary text-secondary-color text-sm block p-2.5"
			bind:value={selected}
			on:change={change}
		>
			<slot />
		</select>
	</div>
</div>
