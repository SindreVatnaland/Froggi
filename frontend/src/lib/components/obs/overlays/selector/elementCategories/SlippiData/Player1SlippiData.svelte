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
		description="Slippi Tag"
		value={CustomElement.MatchPlayer1Tag}
		on:select={select}
	>
		Tag
	</SelectOption>
	<SelectOption
		description="Connect Code"
		value={CustomElement.SlippiRankPlayer1ConnectCode}
		on:select={select}
	>
		Connect Code
	</SelectOption>
	<SelectOption
		description="Slippi Rank Icon"
		value={CustomElement.SlippiRankPlayer1RankIcon}
		on:select={select}
	>
		Rank Icon
	</SelectOption>
	<SelectOption
		description="Slippi Rank - Text"
		value={CustomElement.SlippiRankPlayer1RankText}
		on:select={select}
	>
		Rank Text
	</SelectOption>
	<SelectOption
		description="Slippi Rating"
		value={CustomElement.SlippiRankPlayer1Rating}
		on:select={select}
	>
		Rating
	</SelectOption>
	<SelectOption
		description="Continent"
		value={CustomElement.SlippiRankPlayer1Continent}
		on:select={select}
	>
		Continent
	</SelectOption>
	<SelectOption
		description="Continent Initials"
		value={CustomElement.SlippiRankPlayer1ContinentInitials}
		on:select={select}
	>
		Continent Initials
	</SelectOption>
	<SelectOption
		description="Global Placement"
		value={CustomElement.SlippiRankPlayer1DailyGlobalPlacement}
		on:select={select}
	>
		Global Placement
	</SelectOption>
	<SelectOption
		description="Regional Placement"
		value={CustomElement.SlippiRankPlayer1DailyRegionalPlacement}
		on:select={select}
	>
		Regional Placement
	</SelectOption>
	<SelectOption
		description="Ranked Wins"
		value={CustomElement.SlippiRankPlayer1Wins}
		on:select={select}
	>
		Rank Wins
	</SelectOption>
	<SelectOption
		description="Ranked Wins - Percent"
		value={CustomElement.SlippiRankPlayer1WinsPercent}
		on:select={select}
	>
		Rank Wins - Percent
	</SelectOption>
	<SelectOption
		description="Ranked Losses"
		value={CustomElement.SlippiRankPlayer1Losses}
		on:select={select}
	>
		Rank Losses
	</SelectOption>
	<SelectOption
		description="Ranked Losses - Percent"
		value={CustomElement.SlippiRankPlayer1LossesPercent}
		on:select={select}
	>
		Rank Losses - Percent
	</SelectOption>
	<SelectOption
		description="Most Played Character Name"
		value={CustomElement.SlippiRankPlayer1Character1}
		on:select={select}
	>
		Most Played Character Name
	</SelectOption>
	<SelectOption
		description="Most Played Character Percent"
		value={CustomElement.SlippiRankPlayer1Character1Percent}
		on:select={select}
	>
		Most Played Character Percent
	</SelectOption>
	<SelectOption
		description="Most Played Character Icon"
		value={CustomElement.SlippiRankPlayer1Character1Icon}
		on:select={select}
	>
		Most Played Character Icon
	</SelectOption>
	<SelectOption
		description="2nd Most Player Character Name"
		value={CustomElement.SlippiRankPlayer1Character2}
		on:select={select}
	>
		2nd Most Played Character Name
	</SelectOption>
	<SelectOption
		description="2nd Most Player Character "
		value={CustomElement.SlippiRankPlayer1Character2Percent}
		on:select={select}
	>
		2nd Most Played Character Percent
	</SelectOption>
	<SelectOption
		description="2nd Most Player Character - Icon"
		value={CustomElement.SlippiRankPlayer1Character2Icon}
		on:select={select}
	>
		2nd Most Played Character Icon
	</SelectOption>
	<SelectOption
		description="3rd Most Player Character - Text"
		value={CustomElement.SlippiRankPlayer1Character3}
		on:select={select}
	>
		3rd Most Played Character
	</SelectOption>
	<SelectOption
		description="3rd Most Player Character - Percent"
		value={CustomElement.SlippiRankPlayer1Character3Percent}
		on:select={select}
	>
		3nd Most Played Character Percent
	</SelectOption>
	<SelectOption
		description="3rd Most Player Character - Icon"
		value={CustomElement.SlippiRankPlayer1Character3Icon}
		on:select={select}
	>
		3rd Most Played Character Icon
	</SelectOption>
</div>
