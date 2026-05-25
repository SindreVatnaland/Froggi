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
	<SelectOption description="Player 2 current action state name" value={CustomElement.InGamePlayer2ActionStateName} on:select={select}>State Name</SelectOption>
	<SelectOption description="Player 2 current action state ID" value={CustomElement.InGamePlayer2ActionStateId} on:select={select}>State ID</SelectOption>
	<SelectOption description="Player 2 invincibility — Invincible / Intangible / empty" value={CustomElement.InGamePlayer2InvincibilityState} on:select={select}>Invincibility</SelectOption>
	<SelectOption description="Player 2 airborne flag" value={CustomElement.InGamePlayer2IsAirborne} on:select={select}>Airborne</SelectOption>
	<SelectOption description="Player 2 shielding flag" value={CustomElement.InGamePlayer2IsShielding} on:select={select}>Shielding</SelectOption>
	<SelectOption description="Player 2 in hitstun flag" value={CustomElement.InGamePlayer2IsInHitstun} on:select={select}>In Hitstun</SelectOption>
	<SelectOption description="Player 2 in hitlag flag" value={CustomElement.InGamePlayer2IsInHitlag} on:select={select}>In Hitlag</SelectOption>
	<SelectOption description="Player 2 on ledge flag" value={CustomElement.InGamePlayer2IsOnLedge} on:select={select}>On Ledge</SelectOption>
	<SelectOption description="Player 2 grabbed flag" value={CustomElement.InGamePlayer2IsGrabbed} on:select={select}>Grabbed</SelectOption>
	<SelectOption description="Player 2 in tech flag" value={CustomElement.InGamePlayer2IsInTech} on:select={select}>In Tech</SelectOption>
	<SelectOption description="Player 2 special fall landing flag" value={CustomElement.InGamePlayer2IsWavedashLanding} on:select={select}>Special Landing</SelectOption>
	<SelectOption description="Player 2 airdodging flag" value={CustomElement.InGamePlayer2IsAirdodging} on:select={select}>Airdodging</SelectOption>
	<SelectOption description="Player 2 jumps remaining" value={CustomElement.InGamePlayer2JumpsRemaining} on:select={select}>Jumps Remaining</SelectOption>
	<SelectOption description="Player 2 shield size" value={CustomElement.InGamePlayer2ShieldSize} on:select={select}>Shield Size</SelectOption>
	<SelectOption description="Player 2 L-cancel result — ✓ / ✗ / empty" value={CustomElement.InGamePlayer2LCancel} on:select={select}>L-Cancel</SelectOption>
</div>
