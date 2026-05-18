<script lang="ts">
	import { VisibilityToggle } from '$lib/models/types/animationOption';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function select(customElement: any) {
		dispatch('select', customElement);
	}

	export let value: any;
	export let description: string;
	export let selected: VisibilityToggle = VisibilityToggle.Disabled;
</script>

<div class="flex flex-row items-center gap-2">
	<button
		class={`w-80 btn hover:scale-100 text-md whitespace-nowrap h-10 px-2 xl:text-xl border-secondary ${
			selected === VisibilityToggle.False && 'border-danger'
		} ${selected === VisibilityToggle.True && 'border-success'}`}
		style={`${selected === VisibilityToggle.Disabled ? '' : 'border-width: 0.125em'}`}
		on:click={() => {
			select(value);
		}}
	>
		<slot />
	</button>
	<h1 class="text-text-secondary-color text-md font-medium">
		{description}
	</h1>
</div>
