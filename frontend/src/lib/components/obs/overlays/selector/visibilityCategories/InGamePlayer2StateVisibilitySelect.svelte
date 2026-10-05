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
	description="When Player 2 Is Alive"
	value={VisibilityOption.InGamePlayer2Alive}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGamePlayer2Alive]}
	on:select={select}
>
	Player 2 Alive
</SelectOption>
<SelectOption
	description="When Player 2 Is Entering On Halo"
	value={VisibilityOption.InGamePlayer2EnteringHalo}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGamePlayer2EnteringHalo]}
	on:select={select}
>
	Player 2 Entering Halo
</SelectOption>
<SelectOption
	description="When Player 2 Is Off Stage"
	value={VisibilityOption.InGamePlayer2OffStage}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGamePlayer2OffStage]}
	on:select={select}
>
	Player 2 Off Stage
</SelectOption>
<SelectOption
	description="When Player 2 Is Left Of The Stage Center (combine with Off Stage for a left-side radar)"
	value={VisibilityOption.InGamePlayer2LeftSide}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGamePlayer2LeftSide]}
	on:select={select}
>
	Player 2 Left Side
</SelectOption>
<SelectOption
	description="When Player 2 Is Right Of The Stage Center (combine with Off Stage for a right-side radar)"
	value={VisibilityOption.InGamePlayer2RightSide}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGamePlayer2RightSide]}
	on:select={select}
>
	Player 2 Right Side
</SelectOption>
<SelectOption
	description="When Player 2 Has 1 Stock Or More"
	value={VisibilityOption.InGamePlayer2Stock1}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGamePlayer2Stock1]}
	on:select={select}
>
	Player 2 Stock 1
</SelectOption>
<SelectOption
	description="When Player 2 Has 2 Stock Or More"
	value={VisibilityOption.InGamePlayer2Stock2}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGamePlayer2Stock2]}
	on:select={select}
>
	Player 2 Stock 2
</SelectOption>
<SelectOption
	description="When Player 2 Has 3 Stock Or More"
	value={VisibilityOption.InGamePlayer2Stock3}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGamePlayer2Stock3]}
	on:select={select}
>
	Player 2 Stock 3
</SelectOption>
<SelectOption
	description="When Player 2 Has 4 Stock Or More"
	value={VisibilityOption.InGamePlayer2Stock4}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGamePlayer2Stock4]}
	on:select={select}
>
	Player 2 Stock 4
</SelectOption>
<SelectOption
	description="When Player 2 Combo Counter Is 3 Or More"
	value={VisibilityOption.InGamePlayer2Combo}
	bind:selected={selectedVisibilityOption[VisibilityOption.InGamePlayer2Combo]}
	on:select={select}
>
	Player 2 Combo
</SelectOption>
