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
	description="When Player1 Connect Code Changes"
	value={AnimationTrigger.SlippiRankPlayer1ConnectCodeChange}
	bind:selected={selectedOption[AnimationTrigger.SlippiRankPlayer1ConnectCodeChange]}
	on:select={select}
>
	Connect Code Change
</SelectAnimationTriggerOption>

<SelectAnimationTriggerOption
	description="When Player1 Rating Changes"
	value={AnimationTrigger.SlippiRankPlayer1RatingChange}
	bind:selected={selectedOption[AnimationTrigger.SlippiRankPlayer1RatingChange]}
	on:select={select}
>
	Rating Change
</SelectAnimationTriggerOption>

<SelectAnimationTriggerOption
	description="When Player1 Rank Changes"
	value={AnimationTrigger.SlippiRankPlayer1RankChange}
	bind:selected={selectedOption[AnimationTrigger.SlippiRankPlayer1RankChange]}
	on:select={select}
>
	Rank Change
</SelectAnimationTriggerOption>
