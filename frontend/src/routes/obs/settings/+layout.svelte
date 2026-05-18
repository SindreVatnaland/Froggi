<script lang="ts">
	import { fade } from 'svelte/transition';
</script>

<main
	class="fixed h-screen w-screen bg-cover bg-center"
	in:fade={{ delay: 50, duration: 150 }}
	out:fade={{ duration: 300 }}
>
	<div class={`w-full h-full px-2 gap-4 flex flex-col justify-between items-center`}>
		<div>
			<h1 class="text-4xl font-bold text-secondary-color">OBS Settings</h1>
		</div>
		<div class="flex-1 flex flex-col gap-8 w-full overflow-auto p-2 items-center">
			<slot />
		</div>
	</div>
</main>

<style>
</style>
