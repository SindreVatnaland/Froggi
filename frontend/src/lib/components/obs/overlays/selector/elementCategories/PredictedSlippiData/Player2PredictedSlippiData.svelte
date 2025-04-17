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
		description="Player 2 Predicted Win Slippi Rank Icon"
		value={CustomElement.SlippiRankPlayer2PredictedWinRankIcon}
		on:select={select}
	>
		Rank Icon - Win
	</SelectOption>
	<SelectOption
		description="Player 2 Predicted Win Slippi Rank - Text"
		value={CustomElement.SlippiRankPlayer2PredictedWinRankText}
		on:select={select}
	>
		Rank Text - Win
	</SelectOption>
	<SelectOption
		description="Player 2 Predicted Win Slippi Rating"
		value={CustomElement.SlippiRankPlayer2PredictedWinRating}
		on:select={select}
	>
		Rating - Win
	</SelectOption>
	<SelectOption
		description="Player 2 Predicted Loss Slippi Rank Icon"
		value={CustomElement.SlippiRankPlayer2PredictedLossRankIcon}
		on:select={select}
	>
		Rank Icon - Loss
	</SelectOption>
	<SelectOption
		description="Player 2 Predicted Loss Slippi Rank - Text"
		value={CustomElement.SlippiRankPlayer2PredictedLossRankText}
		on:select={select}
	>
		Rank Text - Loss
	</SelectOption>
	<SelectOption
		description="Player 2 Predicted Loss Slippi Rating"
		value={CustomElement.SlippiRankPlayer2PredictedLossRating}
		on:select={select}
	>
		Rating - Loss
	</SelectOption>
	<SelectOption
		description="Player Potential Slippi Rating Loss After Match"
		value={CustomElement.SlippiPlayer2RankChangePredictedLossRatingDifference}
		on:select={select}
	>
		Predicted Loss Rating Difference
	</SelectOption>
	<SelectOption
		description="Player Potential Slippi Rating Gained After Match"
		value={CustomElement.SlippiPlayer2RankChangePredictedWinRatingDifference}
		on:select={select}
	>
		Predicted Win Rating Difference
	</SelectOption>
</div>
