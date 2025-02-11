<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import {
		AnimationTrigger,
		type SelectedAnimationTriggerCondition,
	} from '$lib/models/types/animationOption';
	import SelectAnimationTriggerOption from './SelectAnimationTriggerOption.svelte';

	export let selectedOption: SelectedAnimationTriggerCondition;
	const dispatch = createEventDispatcher();

	function select(event: CustomEvent<AnimationTrigger>) {
		dispatch('select', event.detail);
	}
</script>

<SelectAnimationTriggerOption
	description="When Win Number Changes"
	value={AnimationTrigger.SlippiRankStatsWinsChange}
	bind:selected={selectedOption[AnimationTrigger.SlippiRankStatsWinsChange]}
	on:select={select}
>
	Wins Change
</SelectAnimationTriggerOption>
<SelectAnimationTriggerOption
	description="When Loss Number Changes"
	value={AnimationTrigger.SlippiRankStatsLossesChange}
	bind:selected={selectedOption[AnimationTrigger.SlippiRankStatsLossesChange]}
	on:select={select}
>
	Losses Change
</SelectAnimationTriggerOption>
<SelectAnimationTriggerOption
	description="When Rank Changes"
	value={AnimationTrigger.SlippiRankStatsRankChange}
	bind:selected={selectedOption[AnimationTrigger.SlippiRankStatsRankChange]}
	on:select={select}
>
	Rank Change
</SelectAnimationTriggerOption>
<SelectAnimationTriggerOption
	description="When Rank Rating Changes"
	value={AnimationTrigger.SlippiRankStatsRatingChange}
	bind:selected={selectedOption[AnimationTrigger.SlippiRankStatsRatingChange]}
	on:select={select}
>
	Rating Change
</SelectAnimationTriggerOption>

<SelectAnimationTriggerOption
	description="When Rank Rating Diff Changes"
	value={AnimationTrigger.SlippiRankStatsRatingDifferenceChange}
	bind:selected={selectedOption[AnimationTrigger.SlippiRankStatsRatingDifferenceChange]}
	on:select={select}
>
	Rating Diff Change
</SelectAnimationTriggerOption>
