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
		description="Number Of Dash Attack Executed"
		value={CustomElement.PostGamePlayer1AttackCountDash}
		on:select={select}
	>
		Dash Attack Count
	</SelectOption>
	<SelectOption
		description="Number Of Jab-1 Executed"
		value={CustomElement.PostGamePlayer1AttackCountJab}
		on:select={select}
	>
		Jab-1 Count
	</SelectOption>
	<SelectOption
		description="Number Of Jab-2 Executed"
		value={CustomElement.PostGamePlayer1AttackCountJab2}
		on:select={select}
	>
		Jab-2 Count
	</SelectOption>
	<SelectOption
		description="Number Of Jab-3 Executed"
		value={CustomElement.PostGamePlayer1AttackCountJab3}
		on:select={select}
	>
		Jab-3 Count
	</SelectOption>
	<SelectOption
		description="Number Of Multi Jabs Executed"
		value={CustomElement.PostGamePlayer1AttackCountJabMulti}
		on:select={select}
	>
		Jab-Multi Count
	</SelectOption>
	<SelectOption
		description="Number Of Back Air Executed"
		value={CustomElement.PostGamePlayer1AttackCountBair}
		on:select={select}
	>
		Back Air Count
	</SelectOption>
	<SelectOption
		description="Number Of Down Air Executed"
		value={CustomElement.PostGamePlayer1AttackCountDair}
		on:select={select}
	>
		Down Air Count
	</SelectOption>
	<SelectOption
		description="Number Of Forward Air Executed"
		value={CustomElement.PostGamePlayer1AttackCountFair}
		on:select={select}
	>
		Forward Air Count
	</SelectOption>
	<SelectOption
		description="Number Of Up Air Executed"
		value={CustomElement.PostGamePlayer1AttackCountUair}
		on:select={select}
	>
		Up Air Count
	</SelectOption>
	<SelectOption
		description="Number Of Neutral Air Executed"
		value={CustomElement.PostGamePlayer1AttackCountNair}
		on:select={select}
	>
		Neutral Air Count
	</SelectOption>
	<SelectOption
		description="Number Of Down Tilt Executed"
		value={CustomElement.PostGamePlayer1AttackCountDsmash}
		on:select={select}
	>
		Down Smash Count
	</SelectOption>
	<SelectOption
		description="Number Of Forward Smash Executed"
		value={CustomElement.PostGamePlayer1AttackCountFsmash}
		on:select={select}
	>
		Forward Smash Count
	</SelectOption>
	<SelectOption
		description="Number Of Up Smash Executed"
		value={CustomElement.PostGamePlayer1AttackCountUsmash}
		on:select={select}
	>
		Up Smash Count
	</SelectOption>
	<SelectOption
		description="Number Of Down Tilt Executed"
		value={CustomElement.PostGamePlayer1AttackCountDtilt}
		on:select={select}
	>
		Down Tilt Count
	</SelectOption>
	<SelectOption
		description="Number Of Forward Tilt Executed"
		value={CustomElement.PostGamePlayer1AttackCountFtilt}
		on:select={select}
	>
		Forward Tilt Count
	</SelectOption>

	<SelectOption
		description="Number Of Up Tilt Executed"
		value={CustomElement.PostGamePlayer1AttackCountUtilt}
		on:select={select}
	>
		Up Tilt Count
	</SelectOption>
</div>
