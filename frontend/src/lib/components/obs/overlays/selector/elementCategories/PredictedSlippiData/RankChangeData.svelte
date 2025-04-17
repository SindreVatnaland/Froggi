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
		description="Current Player Potential Slippi Rating Lost After Match"
		value={CustomElement.SlippiRankChangeRatingDifference}
		on:select={select}
	>
		Rating Difference
	</SelectOption>
</div>
