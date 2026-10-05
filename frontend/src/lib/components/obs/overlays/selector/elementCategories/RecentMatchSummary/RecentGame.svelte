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
		description="Recent Game Stage Image"
		value={CustomElement.CurrentSetGameRecentStage}
		on:select={select}
	>
		Recent Game Stage
	</SelectOption>
	<SelectOption
		description="Set score — games Player 1 has won in the current set (updates after each game)"
		value={CustomElement.CurrentSetGameRecentPlayer1Score}
		on:select={select}
	>
		Player 1 Score
	</SelectOption>
	<SelectOption
		description="Set score — games Player 2 has won in the current set (updates after each game)"
		value={CustomElement.CurrentSetGameRecentPlayer2Score}
		on:select={select}
	>
		Player 2 Score
	</SelectOption>
	<SelectOption
		description="Recent Game Player 1 Character Icon"
		value={CustomElement.CurrentSetGameRecentPlayer1CharacterIcon}
		on:select={select}
	>
		Player 1 Character Icon
	</SelectOption>
	<SelectOption
		description="Recent Game Player 2 Character Icon"
		value={CustomElement.CurrentSetGameRecentPlayer2CharacterIcon}
		on:select={select}
	>
		Player 2 Character Icon
	</SelectOption>
	<SelectOption
		description="Recent Game Player 1 Character Render Left Side Render"
		value={CustomElement.CurrentSetGameRecentPlayer1CharacterRenderLeft}
		on:select={select}
	>
		Player 1 Character Render (Left)
	</SelectOption>
	<SelectOption
		description="Recent Game Player 1 Character Render Right Side Render"
		value={CustomElement.CurrentSetGameRecentPlayer1CharacterRenderRight}
		on:select={select}
	>
		Player 1 Character Render (Right)
	</SelectOption>
	<SelectOption
		description="Recent Game Player 2 Character Render Left Side Render"
		value={CustomElement.CurrentSetGameRecentPlayer2CharacterRenderLeft}
		on:select={select}
	>
		Player 2 Character Render (Left)
	</SelectOption>
	<SelectOption
		description="Recent Game Player 2 Character Render Right Side Render"
		value={CustomElement.CurrentSetGameRecentPlayer2CharacterRenderRight}
		on:select={select}
	>
		Player 2 Character Render (Right)
	</SelectOption>
	<SelectOption
		description="Recent Game Player 1 Stocks Remaining"
		value={CustomElement.CurrentSetGameRecentPlayer1StocksRemaining}
		on:select={select}
	>
		Player 1 Stocks Remaining
	</SelectOption>
	<SelectOption
		description="Recent Game Player 2 Stocks Remaining"
		value={CustomElement.CurrentSetGameRecentPlayer2StocksRemaining}
		on:select={select}
	>
		Player 2 Stocks Remaining
	</SelectOption>
</div>
