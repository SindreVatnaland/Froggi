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
		description="Player 1 Stock Icon"
		value={CustomElement.InGamePlayer1CharacterIcon}
		on:select={select}
	>
		Stock Icon
	</SelectOption>
	<SelectOption
		description="Player 1 Remaining Stocks"
		value={CustomElement.InGamePlayer1StocksRemaining}
		on:select={select}
	>
		Stocks Remaining
	</SelectOption>
	<SelectOption
		description="Player 1 Character Left Side Render"
		value={CustomElement.InGamePlayer1CharacterRenderLeft}
		on:select={select}
	>
		Character Render (Left)
	</SelectOption>
	<SelectOption
		description="Player 1 Character Right Side Render"
		value={CustomElement.InGamePlayer1CharacterRenderRight}
		on:select={select}
	>
		Character Render (Right)
	</SelectOption>
	<SelectOption
		description="Player 1 Character Series Symbols From N64/Melee"
		value={CustomElement.InGamePlayer1CharacterSeriesSymbol}
		on:select={select}
	>
		Series Symbol Melee
	</SelectOption>
	<SelectOption
		description="Player 1 Character Series Symbol From Brawl/Sm4sh/Ultimate"
		value={CustomElement.InGamePlayer1CharacterSeriesSymbolUltimate}
		on:select={select}
	>
		Series Symbol Ultimate
	</SelectOption>
	<SelectOption
		description="Player 1 Percent - 24%"
		value={CustomElement.InGamePlayer1Percent}
		on:select={select}
	>
		Percent
	</SelectOption>
	<SelectOption
		description="Player 1 Percent With Decimals - 24.6% "
		value={CustomElement.InGamePlayer1PercentDecimal}
		on:select={select}
	>
		Percent Decimal
	</SelectOption>
	<SelectOption
		description="Player 1 Percent - 24% - Pre Animated"
		value={CustomElement.InGamePlayer1PercentCustom}
		on:select={select}
	>
		Percent - Pre Animated
	</SelectOption>
	<SelectOption
		description="Player 1 Percent With Decimals - Pre Animated"
		value={CustomElement.InGamePlayer1PercentDecimalCustom}
		on:select={select}
	>
		Percent Decimal - Pre Animated
	</SelectOption>
	<SelectOption
		description="Player 1 Combo Counter"
		value={CustomElement.InGamePlayer1ComboCounter}
		on:select={select}
	>
		Combo Counter
	</SelectOption>
</div>
