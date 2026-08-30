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
	description="When Player2 Takes Damage"
	value={AnimationTrigger.InGamePlayer2Percent}
	bind:selected={selectedOption[AnimationTrigger.InGamePlayer2Percent]}
	on:select={select}
>
	Damage Increase
</SelectAnimationTriggerOption>

<SelectAnimationTriggerOption
	description="When Player2 Loses A Stock"
	value={AnimationTrigger.InGamePlayer2StockLost}
	bind:selected={selectedOption[AnimationTrigger.InGamePlayer2StockLost]}
	on:select={select}
>
	Stock Lost
</SelectAnimationTriggerOption>

<SelectAnimationTriggerOption
	description="When Player 2 Changes Character (Zelda-Sheik)"
	value={AnimationTrigger.InGamePlayer2CharacterChange}
	bind:selected={selectedOption[AnimationTrigger.InGamePlayer2CharacterChange]}
	on:select={select}
>
	Character Change
</SelectAnimationTriggerOption>

<SelectAnimationTriggerOption
	description="When Player 2's action state changes"
	value={AnimationTrigger.InGamePlayer2StateChange}
	bind:selected={selectedOption[AnimationTrigger.InGamePlayer2StateChange]}
	on:select={select}
>
	State Change
</SelectAnimationTriggerOption>

<SelectAnimationTriggerOption
	description="When Player 2 performs a new technique"
	value={AnimationTrigger.InGamePlayer2TechniqueChange}
	bind:selected={selectedOption[AnimationTrigger.InGamePlayer2TechniqueChange]}
	on:select={select}
>
	Technique Change
</SelectAnimationTriggerOption>
