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
	<SelectOption
		description="Current Player Slippi Tag"
		value={CustomElement.SlippiRankCurrentPlayerTag}
		on:select={select}
	>
		Tag
	</SelectOption>
	<SelectOption
		description="Current Player Connect Code"
		value={CustomElement.SlippiRankCurrentPlayerConnectCode}
		on:select={select}
	>
		Connect Code
	</SelectOption>
	<SelectOption
		description="Current Player Slippi Rank Icon"
		value={CustomElement.SlippiRankCurrentPlayerRankIcon}
		on:select={select}
	>
		Rank Icon
	</SelectOption>
	<SelectOption
		description="Current Player Slippi Rank Text"
		value={CustomElement.SlippiRankCurrentPlayerRankText}
		on:select={select}
	>
		Rank Text
	</SelectOption>
	<SelectOption
		description="Current Player Slippi Rating"
		value={CustomElement.SlippiRankCurrentPlayerRating}
		on:select={select}
	>
		Rating
	</SelectOption>
	<SelectOption
		description="Current Player Continent"
		value={CustomElement.SlippiRankCurrentPlayerContinent}
		on:select={select}
	>
		Continent
	</SelectOption>
	<SelectOption
		description="Current Player Continent Initials"
		value={CustomElement.SlippiRankCurrentPlayerContinentInitials}
		on:select={select}
	>
		Continent Initials
	</SelectOption>
	<SelectOption
		description="Current Player Global Placement"
		value={CustomElement.SlippiRankCurrentPlayerDailyGlobalPlacement}
		on:select={select}
	>
		Global Placement
	</SelectOption>
	<SelectOption
		description="Current Player Regional Placement"
		value={CustomElement.SlippiRankCurrentPlayerDailyRegionalPlacement}
		on:select={select}
	>
		Regional Placement
	</SelectOption>
	<SelectOption
		description="Current Player Ranked Wins"
		value={CustomElement.SlippiRankCurrentPlayerWins}
		on:select={select}
	>
		Rank Wins
	</SelectOption>
	<SelectOption
		description="Current Player Ranked Wins - Percent"
		value={CustomElement.SlippiRankCurrentPlayerWinsPercent}
		on:select={select}
	>
		Rank Wins - Percent
	</SelectOption>
	<SelectOption
		description="Current Player Ranked Losses"
		value={CustomElement.SlippiRankCurrentPlayerLosses}
		on:select={select}
	>
		Rank Losses
	</SelectOption>
	<SelectOption
		description="Current Player Ranked Losses - Percent"
		value={CustomElement.SlippiRankCurrentPlayerLossesPercent}
		on:select={select}
	>
		Rank Losses - Percent
	</SelectOption>
	<SelectOption
		description="Current Player Most Played Character - Text"
		value={CustomElement.SlippiRankCurrentPlayerCharacter1}
		on:select={select}
	>
		Most Played Character - Text
	</SelectOption>
	<SelectOption
		description="Current Player Most Played Character - Percent"
		value={CustomElement.SlippiRankCurrentPlayerCharacter1Percent}
		on:select={select}
	>
		Most Played Character - Percent
	</SelectOption>
	<SelectOption
		description="Current Player Most Played Character - Icon"
		value={CustomElement.SlippiRankCurrentPlayerCharacter1Icon}
		on:select={select}
	>
		Most Played Character - Icon
	</SelectOption>
	<SelectOption
		description="Current Player 2nd Most Player Character - Text"
		value={CustomElement.SlippiRankCurrentPlayerCharacter2}
		on:select={select}
	>
		2nd Most Played Character - Text
	</SelectOption>
	<SelectOption
		description="Current Player 2nd Most Player Character - Percent"
		value={CustomElement.SlippiRankCurrentPlayerCharacter2Percent}
		on:select={select}
	>
		2nd Most Played Character - Percent
	</SelectOption>
	<SelectOption
		description="Current Player 2nd Most Player Character - Icon"
		value={CustomElement.SlippiRankCurrentPlayerCharacter2Icon}
		on:select={select}
	>
		2nd Most Played Character 2 - Icon
	</SelectOption>
	<SelectOption
		description="Current Player 3rd Most Player Character"
		value={CustomElement.SlippiRankCurrentPlayerCharacter3}
		on:select={select}
	>
		3rd Most Played Character - Text
	</SelectOption>
	<SelectOption
		description="Current Player 3rd Most Player Character"
		value={CustomElement.SlippiRankCurrentPlayerCharacter3Percent}
		on:select={select}
	>
		3rd Most Played Character - Percent
	</SelectOption>
	<SelectOption
		description="Current Player 3rd Most Player Character"
		value={CustomElement.SlippiRankCurrentPlayerCharacter3Icon}
		on:select={select}
	>
		3rd Most Played Character - Icon
	</SelectOption>
	<SelectOption
		description="Current Player Rating History Graph — sparkline across all seasons"
		value={CustomElement.SlippiRankCurrentPlayerRatingGraph}
		on:select={select}
	>
		Rating History Graph
	</SelectOption>
</div>
