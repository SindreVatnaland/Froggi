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
		description="Player Radar Hud (From Ultimate)"
		value={CustomElement.InGamePlayerRadar}
		on:select={select}
	>
		Player Radar
	</SelectOption>
	<SelectOption
		description="Player Radar with live character animations (SlippiLab-style)"
		value={CustomElement.InGamePlayerRadarAnimated}
		on:select={select}
	>
		Player Radar (Animated)
	</SelectOption>
	<SelectOption
		description="Image of the current stage"
		value={CustomElement.InGameStage}
		on:select={select}
	>
		Stage
	</SelectOption>
	<SelectOption
		description="In Game Timer Minutes - 08:"
		value={CustomElement.InGameTimerMinutes}
		on:select={select}
	>
		Timer Minutes
	</SelectOption>
	<SelectOption
		description="In Game Timer Seconds - :00."
		value={CustomElement.InGameTimerSeconds}
		on:select={select}
	>
		Timer Seconds
	</SelectOption>
	<SelectOption
		description="In Game Timer Milliseconds 3 Decimals - .000"
		value={CustomElement.InGameTimerMilliseconds3}
		on:select={select}
	>
		Timer Milliseconds 3
	</SelectOption>
	<SelectOption
		description="In Game Timer Milliseconds 2 Decimals - .00"
		value={CustomElement.InGameTimerMilliseconds2}
		on:select={select}
	>
		Timer Milliseconds 2
	</SelectOption>
	<SelectOption
		description="In Game Timer Milliseconds 1 Decimal - .0"
		value={CustomElement.InGameTimerMilliseconds1}
		on:select={select}
	>
		Timer Milliseconds 1
	</SelectOption>
	<SelectOption
		description="In Game Time Second Count Down - 480 - 0"
		value={CustomElement.InGameTimerSecondsCountdown}
		on:select={select}
	>
		Timer Countdown
	</SelectOption>
</div>
