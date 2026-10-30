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
	<SelectOption description="Current action state name" value={CustomElement.InGamePlayer1ActionStateName} on:select={select}>State Name</SelectOption>
	<SelectOption description="Current action state ID" value={CustomElement.InGamePlayer1ActionStateId} on:select={select}>State ID</SelectOption>
	<SelectOption description="Invincibility — Invincible / Intangible / empty" value={CustomElement.InGamePlayer1InvincibilityState} on:select={select}>Invincibility</SelectOption>
	<SelectOption description="Airborne flag" value={CustomElement.InGamePlayer1IsAirborne} on:select={select}>Airborne</SelectOption>
	<SelectOption description="Shielding flag" value={CustomElement.InGamePlayer1IsShielding} on:select={select}>Shielding</SelectOption>
	<SelectOption description="In hitstun flag" value={CustomElement.InGamePlayer1IsInHitstun} on:select={select}>In Hitstun</SelectOption>
	<SelectOption description="In hitlag flag" value={CustomElement.InGamePlayer1IsInHitlag} on:select={select}>In Hitlag</SelectOption>
	<SelectOption description="On ledge flag" value={CustomElement.InGamePlayer1IsOnLedge} on:select={select}>On Ledge</SelectOption>
	<SelectOption description="Grabbed flag" value={CustomElement.InGamePlayer1IsGrabbed} on:select={select}>Grabbed</SelectOption>
	<SelectOption description="In tech flag" value={CustomElement.InGamePlayer1IsInTech} on:select={select}>In Tech</SelectOption>
	<SelectOption description="Special fall landing flag" value={CustomElement.InGamePlayer1IsWavedashLanding} on:select={select}>Special Landing</SelectOption>
	<SelectOption description="Airdodging flag" value={CustomElement.InGamePlayer1IsAirdodging} on:select={select}>Airdodging</SelectOption>
	<SelectOption description="Jumps remaining" value={CustomElement.InGamePlayer1JumpsRemaining} on:select={select}>Jumps Remaining</SelectOption>
	<SelectOption description="Shield size" value={CustomElement.InGamePlayer1ShieldSize} on:select={select}>Shield Size</SelectOption>
	<SelectOption description="L-cancel result — ✓ / ✗ / empty" value={CustomElement.InGamePlayer1LCancel} on:select={select}>L-Cancel</SelectOption>
	<SelectOption description="High-level state category (Jumping, Attacking, Hitstun…)" value={CustomElement.InGamePlayer1StateCategory} on:select={select}>State Category</SelectOption>
	<SelectOption description="Last detected technique — clears after 3 seconds" value={CustomElement.InGamePlayer1Technique} on:select={select}>Technique</SelectOption>
</div>
