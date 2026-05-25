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
	<SelectOption description="Player 1 current action state name" value={CustomElement.InGamePlayer1ActionStateName} on:select={select}>State Name</SelectOption>
	<SelectOption description="Player 1 current action state ID" value={CustomElement.InGamePlayer1ActionStateId} on:select={select}>State ID</SelectOption>
	<SelectOption description="Player 1 invincibility — Invincible / Intangible / empty" value={CustomElement.InGamePlayer1InvincibilityState} on:select={select}>Invincibility</SelectOption>
	<SelectOption description="Player 1 airborne flag" value={CustomElement.InGamePlayer1IsAirborne} on:select={select}>Airborne</SelectOption>
	<SelectOption description="Player 1 shielding flag" value={CustomElement.InGamePlayer1IsShielding} on:select={select}>Shielding</SelectOption>
	<SelectOption description="Player 1 in hitstun flag" value={CustomElement.InGamePlayer1IsInHitstun} on:select={select}>In Hitstun</SelectOption>
	<SelectOption description="Player 1 in hitlag flag" value={CustomElement.InGamePlayer1IsInHitlag} on:select={select}>In Hitlag</SelectOption>
	<SelectOption description="Player 1 on ledge flag" value={CustomElement.InGamePlayer1IsOnLedge} on:select={select}>On Ledge</SelectOption>
	<SelectOption description="Player 1 grabbed flag" value={CustomElement.InGamePlayer1IsGrabbed} on:select={select}>Grabbed</SelectOption>
	<SelectOption description="Player 1 in tech flag" value={CustomElement.InGamePlayer1IsInTech} on:select={select}>In Tech</SelectOption>
	<SelectOption description="Player 1 special fall landing flag" value={CustomElement.InGamePlayer1IsWavedashLanding} on:select={select}>Special Landing</SelectOption>
	<SelectOption description="Player 1 airdodging flag" value={CustomElement.InGamePlayer1IsAirdodging} on:select={select}>Airdodging</SelectOption>
	<SelectOption description="Player 1 jumps remaining" value={CustomElement.InGamePlayer1JumpsRemaining} on:select={select}>Jumps Remaining</SelectOption>
	<SelectOption description="Player 1 shield size" value={CustomElement.InGamePlayer1ShieldSize} on:select={select}>Shield Size</SelectOption>
	<SelectOption description="Player 1 L-cancel result — ✓ / ✗ / empty" value={CustomElement.InGamePlayer1LCancel} on:select={select}>L-Cancel</SelectOption>
</div>
