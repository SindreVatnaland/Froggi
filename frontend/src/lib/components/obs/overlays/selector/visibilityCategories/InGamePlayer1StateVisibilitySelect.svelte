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
	description="When Player 1 Is Alive"
	value={VisibilityOption.InGamePlayer1Alive}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGamePlayer1Alive]}
	on:select={select}
>
	Player 1 Alive
</SelectOption>
<SelectOption
	description="When Player 1 Is Entering On Halo"
	value={VisibilityOption.InGamePlayer1EnteringHalo}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGamePlayer1EnteringHalo]}
	on:select={select}
>
	Player 1 Entering Halo
</SelectOption>
<SelectOption
	description="When Player 1 Is Off Stage"
	value={VisibilityOption.InGamePlayer1OffStage}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGamePlayer1OffStage]}
	on:select={select}
>
	Player 1 Off Stage
</SelectOption>
<SelectOption
	description="When Player 1 Has 1 Stock Or More"
	value={VisibilityOption.InGamePlayer1Stock1}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGamePlayer1Stock1]}
	on:select={select}
>
	Player 1 Stock 1
</SelectOption>
<SelectOption
	description="When Player 1 Has 2 Stock Or More"
	value={VisibilityOption.InGamePlayer1Stock2}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGamePlayer1Stock2]}
	on:select={select}
>
	Player 1 Stock 2
</SelectOption>
<SelectOption
	description="When Player 1 Has 3 Stock Or More"
	value={VisibilityOption.InGamePlayer1Stock3}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGamePlayer1Stock3]}
	on:select={select}
>
	Player 1 Stock 3
</SelectOption>
<SelectOption
	description="When Player 1 Has 4 Stock Or More"
	value={VisibilityOption.InGamePlayer1Stock4}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGamePlayer1Stock4]}
	on:select={select}
>
	Player 1 Stock 4
</SelectOption>
<SelectOption
	description="When Player 1 Combo Counter Is 3 Or More"
	value={VisibilityOption.InGamePlayer1Combo}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGamePlayer1Combo]}
	on:select={select}
>
	Player 1 Combo
</SelectOption>
