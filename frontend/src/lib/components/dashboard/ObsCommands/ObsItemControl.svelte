<script lang="ts">
	import { CommandType } from '$lib/models/types/commandTypes';
	import { electronEmitter, obsConnection } from '$lib/utils/store.svelte';
	import { fly } from 'svelte/transition';

	const toggleItem = (sceneItemId: number, enabled: boolean) => {
		$electronEmitter.emit('ExecuteCommand', CommandType.Obs, 'SetSceneItemEnabled', {
			sceneName: $obsConnection?.scenes?.currentProgramSceneName ?? '',
			sceneItemId: sceneItemId,
			sceneItemEnabled: enabled,
		});
	};
</script>

<div class="flex flex-col gap-2">
	{#each $obsConnection.items ?? [] as item, i}
		<div
			class="flex gap-2 justify-start items-center"
			in:fly={{ duration: 250, x: 150, delay: i * 50 }}
		>
			<h1 class="text-secondary-color text-xl font-semibold flex-1">{item.sourceName}</h1>
			<div class="col-span-1 grid justify-center">
				<input
					type="checkbox"
					class="w-12 h-12"
					bind:checked={item.sceneItemEnabled}
					on:change={() => toggleItem(item.sceneItemId, item.sceneItemEnabled)}
				/>
			</div>
		</div>
	{/each}
</div>
