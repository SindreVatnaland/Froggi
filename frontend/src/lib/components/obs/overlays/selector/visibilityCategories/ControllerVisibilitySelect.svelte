<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import SelectOption from './SelectVisibilityOption.svelte';
	import type { SelectedVisibilityCondition, VisibilityOption } from '$lib/models/types/animationOption';
	import { CONTROLLER_CHECKS, STICK_THRESHOLD } from '$lib/utils/controllerConditions';

	export let selectedVisibilityOption: SelectedVisibilityCondition;
	const dispatch = createEventDispatcher();

	const players: { label: string; tip: string }[] = [
		{ label: 'Current Player', tip: 'you (your connect code)' },
		{ label: 'Player 1', tip: 'Player 1' },
		{ label: 'Player 2', tip: 'Player 2' },
	];
	const describe = (check: string) =>
		check.startsWith('L ') || check.startsWith('R ')
			? check.endsWith('Analog Pressed')
				? 'pressed past the dead zone'
				: check.endsWith('Fully Pressed')
					? 'pressed all the way'
					: 'clicked (the digital click at the bottom)'
			: check.includes('Stick')
				? `held past ${STICK_THRESHOLD} (the dead zone) — diagonals count for both directions`
				: 'held';
	const checks = Object.keys(CONTROLLER_CHECKS);
	const value = (player: string, check: string) => `${player} Controller ${check}` as VisibilityOption;

	function select(event: CustomEvent<VisibilityOption>) {
		dispatch('select', event.detail);
	}
</script>

<div class="flex flex-col gap-4">
	{#each players as player}
		<div class="flex flex-col gap-2">
			<p class="section-label">{player.label}</p>
			{#each checks as check}
				<SelectOption
					description={`${check} — ${describe(check)} by ${player.tip}`}
					value={value(player.label, check)}
					bind:selected={selectedVisibilityOption[value(player.label, check)]}
					on:select={select}
				>
					{check}
				</SelectOption>
			{/each}
		</div>
	{/each}
</div>
