<script lang="ts">
	import { electronEmitter, froggiSettings } from '$lib/utils/store.svelte';

	const toggleBetaOptIn = (optIn: boolean | undefined) => {
		$electronEmitter.emit('BetaOptIn', !Boolean(optIn));
	};
</script>

<div
	class="flex flex-col gap-4 w-full items-center justify-start overflow-auto py-4 border-secondary rounded-md p-4"
>
	<div>
		<h1 class="text-4xl font-bold color-secondary">Beta Releases</h1>
	</div>
	<div class="w-full flex justify-center">
		<button
			class={`rounded-md p-2 ${
				$froggiSettings.betaOptIn ? 'background-success-color' : 'background-danger-color'
			} border-secondary text-secondary-color hover:cursor-pointer disabled:bg-gray-700 disabled:hover:scale-0`}
			on:click={() => toggleBetaOptIn($froggiSettings.betaOptIn)}
		>
			{#if $froggiSettings.betaOptIn}
				Opt Out
			{:else}
				Opt In
			{/if}
		</button>
	</div>
</div>
