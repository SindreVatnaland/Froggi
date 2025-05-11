<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import SelectOption from './SelectVisibilityOption.svelte';
	import {
		VisibilityOption,
		type SelectedVisibilityCondition,
	} from '$lib/models/types/animationOption';

	export let selectedVisibilityOption: SelectedVisibilityCondition;
	const dispatch = createEventDispatcher();

	function select(event: CustomEvent<VisibilityOption>) {
		dispatch('select', event.detail);
	}
</script>

<SelectOption
	description="While Player Game 1"
	value={VisibilityOption.InGameIsGame1}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGameIsGame1]}
	on:select={select}
>
	Game 1
</SelectOption>
<SelectOption
	description="While Player Game 2"
	value={VisibilityOption.InGameIsGame2}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGameIsGame2]}
	on:select={select}
>
	Game 2
</SelectOption>
<SelectOption
	description="While Player Game 3"
	value={VisibilityOption.InGameIsGame3}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGameIsGame3]}
	on:select={select}
>
	Game 3
</SelectOption>
<SelectOption
	description="While Player Game 4"
	value={VisibilityOption.InGameIsGame4}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGameIsGame4]}
	on:select={select}
>
	Game 4
</SelectOption>
<SelectOption
	description="While Player Game 5"
	value={VisibilityOption.InGameIsGame5}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGameIsGame5]}
	on:select={select}
>
	Game 5
</SelectOption>
