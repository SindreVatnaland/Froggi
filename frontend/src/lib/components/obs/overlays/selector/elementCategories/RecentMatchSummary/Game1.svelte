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
		value={CustomElement.CurrentSetGame1Stage}
		on:select={select}
	>
		Recent Game Stage
	</SelectOption>
	<SelectOption
		description="Recent Game Player 1 Score"
		value={CustomElement.CurrentSetGame1Player1Score}
		on:select={select}
	>
		Player 1 Score
	</SelectOption>
	<SelectOption
		description="Recent Game Player 2 Score"
		value={CustomElement.CurrentSetGame1Player2Score}
		on:select={select}
	>
		Player 2 Score
	</SelectOption>
	<SelectOption
		description="Recent Game Player 1 Character Icon"
		value={CustomElement.CurrentSetGame1Player1CharacterIcon}
		on:select={select}
	>
		Player 1 Character Icon
	</SelectOption>
	<SelectOption
		description="Recent Game Player 2 Character Icon"
		value={CustomElement.CurrentSetGame1Player2CharacterIcon}
		on:select={select}
	>
		Player 2 Character Icon
	</SelectOption>
	<SelectOption
		description="Recent Game 1 Player 1 Character Left Side Render"
		value={CustomElement.CurrentSetGame1Player1CharacterRenderLeft}
		on:select={select}
	>
		Player 1 Character Render (Left)
	</SelectOption>
	<SelectOption
		description="Recent Game 1 Player 1 Character Right Side Render"
		value={CustomElement.CurrentSetGame1Player1CharacterRenderRight}
		on:select={select}
	>
		Player 1 Character Render (Right)
	</SelectOption>
	<SelectOption
		description="Recent Game 1 Player 2 Character Left Side Render"
		value={CustomElement.CurrentSetGame1Player2CharacterRenderLeft}
		on:select={select}
	>
		Player 2 Character Render (Left)
	</SelectOption>
	<SelectOption
		description="Recent Game 1 Player 2 Character Right Side Render"
		value={CustomElement.CurrentSetGame1Player2CharacterRenderRight}
		on:select={select}
	>
		Player 2 Character Render (Right)
	</SelectOption>
	<SelectOption
		description="Recent Game 1 Player 1 Stocks Remaining"
		value={CustomElement.CurrentSetGame1Player1StocksRemaining}
		on:select={select}
	>
		Player 1 Stocks Remaining
	</SelectOption>
	<SelectOption
		description="Recent Game 1 Player 2 Stocks Remaining"
		value={CustomElement.CurrentSetGame1Player2StocksRemaining}
		on:select={select}
	>
		Player 2 Stocks Remaining
	</SelectOption>
</div>
