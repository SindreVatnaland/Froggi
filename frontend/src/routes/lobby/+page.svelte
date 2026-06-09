<script lang="ts">
	import LobbyPanel from '$lib/components/lobby/LobbyPanel.svelte';
</script>

<main class="background-primary-color text-secondary-color flex justify-center">
	<div class="w-full max-w-2xl flex flex-col gap-5">
		<div>
			<h1 class="font-bold text-3xl">Lobby</h1>
			<p class="text-sm opacity-50 mt-1">Host or join a shared game lobby</p>
		</div>
		<LobbyPanel />
	</div>
</main>
