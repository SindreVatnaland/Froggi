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
	<SelectOption description="Current player action state name" value={CustomElement.InGameCurrentPlayerActionStateName} on:select={select}>State Name</SelectOption>
	<SelectOption description="Current player action state ID" value={CustomElement.InGameCurrentPlayerActionStateId} on:select={select}>State ID</SelectOption>
	<SelectOption description="Current player invincibility — Invincible / Intangible / empty" value={CustomElement.InGameCurrentPlayerInvincibilityState} on:select={select}>Invincibility</SelectOption>
	<SelectOption description="Current player airborne flag" value={CustomElement.InGameCurrentPlayerIsAirborne} on:select={select}>Airborne</SelectOption>
	<SelectOption description="Current player shielding flag" value={CustomElement.InGameCurrentPlayerIsShielding} on:select={select}>Shielding</SelectOption>
	<SelectOption description="Current player in hitstun flag" value={CustomElement.InGameCurrentPlayerIsInHitstun} on:select={select}>In Hitstun</SelectOption>
	<SelectOption description="Current player in hitlag flag" value={CustomElement.InGameCurrentPlayerIsInHitlag} on:select={select}>In Hitlag</SelectOption>
	<SelectOption description="Current player on ledge flag" value={CustomElement.InGameCurrentPlayerIsOnLedge} on:select={select}>On Ledge</SelectOption>
	<SelectOption description="Current player grabbed flag" value={CustomElement.InGameCurrentPlayerIsGrabbed} on:select={select}>Grabbed</SelectOption>
	<SelectOption description="Current player in tech flag" value={CustomElement.InGameCurrentPlayerIsInTech} on:select={select}>In Tech</SelectOption>
	<SelectOption description="Current player special fall landing flag" value={CustomElement.InGameCurrentPlayerIsWavedashLanding} on:select={select}>Special Landing</SelectOption>
	<SelectOption description="Current player airdodging flag" value={CustomElement.InGameCurrentPlayerIsAirdodging} on:select={select}>Airdodging</SelectOption>
	<SelectOption description="Current player jumps remaining" value={CustomElement.InGameCurrentPlayerJumpsRemaining} on:select={select}>Jumps Remaining</SelectOption>
	<SelectOption description="Current player shield size" value={CustomElement.InGameCurrentPlayerShieldSize} on:select={select}>Shield Size</SelectOption>
	<SelectOption description="Current player L-cancel result — ✓ / ✗ / empty" value={CustomElement.InGameCurrentPlayerLCancel} on:select={select}>L-Cancel</SelectOption>
	<SelectOption description="Current player high-level state category (Jumping, Attacking, Hitstun…)" value={CustomElement.InGameCurrentPlayerStateCategory} on:select={select}>State Category</SelectOption>
	<SelectOption description="Current player last detected technique — clears after 3 seconds" value={CustomElement.InGameCurrentPlayerTechnique} on:select={select}>Technique</SelectOption>
	<SelectOption description="Current game frame number" value={CustomElement.InGameFrame} on:select={select}>Frame</SelectOption>
</div>
