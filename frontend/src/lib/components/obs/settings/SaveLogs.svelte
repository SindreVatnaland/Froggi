<script lang="ts">
	import { electronEmitter } from '$lib/utils/store.svelte';

	const saveLogs = () => {
		$electronEmitter.emit('LogsSave');
	};
	const copyLogs = () => {
		$electronEmitter.emit('LogsCopy');
	};
</script>

<div
	class="flex flex-col gap-4 w-full items-center justify-start overflow-auto py-4 border-secondary rounded-md p-4"
>
	<div>
		<h1 class="text-4xl font-bold color-secondary">Logs</h1>
	</div>
	<div class="w-full flex justify-center gap-2">
		<button
			class="rounded-md p-2 background-success-color border-secondary text-secondary-color hover:cursor-pointer disabled:bg-gray-700 disabled:hover:scale-0"
			on:click={saveLogs}
		>
			Save logs
		</button>
		<button
			class="rounded-md p-2 background-success-color border-secondary text-secondary-color hover:cursor-pointer disabled:bg-gray-700 disabled:hover:scale-0"
			on:click={copyLogs}
		>
			Copy logs
		</button>
	</div>
</div>
