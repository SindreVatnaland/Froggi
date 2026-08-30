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
	description="When Player1 Takes Damage"
	value={AnimationTrigger.InGamePlayer1Percent}
	bind:selected={selectedOption[AnimationTrigger.InGamePlayer1Percent]}
	on:select={select}
>
	Damage Increase
</SelectAnimationTriggerOption>

<SelectAnimationTriggerOption
	description="When Player1 Loses A Stock"
	value={AnimationTrigger.InGamePlayer1StockLost}
	bind:selected={selectedOption[AnimationTrigger.InGamePlayer1StockLost]}
	on:select={select}
>
	Stock Lost
</SelectAnimationTriggerOption>

<SelectAnimationTriggerOption
	description="When Player 1 Changes Character (Zelda-Sheik)"
	value={AnimationTrigger.InGamePlayer1CharacterChange}
	bind:selected={selectedOption[AnimationTrigger.InGamePlayer1CharacterChange]}
	on:select={select}
>
	Character Change
</SelectAnimationTriggerOption>

<SelectAnimationTriggerOption
	description="When Player 1's action state changes"
	value={AnimationTrigger.InGamePlayer1StateChange}
	bind:selected={selectedOption[AnimationTrigger.InGamePlayer1StateChange]}
	on:select={select}
>
	State Change
</SelectAnimationTriggerOption>

<SelectAnimationTriggerOption
	description="When Player 1 performs a new technique"
	value={AnimationTrigger.InGamePlayer1TechniqueChange}
	bind:selected={selectedOption[AnimationTrigger.InGamePlayer1TechniqueChange]}
	on:select={select}
>
	Technique Change
</SelectAnimationTriggerOption>
