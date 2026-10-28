<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import SelectOption from './SelectVisibilityOption.svelte';
	import { VisibilityOption, type SelectedVisibilityCondition } from '$lib/models/types/animationOption';

	export let selectedVisibilityOption: SelectedVisibilityCondition;
	const dispatch = createEventDispatcher();

	const options: { value: VisibilityOption; label: string; description: string }[] = [
		{ value: VisibilityOption.IronManActive, label: 'Iron Man Active', description: 'An Iron Man session is running (also after someone won, until it is stopped)' },
		{ value: VisibilityOption.IronManModeStandard, label: 'Mode: Standard', description: 'Lose a game → that character is out' },
		{ value: VisibilityOption.IronManModeFullRoster, label: 'Mode: Full Roster', description: 'Win with every character' },
		{ value: VisibilityOption.IronManModeChallenge, label: 'Mode: Challenge', description: 'Solo: beat every character without a loss' },
		{ value: VisibilityOption.IronManPlayer1Won, label: 'Player 1 Won', description: 'You won the Iron Man' },
		{ value: VisibilityOption.IronManPlayer2Won, label: 'Player 2 Won', description: 'The opponent won the Iron Man' },
		{ value: VisibilityOption.IronManCarryOverPending, label: 'Carry-over Pending', description: 'From a win until the winner has SD\'d down to the stocks they kept in the next game (carry-over rule on)' },
	];

	function select(event: CustomEvent<VisibilityOption>) {
		dispatch('select', event.detail);
	}
</script>

<div class="flex flex-col gap-2">
	{#each options as { value, label, description }}
		<SelectOption {description} {value} bind:selected={selectedVisibilityOption[value]} on:select={select}>
			{label}
		</SelectOption>
	{/each}
</div>
