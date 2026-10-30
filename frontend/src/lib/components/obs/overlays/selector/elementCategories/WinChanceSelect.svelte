<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import { createEventDispatcher } from 'svelte';
	import SelectOption from '../visibilityCategories/SelectVisibilityOption.svelte';

	const dispatch = createEventDispatcher();
	const select = (e: CustomEvent<CustomElement>) => dispatch('select', e.detail);

	const items = [
		{ value: CustomElement.WinChanceGamePlayer1, label: 'Team 1 / Player 1 Win Chance · this game', tip: 'From stocks and percent (against each player\'s average death % this set) and the time left. Empty when no game runs.' },
		{ value: CustomElement.WinChanceGamePlayer2, label: 'Team 2 / Player 2 Win Chance · this game', tip: 'From stocks and percent (against each player\'s average death % this set) and the time left. Empty when no game runs.' },
		{ value: CustomElement.WinChanceSetPlayer1, label: 'Team 1 / Player 1 Win Chance · set', tip: 'This game\'s chance plus the set score (later games counted as 50/50).' },
		{ value: CustomElement.WinChanceSetPlayer2, label: 'Team 2 / Player 2 Win Chance · set', tip: 'This game\'s chance plus the set score (later games counted as 50/50).' },
	];
</script>

<div class="flex flex-col gap-2">
	<p class="text-xs opacity-50">Estimated from stocks left and percent (and the set score) — not a prediction of skill.</p>
	{#each items as item (item.value)}
		<SelectOption description={item.tip} value={item.value} on:select={select}>{item.label}</SelectOption>
	{/each}
</div>
