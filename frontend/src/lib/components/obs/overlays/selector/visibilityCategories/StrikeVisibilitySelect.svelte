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

<div class="flex flex-col gap-2">
	<p class="section-label">Phase</p>
	<SelectOption
		description="During Rock Paper Scissors"
		value={VisibilityOption.StrikePhaseRps}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikePhaseRps]}
		on:select={select}
	>
		Phase: RPS
	</SelectOption>
	<SelectOption
		description="During stage striking"
		value={VisibilityOption.StrikePhaseStriking}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikePhaseStriking]}
		on:select={select}
	>
		Phase: Striking
	</SelectOption>
	<SelectOption
		description="During character select"
		value={VisibilityOption.StrikePhaseCharSelect}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikePhaseCharSelect]}
		on:select={select}
	>
		Phase: Char Select
	</SelectOption>
	<SelectOption
		description="While a game is in progress"
		value={VisibilityOption.StrikePhasePlaying}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikePhasePlaying]}
		on:select={select}
	>
		Phase: Playing
	</SelectOption>
	<SelectOption
		description="When the set is complete"
		value={VisibilityOption.StrikePhaseComplete}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikePhaseComplete]}
		on:select={select}
	>
		Phase: Complete
	</SelectOption>

	<p class="section-label">Turn</p>
	<SelectOption
		description="When it is Player 1's turn to strike"
		value={VisibilityOption.StrikeIsPlayer1Turn}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikeIsPlayer1Turn]}
		on:select={select}
	>
		Player 1 Turn
	</SelectOption>
	<SelectOption
		description="When it is Player 2's turn to strike"
		value={VisibilityOption.StrikeIsPlayer2Turn}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikeIsPlayer2Turn]}
		on:select={select}
	>
		Player 2 Turn
	</SelectOption>

	<p class="section-label">Stage</p>
	<SelectOption
		description="When a final stage has been selected"
		value={VisibilityOption.StrikeIsStageFinal}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikeIsStageFinal]}
		on:select={select}
	>
		Stage Final
	</SelectOption>

	<p class="section-label">Selections</p>
	<SelectOption
		description="When Player 1 has made their RPS choice"
		value={VisibilityOption.StrikePlayer1RpsSelected}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikePlayer1RpsSelected]}
		on:select={select}
	>
		P1 RPS Selected
	</SelectOption>
	<SelectOption
		description="When Player 2 has made their RPS choice"
		value={VisibilityOption.StrikePlayer2RpsSelected}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikePlayer2RpsSelected]}
		on:select={select}
	>
		P2 RPS Selected
	</SelectOption>
	<SelectOption
		description="When Player 1 has selected their character"
		value={VisibilityOption.StrikePlayer1CharacterSelected}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikePlayer1CharacterSelected]}
		on:select={select}
	>
		P1 Character Selected
	</SelectOption>
	<SelectOption
		description="When Player 2 has selected their character"
		value={VisibilityOption.StrikePlayer2CharacterSelected}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikePlayer2CharacterSelected]}
		on:select={select}
	>
		P2 Character Selected
	</SelectOption>
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
