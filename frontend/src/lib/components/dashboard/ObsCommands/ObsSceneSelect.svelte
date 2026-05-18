<script lang="ts">
	import { CommandType } from '$lib/models/types/commandTypes';
	import { electronEmitter, obsConnection } from '$lib/utils/store.svelte';
	import { fly } from 'svelte/transition';

	const switchScene = (sceneName: string) => {
		$electronEmitter.emit('ExecuteCommand', CommandType.Obs, 'SetCurrentProgramScene', {
			sceneName: sceneName,
		});
	};

	$: scenes = $obsConnection.scenes?.scenes.sort((a, b) =>
		a.sceneName.localeCompare(b.sceneName),
	);
</script>

<div class="flex flex-wrap gap-2">
	{#each scenes ?? [] as scene}
		<div class="flex gap-2 justify-start items-center" in:fly={{ duration: 250, x: 150 }}>
			<button
				class={`btn text-md whitespace-nowrap h-10 px-2 xl:text-xl border rounded-sm ${
					$obsConnection.scenes?.currentProgramSceneName === scene.sceneName
						? 'border-secondary bg-opacity-50'
						: 'border-white'
				}`}
				on:click={() => {
					switchScene(scene?.sceneName);
				}}
			>
				{scene?.sceneName}
			</button>
		</div>
	{/each}
</div>
