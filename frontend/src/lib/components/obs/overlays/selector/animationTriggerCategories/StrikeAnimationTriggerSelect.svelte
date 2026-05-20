<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import SelectAnimationTriggerOption from './SelectAnimationTriggerOption.svelte';

	import { AnimationTrigger, type SelectedAnimationTriggerCondition } from '$lib/models/types/animationOption';

	export let selectedOption: SelectedAnimationTriggerCondition;
	const dispatch = createEventDispatcher();

	function select(event: CustomEvent<AnimationTrigger>) {
		dispatch('select', event.detail);
	}
</script>

<div class="flex flex-col gap-2">
	<p class="section-label">Striker</p>
	<SelectAnimationTriggerOption
		description="When the current striker changes"
		value={AnimationTrigger.StrikeCurrentStrikerChange}
		bind:selected={selectedOption[AnimationTrigger.StrikeCurrentStrikerChange]}
		on:select={select}
	>
		Current Striker Change
	</SelectAnimationTriggerOption>

	<p class="section-label">Character</p>
	<SelectAnimationTriggerOption
		description="When Player 1 selects a character"
		value={AnimationTrigger.StrikePlayer1CharChange}
		bind:selected={selectedOption[AnimationTrigger.StrikePlayer1CharChange]}
		on:select={select}
	>
		Player 1 Character Change
	</SelectAnimationTriggerOption>
	<SelectAnimationTriggerOption
		description="When Player 2 selects a character"
		value={AnimationTrigger.StrikePlayer2CharChange}
		bind:selected={selectedOption[AnimationTrigger.StrikePlayer2CharChange]}
		on:select={select}
	>
		Player 2 Character Change
	</SelectAnimationTriggerOption>
</div>

<style>
	.section-label {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		opacity: 0.4;
		margin-top: 0.25rem;
	}
</style>
