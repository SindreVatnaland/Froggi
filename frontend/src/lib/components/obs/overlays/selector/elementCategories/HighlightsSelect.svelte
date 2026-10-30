<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import { createEventDispatcher } from 'svelte';
	import SelectOption from '../visibilityCategories/SelectVisibilityOption.svelte';

	const dispatch = createEventDispatcher();
	const select = (e: CustomEvent<CustomElement>) => dispatch('select', e.detail);
</script>

<div class="flex flex-col gap-2">
	<SelectOption description="A video or image file, or what a flow's Set media card puts on a key (a file, a web link, a highlight clip from the OBS replay buffer) — every screen in sync" value={CustomElement.PostGameHighlightVideo} on:select={select}>
		Media
	</SelectOption>
	<SelectOption description="Highlights redrawn from their game replays — no OBS needed. Plays the list a flow's Set replay list card puts on a key, transparent background" value={CustomElement.HighlightReplay} on:select={select}>
		Highlight Replay
	</SelectOption>
</div>
