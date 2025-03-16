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
	<SelectOption description="Customizable box" value={CustomElement.CustomBox} on:select={select}>
		Custom Box
	</SelectOption>
	<SelectOption
		description="Upload and utilize a custom image"
		value={CustomElement.CustomImage}
		on:select={select}
	>
		Custom Image
	</SelectOption>
	<SelectOption
		description="Customizable text"
		value={CustomElement.CustomString}
		on:select={select}
	>
		Custom Text
	</SelectOption>
	<SelectOption description="Embed url" value={CustomElement.CustomBoxIframe} on:select={select}>
		Embed URL
	</SelectOption>
</div>
