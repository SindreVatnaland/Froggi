<script lang="ts">
	import SliderInput from '$lib/components/input/SliderInput.svelte';
	import { CommandType } from '$lib/models/types/commandTypes';
	import { electronEmitter, obsConnection } from '$lib/utils/store.svelte';
	import { flip } from 'svelte/animate';

	const updateVolume = (inputName: string, volume: number) => {
		$electronEmitter.emit('ExecuteCommand', CommandType.Obs, 'SetInputVolume', {
			inputName: inputName,
			inputVolumeMul: volume,
		});
	};

	$: activeItems = $obsConnection.items
		?.filter((item) => item.sceneItemEnabled)
		.map((item) => item.sourceName);
	$: inputs = $obsConnection?.inputs?.filter(
		(input) =>
			activeItems?.includes(input.inputName) || input.inputKind === 'coreaudio_input_capture',
	);
</script>

<div class="flex flex-col gap-2">
	{#each inputs ?? [] as input (input.inputName)}
		<div
			class="flex gap-2 justify-start items-center"
			animate:flip={{ duration: 250 }}
			id={input.inputName}
		>
			<h1 class="text-secondary-color text-xl font-semibold flex-1">{input.inputName}</h1>
			<div class="flex-1">
				<SliderInput
					bind:value={input.volume.inputVolumeMul}
					on:change={(event) => updateVolume(input.inputName, event.detail)}
				/>
			</div>
		</div>
	{/each}
</div>
