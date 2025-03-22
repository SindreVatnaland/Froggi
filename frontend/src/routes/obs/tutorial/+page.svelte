<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
</script>

<main
	class="fixed h-screen w-screen bg-cover bg-center color-secondary"
	in:fade={{ delay: 50, duration: 150 }}
	out:fade={{ duration: 300 }}
>
	<div class="w-full h-full flex flex-col justify-center items-center p-8 gap-8">
		<div>
			<h1 class="font-bold text-4xl">Tutorial</h1>
		</div>
		<div class="flex-1 flex flex-col justify-center items-center h-full w-full gap-4">
			<button
				class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-xl py-2 px-4 border-secondary rounded w-40 h-20"
				on:click={() => goto('/obs/tutorial/new-overlay')}
			>
				Build an overlay
			</button>
			<button
				class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-xl py-2 px-4 border-secondary rounded w-40 h-20"
				on:click={() => goto('/obs/tutorial/integrate-obs')}
			>
				Integrate with OBS
			</button>
			<button
				class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-xl py-2 px-4 border-secondary rounded w-40 h-20"
				on:click={() => goto('/obs/tutorial/remote-obs')}
			>
				Remote control OBS
			</button>
		</div>
	</div>
</main>
