<script lang="ts">
	import ObsCommandModal from './Modals/ObsCommandModal.svelte';

	let isModalOpen = false;
</script>

<button class="btn text-xs h-8 px-4 border-secondary rounded w-full" on:click={() => (isModalOpen = true)}>
	OBS Commands
</button>

<ObsCommandModal bind:open={isModalOpen} />
