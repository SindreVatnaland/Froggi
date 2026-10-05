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
		description="Current Player character image from an asset pack — stock icons by default; pick portraits, renders or your own pack under Styling → Asset pack"
		value={CustomElement.InGameCurrentPlayerCharacter}
		on:select={select}
	>
		Character
	</SelectOption>
	<SelectOption
		description="Current Player Remaining Stocks"
		value={CustomElement.InGameCurrentPlayerStocksRemaining}
		on:select={select}
	>
		Stocks Remaining
	</SelectOption>
	<SelectOption
		description="Current Player Character Series Symbols From N64/Melee"
		value={CustomElement.InGameCurrentPlayerCharacterSeriesSymbol}
		on:select={select}
	>
		Series Symbol Melee
	</SelectOption>
	<SelectOption
		description="Current Player Character Series Symbol From Brawl/Sm4sh/Ultimate"
		value={CustomElement.InGameCurrentPlayerCharacterSeriesSymbolUltimate}
		on:select={select}
	>
		Series Symbol Ultimate
	</SelectOption>

	<SelectOption
		description="Current Player Percent - 24%"
		value={CustomElement.InGameCurrentPlayerPercent}
		on:select={select}
	>
		Percent
	</SelectOption>
	<SelectOption
		description="Current Player Percent With Decimals - 24.6% "
		value={CustomElement.InGameCurrentPlayerPercentDecimal}
		on:select={select}
	>
		Percent Decimal
	</SelectOption>
	<SelectOption
		description="Current Player Percent - 24% - Pre Animated"
		value={CustomElement.InGameCurrentPlayerPercentCustom}
		on:select={select}
	>
		Percent - Pre Animated
	</SelectOption>
	<SelectOption
		description="Current Player Percent With Decimals - Pre Animated"
		value={CustomElement.InGameCurrentPlayerPercentDecimalCustom}
		on:select={select}
	>
		Percent Decimal - Pre Animated
	</SelectOption>
	<SelectOption
		description="Current Player Combo Counter"
		value={CustomElement.InGameCurrentPlayerComboCounter}
		on:select={select}
	>
		Combo Counter
	</SelectOption>
</div>
