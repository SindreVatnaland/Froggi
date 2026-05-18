<script lang="ts">
	import AddControllerCommandModal from '$lib/components/dashboard/Modals/AddControllerCommandModal.svelte';
	import ButtonCommand from '$lib/components/dashboard/ObsCommands/ButtonCommand.svelte';
	import ToggleControllerCommand from '$lib/components/dashboard/ObsCommands/ToggleControllerCommand.svelte';
	import { controller } from '$lib/utils/store.svelte';

	let isNewCommandModalOpen = false;

	$: isControllerCommandEnabled = $controller.enabled;
</script>

<div class="flex flex-col gap-2">
	<h1 class="text-2xl font-bold text-secondary-color">Controller Commands</h1>
	<ToggleControllerCommand />
	<div class="flex flex-col gap-4" style={`opacity: ${isControllerCommandEnabled ? 1 : 0.5}`}>
		{#each $controller?.inputCommands ?? [] as controllerCommand}
			<ButtonCommand {controllerCommand} />
			<hr />
		{/each}
	</div>
	<div class="flex justify-center" style={`opacity: ${isControllerCommandEnabled ? 1 : 0.5}`}>
		<button
			class="btn text-md whitespace-nowrap w-full h-12 p-2 xl:text-xl border-secondary"
			on:click={() => (isNewCommandModalOpen = true)}
		>
			Add New Command
		</button>
	</div>
</div>
<AddControllerCommandModal bind:open={isNewCommandModalOpen} />
