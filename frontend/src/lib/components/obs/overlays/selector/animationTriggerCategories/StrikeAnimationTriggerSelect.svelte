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

	<p class="section-label">Stage Struck</p>
	<SelectAnimationTriggerOption
		description="When any stage is struck"
		value={AnimationTrigger.StrikeAnyStageStruck}
		bind:selected={selectedOption[AnimationTrigger.StrikeAnyStageStruck]}
		on:select={select}
	>
		Any Stage Struck
	</SelectAnimationTriggerOption>
	<SelectAnimationTriggerOption
		description="When Fountain of Dreams is struck"
		value={AnimationTrigger.StrikeFoDStruck}
		bind:selected={selectedOption[AnimationTrigger.StrikeFoDStruck]}
		on:select={select}
	>
		Fountain of Dreams Struck
	</SelectAnimationTriggerOption>
	<SelectAnimationTriggerOption
		description="When Battlefield is struck"
		value={AnimationTrigger.StrikeBFStruck}
		bind:selected={selectedOption[AnimationTrigger.StrikeBFStruck]}
		on:select={select}
	>
		Battlefield Struck
	</SelectAnimationTriggerOption>
	<SelectAnimationTriggerOption
		description="When Final Destination is struck"
		value={AnimationTrigger.StrikeFDStruck}
		bind:selected={selectedOption[AnimationTrigger.StrikeFDStruck]}
		on:select={select}
	>
		Final Destination Struck
	</SelectAnimationTriggerOption>
	<SelectAnimationTriggerOption
		description="When Dream Land is struck"
		value={AnimationTrigger.StrikeDLStruck}
		bind:selected={selectedOption[AnimationTrigger.StrikeDLStruck]}
		on:select={select}
	>
		Dream Land Struck
	</SelectAnimationTriggerOption>
	<SelectAnimationTriggerOption
		description="When Yoshi's Story is struck"
		value={AnimationTrigger.StrikeYSStruck}
		bind:selected={selectedOption[AnimationTrigger.StrikeYSStruck]}
		on:select={select}
	>
		Yoshi's Story Struck
	</SelectAnimationTriggerOption>
	<SelectAnimationTriggerOption
		description="When Pokemon Stadium is struck"
		value={AnimationTrigger.StrikePSStruck}
		bind:selected={selectedOption[AnimationTrigger.StrikePSStruck]}
		on:select={select}
	>
		Pokemon Stadium Struck
	</SelectAnimationTriggerOption>

	<p class="section-label">RPS</p>
	<SelectAnimationTriggerOption
		description="When Player 1 selects their RPS move"
		value={AnimationTrigger.StrikePlayer1RpsSelected}
		bind:selected={selectedOption[AnimationTrigger.StrikePlayer1RpsSelected]}
		on:select={select}
	>
		Player 1 RPS Selected
	</SelectAnimationTriggerOption>
	<SelectAnimationTriggerOption
		description="When Player 2 selects their RPS move"
		value={AnimationTrigger.StrikePlayer2RpsSelected}
		bind:selected={selectedOption[AnimationTrigger.StrikePlayer2RpsSelected]}
		on:select={select}
	>
		Player 2 RPS Selected
	</SelectAnimationTriggerOption>
	<SelectAnimationTriggerOption
		description="When either player selects their RPS move"
		value={AnimationTrigger.StrikeEitherRpsSelected}
		bind:selected={selectedOption[AnimationTrigger.StrikeEitherRpsSelected]}
		on:select={select}
	>
		Either Player RPS Selected
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
