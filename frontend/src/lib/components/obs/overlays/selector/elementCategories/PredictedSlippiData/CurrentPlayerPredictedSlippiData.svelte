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
		description="Current Player Predicted Win Slippi Rank Icon"
		value={CustomElement.SlippiRankCurrentPlayerPredictedWinRankIcon}
		on:select={select}
	>
		Rank Icon - Win
	</SelectOption>
	<SelectOption
		description="Current Player Predicted Win Slippi Rank - Text"
		value={CustomElement.SlippiRankCurrentPlayerPredictedWinRankText}
		on:select={select}
	>
		Rank Text - Win
	</SelectOption>
	<SelectOption
		description="Current Player Predicted Win Slippi Rating"
		value={CustomElement.SlippiRankCurrentPlayerPredictedWinRating}
		on:select={select}
	>
		Rating - Win
	</SelectOption>
	<SelectOption
		description="Current Player Predicted Loss Slippi Rank Icon"
		value={CustomElement.SlippiRankCurrentPlayerPredictedLossRankIcon}
		on:select={select}
	>
		Rank Icon - Loss
	</SelectOption>
	<SelectOption
		description="Current Player Predicted Loss Slippi Rank - Text"
		value={CustomElement.SlippiRankCurrentPlayerPredictedLossRankText}
		on:select={select}
	>
		Rank Text - Loss
	</SelectOption>
	<SelectOption
		description="Current Player Predicted Loss Slippi Rating"
		value={CustomElement.SlippiRankCurrentPlayerPredictedLossRating}
		on:select={select}
	>
		Rating - Loss
	</SelectOption>
	<SelectOption
		description="Current Player Potential Slippi Rating Loss After Match"
		value={CustomElement.SlippiCurrentPlayerRankChangePredictedLossRatingDifference}
		on:select={select}
	>
		Predicted Loss Rating Difference
	</SelectOption>
	<SelectOption
		description="Current Player Potential Slippi Rating Gained After Match"
		value={CustomElement.SlippiCurrentPlayerRankChangePredictedWinRatingDifference}
		on:select={select}
	>
		Predicted Win Rating Difference
	</SelectOption>
</div>
