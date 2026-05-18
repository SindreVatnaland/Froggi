<script lang="ts">
	import SceneSelect from '$lib/components/obs/overlays/selector/SceneSelect.svelte';
	import ObsSceneSelect from '$lib/components/dashboard/ObsCommands/ObsSceneSelect.svelte';
	import Modal from '$lib/components/modal/Modal.svelte';
	import ObsItemControl from '../ObsCommands/ObsItemControl.svelte';
	import ObsVolumeControl from '../ObsCommands/ObsVolumeControl.svelte';
	import ToggleControllerCommand from '../ObsCommands/ToggleControllerCommand.svelte';
	import ToggleSceneSwitchCommand from '../ObsCommands/ToggleSceneSwitchCommand.svelte';

	export let open: boolean;
</script>

<Modal
	bind:open
	on:close={() => (open = false)}
	class="w-[95vw] max-w-[600px] min-w-72 flex justify-center"
>
	<div
		class="w-full h-full max-h-[80vh] min-w-lg flex flex-col justify-between gap-8 bg-cover bg-center border-secondary background-primary-color p-8"
	>
		<div class="flex gap-2 justify-center items-center">
			<h1 class="text-3xl font-semibold text-secondary-color">Obs Settings</h1>
		</div>
		<div class="flex flex-col gap-8 overflow-auto">
			<ToggleControllerCommand />
			<ToggleSceneSwitchCommand />

			<div class="flex flex-col gap-2">
				<h1 class="text-xl font-semibold text-secondary-color">Change Overlay Scene:</h1>
				<SceneSelect />
			</div>
			<div>
				<h1 class="text-xl font-semibold text-secondary-color">Change OBS Scene:</h1>
				<ObsSceneSelect />
			</div>
			<div class="flex flex-col gap-2">
				<h1 class="text-xl font-semibold text-secondary-color">Scene Items Control:</h1>
				<ObsItemControl />
			</div>
			<div class="flex flex-col gap-2">
				<h1 class="text-xl font-semibold text-secondary-color">Volume Control:</h1>
				<ObsVolumeControl />
			</div>
		</div>
	</div>
</Modal>
