<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import { createEventDispatcher } from 'svelte';
	import SelectOption from '../../visibilityCategories/SelectVisibilityOption.svelte';

	const dispatch = createEventDispatcher();

	function select(customElement: CustomEvent<CustomElement>) {
		dispatch('select', customElement.detail);
	}
</script>

<div class="flex flex-col gap-2">
	<SelectOption
		description="Iron Man rosters — each player's characters, progress count and progress bar (live session)"
		value={CustomElement.IronManRoster}
		on:select={select}
	>
		Iron Man Roster
	</SelectOption>
</div>
