<script lang="ts">
	import { electronEmitter } from '$lib/utils/store.svelte';
	import { tooltip } from 'svooltip';

	function simulateGame() {
		$electronEmitter.emit('SimulateGameStart');
	}

	function simulateGameEnd() {
		$electronEmitter.emit('SimulateGameEnd');
	}
</script>

<div class="flex gap-2">
	<button
		use:tooltip={{
			content: `<p>Simulate an entire game using your most recent online replay</p>`,
			html: true,
			placement: 'top',
			delay: [1000, 0],
			offset: 25,
		}}
		class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 px-2 xl:text-xl border-secondary"
		on:click={simulateGame}
	>
		Simulate Game Start
	</button>
	<button
		use:tooltip={{
			content: `<p>Simulate Game End using your most recent online replay</p>`,
			html: true,
			placement: 'top',
			delay: [1000, 0],
			offset: 25,
		}}
		class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 px-2 xl:text-xl border-secondary"
		on:click={simulateGameEnd}
	>
		Simulate Game End
	</button>
</div>
