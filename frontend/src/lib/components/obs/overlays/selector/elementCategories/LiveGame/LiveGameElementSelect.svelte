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
		description="The live game rendered with a camera that follows the players (like the shared /live page). Empty when no game is running."
		value={CustomElement.InGameLiveCamera}
		on:select={select}
	>
		Live Camera
	</SelectOption>
	<SelectOption
		description="Static full-stage view with live character graphics — the animated player radar"
		value={CustomElement.InGamePlayerRadarAnimated}
		on:select={select}
	>
		Animated Player Radar
	</SelectOption>
</div>
