<script lang="ts">
	import Modal from '$lib/components/modal/Modal.svelte';
	import { electronEmitter } from '$lib/utils/store.svelte';

	function importOverlay() {
		$electronEmitter.emit('OverlayUpload');
		open = false;
	}

	function createHorizontalOverlay() {
		$electronEmitter.emit('OverlayCreate', { width: 16, height: 9 });
		open = false;
	}

	function createVerticalOverlay() {
		$electronEmitter.emit('OverlayCreate', { width: 9, height: 16 });
		open = false;
	}

	export let open = false;
</script>

<Modal bind:open on:close={() => (open = false)}>
	<div
		class="w-[400px] min-w-lg flex flex-col gap-4 justify-between bg-cover bg-center boarder-secondary background-primary-color p-4"
	>
		<h1 class="text-center color-secondary text-2xl font-semibold">New overlay</h1>
		<div class="flex flex-col flex-1 gap-4">
			<button
				class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 px-2 xl:text-xl border-secondary"
				on:click={createHorizontalOverlay}
			>
				Create Blank - Horizontal
			</button>

			<button
				class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 px-2 xl:text-xl border-secondary"
				on:click={createVerticalOverlay}
			>
				Create Blank - Vertical
			</button>

			<button
				class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 px-2 xl:text-xl border-secondary"
				on:click={importOverlay}
				data-tooltip="Import overlay"
			>
				Import
			</button>
		</div>
	</div>
</Modal>
