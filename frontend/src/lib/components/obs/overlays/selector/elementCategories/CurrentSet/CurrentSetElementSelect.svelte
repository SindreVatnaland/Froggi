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
		description="Ongoing Set Game Mode - Local/Direct/Unranked/Ranked"
		value={CustomElement.MatchGameMode}
		on:select={select}
	>
		Game Mode
	</SelectOption>
	<SelectOption
		description="Ongoing Set Best Of - 3/5"
		value={CustomElement.MatchBestOf}
		on:select={select}
	>
		Best Of
	</SelectOption>
</div>
