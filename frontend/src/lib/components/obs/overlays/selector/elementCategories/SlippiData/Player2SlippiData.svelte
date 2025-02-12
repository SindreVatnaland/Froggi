<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import { createEventDispatcher } from 'svelte';
	import SelectOption from '$lib/components/obs/overlays/selector/visibilityCategories/SelectVisibilityOption.svelte';

	const dispatch = createEventDispatcher();

	function select(customElement: CustomEvent<CustomElement>) {
		dispatch('select', customElement.detail);
	}
</script>

<div class="flex flex-col gap-2">
	<SelectOption
		description="Player 2 Slippi Tag"
		value={CustomElement.MatchPlayer2Tag}
		on:select={select}
	>
		Tag
	</SelectOption>
	<SelectOption
		description="Player 2 Connect Code"
		value={CustomElement.SlippiRankPlayer2ConnectCode}
		on:select={select}
	>
		Connect Code
	</SelectOption>
	<SelectOption
		description="Player 2 Slippi Rank Icon"
		value={CustomElement.SlippiRankPlayer2RankIcon}
		on:select={select}
	>
		Rank Icon
	</SelectOption>
	<SelectOption
		description="Player 2 Slippi Rank - Text"
		value={CustomElement.SlippiRankPlayer2RankText}
		on:select={select}
	>
		Rank Text
	</SelectOption>
	<SelectOption
		description="Player 2 Slippi Rating"
		value={CustomElement.SlippiRankPlayer2Rating}
		on:select={select}
	>
		Rating
	</SelectOption>
	<SelectOption
		description="Player 2 Continent"
		value={CustomElement.SlippiRankPlayer2Continent}
		on:select={select}
	>
		Continent
	</SelectOption>
	<SelectOption
		description="Player 2 Continent Initials"
		value={CustomElement.SlippiRankPlayer2ContinentInitials}
		on:select={select}
	>
		Continent Initials
	</SelectOption>
	<SelectOption
		description="Player 2 Global Placement"
		value={CustomElement.SlippiRankPlayer2DailyGlobalPlacement}
		on:select={select}
	>
		Global Placement
	</SelectOption>
	<SelectOption
		description="Player 2 Regional Placement"
		value={CustomElement.SlippiRankPlayer2DailyRegionalPlacement}
		on:select={select}
	>
		Regional Placement
	</SelectOption>
	<SelectOption
		description="Player 2 Ranked Wins"
		value={CustomElement.SlippiRankPlayer2Wins}
		on:select={select}
	>
		Rank Wins
	</SelectOption>
	<SelectOption
		description="Player 2 Ranked Wins - Percent"
		value={CustomElement.SlippiRankPlayer2WinsPercent}
		on:select={select}
	>
		Rank Wins - Percent
	</SelectOption>
	<SelectOption
		description="Player 2 Ranked Losses"
		value={CustomElement.SlippiRankPlayer2Losses}
		on:select={select}
	>
		Rank Losses
	</SelectOption>
	<SelectOption
		description="Player 2 Ranked Losses - Percent"
		value={CustomElement.SlippiRankPlayer2LossesPercent}
		on:select={select}
	>
		Rank Losses - Percent
	</SelectOption>
	<SelectOption
		description="Player 2 Most Played Character - Text"
		value={CustomElement.SlippiRankPlayer2Character1}
		on:select={select}
	>
		Most Played Character - Text
	</SelectOption>
	<SelectOption
		description="Player 2 Most Played Character - Percent"
		value={CustomElement.SlippiRankPlayer2Character1Percent}
		on:select={select}
	>
		Most Played Character - Percent
	</SelectOption>
	<SelectOption
		description="Player 2 Most Played Character - Icon"
		value={CustomElement.SlippiRankPlayer2Character1Icon}
		on:select={select}
	>
		Most Played Character - Icon
	</SelectOption>
	<SelectOption
		description="Player 2 2nd Most Player Character - Text"
		value={CustomElement.SlippiRankPlayer2Character2}
		on:select={select}
	>
		2nd Most Played Character - Text
	</SelectOption>
	<SelectOption
		description="Player 2 2nd Most Player Character - Percent"
		value={CustomElement.SlippiRankPlayer2Character2Percent}
		on:select={select}
	>
		2nd Most Played Character - Percent
	</SelectOption>
	<SelectOption
		description="Player 2 2nd Most Player Character - Icon"
		value={CustomElement.SlippiRankPlayer2Character2Icon}
		on:select={select}
	>
		2nd Most Played Character - Icon
	</SelectOption>
	<SelectOption
		description="Player 2 3rd Most Player Character - Text"
		value={CustomElement.SlippiRankPlayer2Character3}
		on:select={select}
	>
		3rd Most Played Character
	</SelectOption>
	<SelectOption
		description="Player 2 3rd Most Player Character - Percent"
		value={CustomElement.SlippiRankPlayer2Character3Percent}
		on:select={select}
	>
		3nd Most Played Character - Percent
	</SelectOption>
	<SelectOption
		description="Player 2 3rd Most Player Character - Icon"
		value={CustomElement.SlippiRankPlayer2Character3Icon}
		on:select={select}
	>
		3rd Most Played Character - Icon
	</SelectOption>
</div>
