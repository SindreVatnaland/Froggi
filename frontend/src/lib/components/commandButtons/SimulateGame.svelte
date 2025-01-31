<script lang="ts">
	import { electronEmitter } from '$lib/utils/store.svelte';

	function simulateGame() {
		$electronEmitter.emit('SimulateGameStart');
	}

	function simulateGameEnd() {
		$electronEmitter.emit('SimulateGameEnd');
	}
</script>

<div class="flex gap-2">
	<button
		class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 px-2 xl:text-xl border-secondary"
		on:click={simulateGame}
	>
		Simulate Game Start
	</button>
	<button
		class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 px-2 xl:text-xl border-secondary"
		on:click={simulateGameEnd}
	>
		Simulate Game End
	</button>
</div>
