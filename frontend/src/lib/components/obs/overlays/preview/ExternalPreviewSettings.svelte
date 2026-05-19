<script lang="ts">
	import FileToBase64Input from '$lib/components/input/FileToBase64Input.svelte';

	export let base64: string;

	const reset = () => {
		base64 = '';
	};
</script>

<div class="flex gap-1.5 items-end">
	<div class="flex-1 min-w-0">
		<FileToBase64Input
			compact
			buttonLabel="Add Background"
			bind:base64
			acceptedExtensions={'.jpg, .jpeg, .png, .gif, .svg, .webp'}
		/>
	</div>
	<button
		class="btn text-xs whitespace-nowrap h-7 px-3 border-secondary rounded"
		on:click={() => reset()}
	>
		Reset
	</button>
</div>
