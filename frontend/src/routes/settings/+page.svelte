<script lang="ts">
	import { fade } from 'svelte/transition';
	import Authorization from '$lib/components/obs/settings/Authorization.svelte';
	import SaveLogs from '$lib/components/obs/settings/SaveLogs.svelte';
	import BetaOptIn from '$lib/components/obs/settings/BetaOptIn.svelte';
</script>

<main
	class="fixed h-screen w-screen bg-cover bg-center"
	in:fade={{ delay: 50, duration: 150 }}
	out:fade={{ duration: 300 }}
>
	<div class={`w-full h-full px-2 gap-4 flex flex-col items-center`}>
		<div>
			<h1 class="text-4xl font-bold color-secondary">Settings</h1>
		</div>
		<Authorization />
		<SaveLogs />
		<BetaOptIn />
	</div>
</main>

<style>
</style>
