<script lang="ts">
	import { goto } from '$app/navigation';
	import { isAuthorized } from '$lib/utils/store.svelte';
	import { fade } from 'svelte/transition';
</script>

<main
	class="fixed h-screen w-screen bg-cover bg-center"
	in:fade={{ delay: 50, duration: 150 }}
	out:fade={{ duration: 300 }}
>
	<div class="w-full h-full flex flex-col justify-center items-center p-8 gap-8">
		<div>
			<h1 class="font-bold text-4xl text-secondary-color">OBS</h1>
		</div>
		<div class="flex-1 flex flex-col justify-center items-center h-full w-full gap-4">
			<button
				class="btn text-xl py-2 px-4 border border-secondary rounded w-40 min-h-[5rem]"
				on:click={() => goto('/obs/tutorial')}
			>
				Tutorial
			</button>
			<button
				class="btn text-xl py-2 px-4 border border-secondary rounded w-40 min-h-[5rem]"
				on:click={() => goto('/obs/overlay')}
			>
				Overlays
			</button>

			<button
				class="btn text-xl py-2 px-4 border border-secondary rounded w-40 min-h-[5rem] disabled:text-zinc-700 disabled:border-zinc-700 disabled:hover:pointer-events-none disabled:hover:scale-100"
				on:click={() => goto('/obs/settings')}
				disabled={!$isAuthorized}
			>
				OBS Settings
			</button>
			<button
				class="btn text-xl py-2 px-4 border border-secondary rounded w-40 min-h-[5rem] disabled:text-zinc-700 disabled:border-zinc-700 disabled:hover:pointer-events-none disabled:hover:scale-100"
				on:click={() => goto('/obs/dashboard')}
				disabled={!$isAuthorized}
			>
				Dashboard
			</button>
		</div>
	</div>
</main>
