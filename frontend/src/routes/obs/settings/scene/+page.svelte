<script lang="ts">
	import SceneCommands from '$lib/components/obs/settings/SceneCommands.svelte';
</script>

<h1 class="text-xl font-semibold text-secondary-color mb-1">Scene Commands</h1>
<p class="text-xs opacity-40 mb-6 leading-relaxed">
	Froggi watches your game state and automatically triggers OBS commands. For example: switch to
	your gameplay scene when a game starts, or return to your menu scene when it ends. Commands run
	silently in the background — no manual input needed.
</p>

<div class="w-full max-w-[28rem]">
	<SceneCommands />
</div>
