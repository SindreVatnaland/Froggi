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
		description="Button A Press"
		value={CustomElement.InGamePlayer1ControllerButtonA}
		on:select={select}
	>
		Button A
	</SelectOption>
</div>
<div class="flex flex-col gap-2">
	<SelectOption
		description="Button B Press"
		value={CustomElement.InGamePlayer1ControllerButtonB}
		on:select={select}
	>
		Button B
	</SelectOption>
</div>
<div class="flex flex-col gap-2">
	<SelectOption
		description="Button X Press"
		value={CustomElement.InGamePlayer1ControllerButtonX}
		on:select={select}
	>
		Button X
	</SelectOption>
</div>
<div class="flex flex-col gap-2">
	<SelectOption
		description="Button Y Press"
		value={CustomElement.InGamePlayer1ControllerButtonY}
		on:select={select}
	>
		Button Y
	</SelectOption>
</div>
<!-- <div class="flex flex-col gap-2">
	<SelectOption
		description="Button L Press"
		value={CustomElement.InGamePlayer1ControllerButtonL}
		on:select={select}
	>
		Button L
	</SelectOption>
</div>
<div class="flex flex-col gap-2">
	<SelectOption
		description="Button R Press"
		value={CustomElement.InGamePlayer1ControllerButtonR}
		on:select={select}
	>
		Button R
	</SelectOption>
</div> -->
<div class="flex flex-col gap-2">
	<SelectOption
		description="Button Z Press"
		value={CustomElement.InGamePlayer1ControllerButtonZ}
		on:select={select}
	>
		Button Z
	</SelectOption>
</div>
<div class="flex flex-col gap-2">
	<SelectOption
		description="Button D-Pad Press"
		value={CustomElement.InGamePlayer1ControllerDPad}
		on:select={select}
	>
		D-Pad
	</SelectOption>
</div>
<div class="flex flex-col gap-2">
	<SelectOption
		description="Back L-Analog"
		value={CustomElement.InGamePlayer1ControllerAnalogL}
		on:select={select}
	>
		L-Analog
	</SelectOption>
</div>
<div class="flex flex-col gap-2">
	<SelectOption
		description="Back R-Analog"
		value={CustomElement.InGamePlayer1ControllerAnalogR}
		on:select={select}
	>
		R-Analog
	</SelectOption>
</div>
<div class="flex flex-col gap-2">
	<SelectOption
		description="Left Analog Stick"
		value={CustomElement.InGamePlayer1ControllerAnalogStickL}
		on:select={select}
	>
		Left Analog Stick
	</SelectOption>
</div>
<div class="flex flex-col gap-2">
	<SelectOption
		description="Right Analog Stick"
		value={CustomElement.InGamePlayer1ControllerAnalogStickR}
		on:select={select}
	>
		C-Stick
	</SelectOption>
</div>
