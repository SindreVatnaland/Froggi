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
	description="If The Next Ranked Game Is A Promotion Game"
	value={VisibilityOption.RankPredictionIsPromotionGame}
	bind:selected={selectedVisibilityOption[VisibilityOption.RankPredictionIsPromotionGame]}
	on:select={select}
>
	Is Promotion Game
</SelectOption>

<SelectOption
	description="If The Next Ranked Game Is A Demotion Game"
	value={VisibilityOption.RankPredictionIsDemotionGame}
	bind:selected={selectedVisibilityOption[VisibilityOption.RankPredictionIsDemotionGame]}
	on:select={select}
>
	Is Demotion Game
</SelectOption>
