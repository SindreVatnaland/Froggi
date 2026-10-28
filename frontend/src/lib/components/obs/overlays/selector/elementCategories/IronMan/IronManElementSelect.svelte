<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import { createEventDispatcher } from 'svelte';
	import SelectOption from '../../visibilityCategories/SelectVisibilityOption.svelte';

	const dispatch = createEventDispatcher();

	function select(customElement: CustomEvent<CustomElement>) {
		dispatch('select', customElement.detail);
	}
</script>

<!-- The old combined Iron Man Roster (9010) still renders in existing overlays but is no longer offered. -->
<div class="flex flex-col gap-2">
	<!-- Names reuse the Match tag elements (same element, offered here too). -->
	<SelectOption
		description="The player's name from the game — the same element as Match → Player 1 Tag"
		value={CustomElement.MatchPlayer1Tag}
		on:select={select}
	>
		Player 1 Name
	</SelectOption>
	<SelectOption
		description="The player's name from the game — the same element as Match → Player 2 Tag"
		value={CustomElement.MatchPlayer2Tag}
		on:select={select}
	>
		Player 2 Name
	</SelectOption>
	<SelectOption
		description="Your Iron Man characters and which are out — resize the box, the icons fit it"
		value={CustomElement.IronManPlayer1Roster}
		on:select={select}
	>
		Player 1 Roster
	</SelectOption>
	<SelectOption
		description="The opponent's Iron Man characters and which are out (empty in solo)"
		value={CustomElement.IronManPlayer2Roster}
		on:select={select}
	>
		Player 2 Roster
	</SelectOption>
	<SelectOption
		description="Characters done: depleted in Standard, completed in Full Roster / Challenge"
		value={CustomElement.IronManPlayer1ProgressBar}
		on:select={select}
	>
		Player 1 Progress Bar
	</SelectOption>
	<SelectOption
		description="The opponent's progress bar"
		value={CustomElement.IronManPlayer2ProgressBar}
		on:select={select}
	>
		Player 2 Progress Bar
	</SelectOption>
	<SelectOption
		description="Number of characters in your roster"
		value={CustomElement.IronManPlayer1CharacterTotal}
		on:select={select}
	>
		Player 1 Character Total
	</SelectOption>
	<SelectOption
		description="Number of characters in the opponent's roster"
		value={CustomElement.IronManPlayer2CharacterTotal}
		on:select={select}
	>
		Player 2 Character Total
	</SelectOption>
	<SelectOption
		description="Characters still to go: not depleted (Standard) / not completed (Full Roster, Challenge)"
		value={CustomElement.IronManPlayer1CharactersRemaining}
		on:select={select}
	>
		Player 1 Characters Remaining
	</SelectOption>
	<SelectOption
		description="The opponent's characters still to go"
		value={CustomElement.IronManPlayer2CharactersRemaining}
		on:select={select}
	>
		Player 2 Characters Remaining
	</SelectOption>
</div>
