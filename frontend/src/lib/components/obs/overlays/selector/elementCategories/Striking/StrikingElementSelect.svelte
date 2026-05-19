<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import { createEventDispatcher } from 'svelte';
	import SelectOption from '../../visibilityCategories/SelectVisibilityOption.svelte';

	const dispatch = createEventDispatcher();

	function select(customElement: CustomEvent<CustomElement>) {
		dispatch('select', customElement.detail);
	}
</script>

<div class="flex flex-col gap-2">
	<p class="section-label">RPS</p>
	<SelectOption
		description="Player 1's Rock/Paper/Scissors choice"
		value={CustomElement.StrikeRpsPlayer1Choice}
		on:select={select}
	>
		P1 RPS Choice
	</SelectOption>
	<SelectOption
		description="Player 2's Rock/Paper/Scissors choice"
		value={CustomElement.StrikeRpsPlayer2Choice}
		on:select={select}
	>
		P2 RPS Choice
	</SelectOption>
	<SelectOption
		description="Name of the player who won RPS"
		value={CustomElement.StrikeRpsWinner}
		on:select={select}
	>
		RPS Winner
	</SelectOption>

	<p class="section-label">Striking</p>
	<SelectOption
		description="Name of the player whose turn it is to strike a stage"
		value={CustomElement.StrikeCurrentStriker}
		on:select={select}
	>
		Current Striker
	</SelectOption>
	<SelectOption
		description="Name of the final selected stage"
		value={CustomElement.StrikeFinalStageName}
		on:select={select}
	>
		Final Stage Name
	</SelectOption>
	<SelectOption
		description="Image of the final selected stage"
		value={CustomElement.StrikeFinalStageImage}
		on:select={select}
	>
		Final Stage Image
	</SelectOption>

	<p class="section-label">Stage Slots</p>
	{#each Array(9) as _, i}
		<SelectOption
			description="Stage slot {i + 1} from your configured list — shows image, name, and strike state"
			value={CustomElement.StrikeStageSlot1 + i * 10}
			on:select={select}
		>
			Stage Slot {i + 1}
		</SelectOption>
	{/each}

	<p class="section-label">Set Info</p>
	<SelectOption
		description="Full strike order text (e.g. P2 bans 1 → P1 bans 2 → P2 bans 1)"
		value={CustomElement.StrikeOrderDisplay}
		on:select={select}
	>
		Strike Order
	</SelectOption>
	<SelectOption
		description="Number of bans remaining for the current striker this turn"
		value={CustomElement.StrikeBansRemaining}
		on:select={select}
	>
		Bans Remaining
	</SelectOption>
	<SelectOption
		description="Countdown timer seconds for the current phase"
		value={CustomElement.StrikeTimerSeconds}
		on:select={select}
	>
		Timer
	</SelectOption>

	<p class="section-label">Characters</p>
	<SelectOption
		description="Player 1's selected character icon"
		value={CustomElement.StrikePlayer1Character}
		on:select={select}
	>
		P1 Character
	</SelectOption>
	<SelectOption
		description="Player 2's selected character icon"
		value={CustomElement.StrikePlayer2Character}
		on:select={select}
	>
		P2 Character
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
