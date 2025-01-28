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
	description="When Player2 Connect Code Changes"
	value={AnimationTrigger.SlippiRankPlayer2ConnectCodeChange}
	bind:selected={selectedOption[AnimationTrigger.SlippiRankPlayer2ConnectCodeChange]}
	on:select={select}
>
	Connect Code Change
</SelectAnimationTriggerOption>

<SelectAnimationTriggerOption
	description="When Player2 Rating Changes"
	value={AnimationTrigger.SlippiRankPlayer2RatingChange}
	bind:selected={selectedOption[AnimationTrigger.SlippiRankPlayer2RatingChange]}
	on:select={select}
>
	Rating Change
</SelectAnimationTriggerOption>

<SelectAnimationTriggerOption
	description="When Player2 Rank Changes"
	value={AnimationTrigger.SlippiRankPlayer2RankChange}
	bind:selected={selectedOption[AnimationTrigger.SlippiRankPlayer2RankChange]}
	on:select={select}
>
	Rank Change
</SelectAnimationTriggerOption>
