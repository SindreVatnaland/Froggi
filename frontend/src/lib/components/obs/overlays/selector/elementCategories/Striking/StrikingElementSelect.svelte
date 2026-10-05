<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import { createEventDispatcher } from 'svelte';
	import SelectOption from '../../visibilityCategories/SelectVisibilityOption.svelte';

	const dispatch = createEventDispatcher();

	function select(customElement: CustomEvent<CustomElement>) {
		dispatch('select', customElement.detail);
	}

	const plainStages: { value: CustomElement; label: string }[] = [
		{ value: CustomElement.StrikeStageImageFoD, label: 'Fountain of Dreams' },
		{ value: CustomElement.StrikeStageImageBF, label: 'Battlefield' },
		{ value: CustomElement.StrikeStageImageFD, label: 'Final Destination' },
		{ value: CustomElement.StrikeStageImageDL, label: 'Dream Land' },
		{ value: CustomElement.StrikeStageImageYS, label: "Yoshi's Story" },
		{ value: CustomElement.StrikeStageImagePS, label: 'Pokémon Stadium' },
	];
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
	{#each Array(6) as _, i}
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
		description="Player 1's name for the set — their tag when Froggi knows it"
		value={CustomElement.StrikePlayer1Name}
		on:select={select}
	>
		P1 Name
	</SelectOption>
	<SelectOption
		description="Player 2's name for the set — their tag when Froggi knows it"
		value={CustomElement.StrikePlayer2Name}
		on:select={select}
	>
		P2 Name
	</SelectOption>
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

	<p class="section-label">Stage images</p>
	<p class="text-xs opacity-50">Just the stage picture. Colour it per state with boxes on a layer above, shown by the "Stage state" conditions (Available / Locked / Struck / DSR / Picked).</p>
	{#each plainStages as stage (stage.value)}
		<SelectOption description="Plain stage image — {stage.label}" value={stage.value} on:select={select}>
			{stage.label}
		</SelectOption>
	{/each}
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
