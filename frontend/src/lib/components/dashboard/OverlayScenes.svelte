<script lang="ts">
	import ObsCommandModal from './Modals/ObsCommandModal.svelte';

	let isSceneObsModalOpen = false;

	const openChangeObsSceneModal = () => {
		isSceneObsModalOpen = true;
	};
</script>

<div class="flex flex-col gap-2">
	<div class="flex flex-col gap-2">
		<button
			class={`btn text-lg whitespace-nowrap h-10 px-2 xl:text-xl border-secondary`}
			on:click={openChangeObsSceneModal}
		>
			Commands
		</button>
	</div>
</div>

<ObsCommandModal bind:open={isSceneObsModalOpen} />
